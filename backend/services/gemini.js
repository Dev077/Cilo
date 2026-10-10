const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { GoogleGenerativeAI, TaskType } = require('@google/generative-ai');
const { GoogleAIFileManager, FileState } = require('@google/generative-ai/server');

//initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

// Requests to Gemini are capped at 20MB, so anything near that goes through the Files API instead
const INLINE_AUDIO_LIMIT = 15 * 1024 * 1024;
const EMBED_BATCH_SIZE = 100;

const JSON_CONFIG = { responseMimeType: 'application/json' };

function parseJSON(text) {
  // Clean up the response - remove markdown code blocks if present
  const cleanedText = text.trim().replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
  return JSON.parse(cleanedText);
}

/**
 * Upload audio to the Gemini Files API and wait until it's ready to use
 * @returns {Promise<{fileData: {mimeType: string, fileUri: string}, name: string}>}
 */
async function uploadAudioFile(buffer, mimeType) {
  const tmpPath = path.join(os.tmpdir(), `cilo-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await fs.writeFile(tmpPath, buffer);

  try {
    const upload = await fileManager.uploadFile(tmpPath, { mimeType, displayName: 'cilo-recording' });
    let file = upload.file;
    while (file.state === FileState.PROCESSING) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      file = await fileManager.getFile(file.name);
    }
    if (file.state !== FileState.ACTIVE) {
      throw new Error(`Gemini could not process the audio file (state: ${file.state})`);
    }
    return { fileData: { mimeType: file.mimeType, fileUri: file.uri }, name: file.name };
  } finally {
    await fs.unlink(tmpPath).catch(() => {});
  }
}

/**
 * Transcribe a recording and work out who/what it was about
 * @param {Buffer} buffer - The raw audio
 * @param {string} mimeType - e.g. 'audio/mp4', 'audio/webm'
 * @returns {Promise<{content: string, label: string, type: 'person'|'topic', participants: string[]}>}
 */
async function transcribeAudio(buffer, mimeType) {
  let audioPart;
  let uploadedName = null;

  if (buffer.length < INLINE_AUDIO_LIMIT) {
    audioPart = { inlineData: { data: buffer.toString('base64'), mimeType } };
  } else {
    const uploaded = await uploadAudioFile(buffer, mimeType);
    audioPart = { fileData: uploaded.fileData };
    uploadedName = uploaded.name;
  }

  const prompt = `Transcribe this audio recording of a conversation or voice note.

Return a JSON response with the following structure:
{
  "content": "The full transcript. Start each turn on a new line as 'Name: what they said'. Use a speaker's real name if it is said in the conversation, otherwise 'Speaker 1', 'Speaker 2', etc. If there is only one speaker, omit the labels.",
  "label": "If the conversation is mainly with one named person, their name. Otherwise a short 2-4 word topic title.",
  "type": "'person' if the label is a person's name, otherwise 'topic'",
  "participants": ["Names (or Speaker N labels) of everyone who spoke"]
}

Rules:
1. Transcribe what was actually said. Do not summarize, and lightly clean up filler words ("um", "uh") only.
2. If there is no intelligible speech, return an empty string for content.
3. Return ONLY valid JSON, no additional text`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [audioPart, { text: prompt }] }],
      generationConfig: JSON_CONFIG,
    });
    const parsed = parseJSON(result.response.text());

    return {
      content: (parsed.content || '').trim(),
      label: (parsed.label || '').trim() || 'Voice note',
      type: parsed.type === 'person' ? 'person' : 'topic',
      participants: Array.isArray(parsed.participants) ? parsed.participants : [],
    };
  } finally {
    if (uploadedName) {
      fileManager.deleteFile(uploadedName).catch(() => {});
    }
  }
}

/**
 * Process a transcript and extract tasks + summary
 * @param {string} content - The transcript content
 * @param {string} label - The transcript label (person/topic name)
 * @param {Date} transcriptDate - The date of the transcript
 * @returns {Promise<{summary: string, tasks: Array}>}
 */
async function processTranscript(content, label, transcriptDate) {
  const dateStr = transcriptDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const prompt = `You are analyzing a conversation transcript. Extract useful information from it.

TRANSCRIPT LABEL: ${label}
TRANSCRIPT DATE: ${dateStr}

TRANSCRIPT CONTENT:
${content}

Please analyze this transcript and return a JSON response with the following structure:
{
  "summary": "A 2-3 sentence summary of what was discussed and any key decisions made",
  "tasks": [
    {
      "title": "Brief task description",
      "time": "Time if mentioned (e.g., '10:00 AM', '2:00 PM'), or null if not specified",
      "dueDate": "Due date if mentioned in ISO format (YYYY-MM-DD), or null if not specified. Resolve relative dates like 'tomorrow', 'next Monday', 'Friday' based on the transcript date."
    }
  ]
}

Rules:
1. Only extract ACTUAL tasks, action items, or commitments mentioned in the conversation (e.g., "I'll send the report", "Let's meet on Friday", "Can you review this by tomorrow")
2. Do not make up tasks that weren't discussed
3. If no tasks were mentioned, return an empty tasks array
4. Keep the summary concise and factual
5. Return ONLY valid JSON, no additional text`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: JSON_CONFIG,
  });
  const parsed = parseJSON(result.response.text());

  return {
    summary: parsed.summary || '',
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks.filter(task => task && task.title) : []
  };
}

/**
 * Embed transcript chunks for semantic search
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
async function embedDocuments(texts) {
  const embeddings = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBED_BATCH_SIZE);
    const result = await embeddingModel.batchEmbedContents({
      requests: batch.map(text => ({
        content: { role: 'user', parts: [{ text }] },
        taskType: TaskType.RETRIEVAL_DOCUMENT,
      })),
    });
    embeddings.push(...result.embeddings.map(e => e.values));
  }
  return embeddings;
}

/**
 * Embed a search query
 * @param {string} query
 * @returns {Promise<number[]>}
 */
async function embedQuery(query) {
  const result = await embeddingModel.embedContent({
    content: { role: 'user', parts: [{ text: query }] },
    taskType: TaskType.RETRIEVAL_QUERY,
  });
  return result.embedding.values;
}

/**
 * generate a daily summary from multiple transcripts
 * @param {Array} transcripts - Array of transcript objects
 * @returns {Promise<string>}
 */
async function generateDailySummary(transcripts) {
  if (!transcripts || transcripts.length === 0) {
    return 'No conversations recorded for this period.';
  }

  const transcriptSummaries = transcripts.map(t =>
    `- ${t.label}: ${t.summary || 'No summary available'}`
  ).join('\n');

  const prompt = `Based on these conversation summaries from recent days, provide a brief overview of what the user has been working on and any notable events:

${transcriptSummaries}

Write 2-3 sentences summarizing the key themes and activities. Be concise and conversational.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating daily summary:', error);
    return 'Unable to generate summary at this time.';
  }
}

module.exports = {
  transcribeAudio,
  processTranscript,
  embedDocuments,
  embedQuery,
  generateDailySummary
};
