const express = require('express');
const router = express.Router();
const Transcript = require('../models/Transcript');
const Event = require('../models/Event');
const { ingestTranscript } = require('../services/ingest');
const { searchTranscripts } = require('../services/search');

// Pastel sticky-note colors, matching the app
const NOTE_COLORS = ['#FEF3E2', '#E8F5E9', '#E3F2FD', '#FFF3E0', '#FCE4EC', '#EDE7F6', '#E0F7FA', '#F3E5F5'];

// @route   GET /api/transcripts
// @desc    Get all transcripts
router.get('/', async (req, res) => {
  try {
    const transcripts = await Transcript.find().sort({ date: -1 });
    res.json(transcripts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/transcripts/search?q=...
// @desc    Keyword search over transcripts
router.get('/search', async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    if (query.length < 2) {
      return res.json([]);
    }
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    res.json(await searchTranscripts(query, limit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/transcripts/:id
// @desc    Get single transcript by ID
router.get('/:id', async (req, res) => {
  try {
    const transcript = await Transcript.findById(req.params.id);
    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }
    res.json(transcript);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/transcripts/date/:date
// @desc    Get transcripts by date (YYYY-MM-DD)
router.get('/date/:date', async (req, res) => {
  try {
    const startDate = new Date(req.params.date);
    const endDate = new Date(req.params.date);
    endDate.setDate(endDate.getDate() + 1);

    const transcripts = await Transcript.find({
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ date: -1 });

    res.json(transcripts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/transcripts/month/:year/:month
// @desc    Get transcripts for a specific month
router.get('/month/:year/:month', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month) - 1; // JS months are 0-indexed

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 1);

    const transcripts = await Transcript.find({
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ date: -1 });

    res.json(transcripts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/transcripts
// @desc    Create a new transcript and process with AI. Label is optional; without one, AI names it.
router.post('/', async (req, res) => {
  try {
    const label = (req.body.label || '').trim();

    const transcript = new Transcript({
      label: label || 'Voice note',
      type: req.body.type,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      duration: req.body.duration,
      content: req.body.content,
      color: req.body.color || NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      participants: req.body.participants,
      processed: false
    });

    await transcript.save();

    let tasks = [];
    if (transcript.content && transcript.content.trim().length > 0) {
      try {
        ({ tasks } = await ingestTranscript(transcript, { useAiTitle: !label }));
      } catch (aiError) {
        console.error('AI processing failed:', aiError);
        // Don't fail the request; it can be retried with POST /:id/process
      }
    }

    res.status(201).json({ ...transcript.toObject(), tasks });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/transcripts/:id/process
// @desc    Process an existing transcript with AI (for reprocessing or missed transcripts)
router.post('/:id/process', async (req, res) => {
  try {
    const transcript = await Transcript.findById(req.params.id);
    
    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    if (!transcript.content || transcript.content.trim().length === 0) {
      return res.status(400).json({ message: 'Transcript has no content to process' });
    }

    const { summaryEvent, tasks } = await ingestTranscript(transcript);

    res.json({
      transcript,
      tasksCreated: tasks.length,
      eventCreated: Boolean(summaryEvent)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/transcripts/:id
// @desc    Update a transcript
router.put('/:id', async (req, res) => {
  try {
    const transcript = await Transcript.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    res.json(transcript);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/transcripts/:id
// @desc    Delete a transcript and its associated events
router.delete('/:id', async (req, res) => {
  try {
    const transcript = await Transcript.findByIdAndDelete(req.params.id);

    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    // Also delete associated events
    await Event.deleteMany({ transcriptId: req.params.id });

    res.json({ message: 'Transcript deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;