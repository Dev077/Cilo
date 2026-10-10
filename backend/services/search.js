const Transcript = require('../models/Transcript');

const SNIPPET_LENGTH = 220;

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Pick the sentence that mentions the most query words, so a result shows why it matched.
 * Words are compared by prefix (first 4 letters) to roughly line up with Mongo's stemming,
 * e.g. "meeting" in the query still highlights "meet" in the text.
 */
function bestSnippet(transcript, query) {
  const terms = query.toLowerCase().split(/\W+/).filter(term => term.length > 1);
  const prefixes = terms.map(term => term.slice(0, 4));
  const sentences = (transcript.content || '').split(/(?<=[.!?])\s+/).filter(Boolean);

  let best = null;
  let bestHits = 0;
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    const hits = prefixes.filter(prefix => lower.includes(prefix)).length;
    if (hits > bestHits) {
      best = sentence;
      bestHits = hits;
    }
  }

  const snippet = best || transcript.summary || transcript.content || '';
  return snippet.length > SNIPPET_LENGTH ? `${snippet.slice(0, SNIPPET_LENGTH).trim()}…` : snippet;
}

/**
 * Keyword search over transcripts using MongoDB's text index (stemmed, weighted towards the
 * label and summary). If no whole word matches, fall back to a substring match so
 * partially-typed words like "pri" still find "Priya".
 */
async function searchTranscripts(query, limit = 10) {
  let transcripts = await Transcript.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } }).limit(limit).lean();

  if (transcripts.length === 0) {
    const pattern = new RegExp(escapeRegex(query), 'i');
    transcripts = await Transcript.find({
      $or: [{ label: pattern }, { summary: pattern }, { content: pattern }]
    }).sort({ date: -1 }).limit(limit).lean();
  }

  return transcripts.map(({ score, ...transcript }) => ({
    transcript,
    score: score || 0,
    snippet: bestSnippet(transcript, query)
  }));
}

module.exports = {
  searchTranscripts
};
