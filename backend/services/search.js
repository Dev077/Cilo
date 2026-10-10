const Transcript = require('../models/Transcript');
const { embedDocuments, embedQuery } = require('./gemini');

// Small overlapping windows keep each embedding focused, so a search hit can point at the right part of a long conversation
const CHUNK_WORDS = 300;
const CHUNK_OVERLAP = 50;
// Transcripts saved before search existed get indexed lazily; cap how many per search so one query can't stall
const LAZY_INDEX_LIMIT = 20;

function chunkText(text) {
  const words = (text || '').split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let start = 0; start < words.length; start += CHUNK_WORDS - CHUNK_OVERLAP) {
    chunks.push(words.slice(start, start + CHUNK_WORDS).join(' '));
    if (start + CHUNK_WORDS >= words.length) break;
  }
  return chunks;
}

/**
 * Build the search chunks for a transcript (label + summary first, then the content).
 * Mutates the document; the caller saves it.
 */
async function indexTranscript(transcript) {
  const header = [transcript.label, transcript.summary].filter(Boolean).join('. ');
  const texts = [header, ...chunkText(transcript.content)].filter(Boolean);
  const embeddings = texts.length > 0 ? await embedDocuments(texts) : [];

  transcript.chunks = texts.map((text, i) => ({ text, embedding: embeddings[i] }));
  return transcript;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

/**
 * Rank transcripts by how closely their best-matching chunk matches the query.
 * Brute force over every chunk, which is plenty fast for a personal app's volume.
 */
async function searchTranscripts(query, limit = 10) {
  const queryEmbedding = await embedQuery(query);
  const transcripts = await Transcript.find().select('+chunks');

  const unindexed = transcripts.filter(t => !t.chunks || t.chunks.length === 0).slice(0, LAZY_INDEX_LIMIT);
  for (const transcript of unindexed) {
    try {
      await indexTranscript(transcript);
      await transcript.save();
    } catch (error) {
      console.error(`Failed to index transcript ${transcript._id}:`, error.message);
    }
  }

  const results = [];
  for (const transcript of transcripts) {
    let best = null;
    for (const chunk of transcript.chunks || []) {
      if (!chunk.embedding || chunk.embedding.length === 0) continue;
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (!best || score > best.score) best = { score, text: chunk.text };
    }
    if (!best) continue;

    const { chunks, ...rest } = transcript.toObject();
    results.push({ transcript: rest, score: best.score, snippet: best.text });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

module.exports = {
  indexTranscript,
  searchTranscripts
};
