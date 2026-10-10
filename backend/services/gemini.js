const { GoogleGenerativeAI } = require('@google/generative-ai');

//initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const JSON_CONFIG = { responseMimeType: 'application/json' };

function parseJSON(text) {
  // Clean up the response - remove markdown code blocks if present
  const cleanedText = text.trim().replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
  return JSON.parse(cleanedText);
}

/**
 * Process a transcript and extract tasks + summary
 * @param {string} content - The transcript content
 * @param {string} label - The transcript label (person/topic name)
 * @param {Date} transcriptDate - The date of the transcript
 * @returns {Promise<{title: string, summary: string, tasks: Array}>}
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
  "title": "If the conversation is mainly with one named person, their name. Otherwise a short 2-4 word topic title.",
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
    title: (parsed.title || '').trim(),
    summary: parsed.summary || '',
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks.filter(task => task && task.title) : []
  };
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
  processTranscript,
  generateDailySummary
};
