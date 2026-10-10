const Event = require('../models/Event');
const { processTranscript } = require('./gemini');
const { indexTranscript } = require('./search');

/**
 * Parse a Gemini due date. Date-only strings ("2026-10-11") are pinned to local noon:
 * `new Date('2026-10-11')` is UTC midnight, which is the previous evening in US timezones
 * and would put the task on the wrong calendar day.
 */
function parseDueDate(value, fallback) {
  if (!value) return fallback;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  }
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? fallback : parsed;
}

/**
 * Run a saved transcript through Gemini: summary -> "What Happened" event, action items -> tasks,
 * then index it for search. Replaces any events previously generated from this transcript.
 * @param {object} [options]
 * @param {boolean} [options.useAiTitle] - Replace the label with Gemini's title (for recordings saved without a name)
 * @returns {Promise<{transcript, summaryEvent, tasks}>}
 */
async function ingestTranscript(transcript, { useAiTitle = false } = {}) {
  const aiResult = await processTranscript(transcript.content, transcript.label, transcript.date);

  if (useAiTitle && aiResult.title) {
    transcript.label = aiResult.title;
  }

  await Event.deleteMany({ transcriptId: transcript._id });

  let summaryEvent = null;
  if (aiResult.summary) {
    summaryEvent = await Event.create({
      title: transcript.label,
      type: 'event',
      date: transcript.date,
      summary: aiResult.summary,
      transcriptId: transcript._id
    });
  }

  let tasks = [];
  if (aiResult.tasks.length > 0) {
    tasks = await Event.insertMany(aiResult.tasks.map(task => ({
      title: task.title,
      type: 'task',
      date: parseDueDate(task.dueDate, transcript.date),
      time: task.time || null,
      completed: false,
      transcriptId: transcript._id
    })));
  }

  transcript.summary = aiResult.summary;
  transcript.processed = true;

  // Search is a nice-to-have; never lose the summary and tasks because embedding failed
  try {
    await indexTranscript(transcript);
  } catch (error) {
    console.error('Search indexing failed:', error.message);
  }

  await transcript.save();

  return { transcript, summaryEvent, tasks };
}

module.exports = {
  ingestTranscript,
  parseDueDate
};
