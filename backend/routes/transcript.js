const express = require('express');
const router = express.Router();
const Transcript = require('../models/Transcript');

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
// @desc    Create a new transcript
router.post('/', async (req, res) => {
  try {
    const transcript = new Transcript({
      label: req.body.label,
      type: req.body.type,
      date: req.body.date || Date.now(),
      duration: req.body.duration,
      content: req.body.content,
      color: req.body.color,
      participants: req.body.participants,
      tags: req.body.tags
    });

    const savedTranscript = await transcript.save();
    res.status(201).json(savedTranscript);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
// @desc    Delete a transcript
router.delete('/:id', async (req, res) => {
  try {
    const transcript = await Transcript.findByIdAndDelete(req.params.id);

    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    res.json({ message: 'Transcript deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;