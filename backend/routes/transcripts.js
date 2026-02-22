const express = require('express');
const router = express.Router();
const Transcript = require('../models/Transcript');
const Event = require('../models/Event');
const { processTranscript } = require('../services/gemini');

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
// @desc    Create a new transcript and process with AI
router.post('/', async (req, res) => {
  try {
    const transcriptDate = req.body.date ? new Date(req.body.date) : new Date();
    
    //create the transcript first
    const transcript = new Transcript({
      label: req.body.label,
      type: req.body.type,
      date: transcriptDate,
      duration: req.body.duration,
      content: req.body.content,
      color: req.body.color,
      participants: req.body.participants,
      processed: false
    });

    const savedTranscript = await transcript.save();

    // Process with Gemini if there's content
    if (req.body.content && req.body.content.trim().length > 0) {
      try {
        const aiResult = await processTranscript(
          req.body.content,
          req.body.label,
          transcriptDate
        );

        // Update transcript with summary
        savedTranscript.summary = aiResult.summary;
        savedTranscript.processed = true;
        await savedTranscript.save();

        // Create tasks as events
        if (aiResult.tasks && aiResult.tasks.length > 0) {
          const events = aiResult.tasks.map(task => ({
            title: task.title,
            type: 'task',
            date: task.dueDate ? new Date(task.dueDate) : transcriptDate,
            time: task.time || null,
            completed: false,
            transcriptId: savedTranscript._id
          }));

          await Event.insertMany(events);
        }
      } catch (aiError) {
        console.error('AI processing failed:', aiError);
        // Don't fail the request, just log the error
      }
    }

    res.status(201).json(savedTranscript);
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

    const aiResult = await processTranscript(
      transcript.content,
      transcript.label,
      transcript.date
    );

    // Update transcript with summary
    transcript.summary = aiResult.summary;
    transcript.processed = true;
    await transcript.save();

    // Create tasks as events (delete old ones first if reprocessing)
    await Event.deleteMany({ transcriptId: transcript._id, type: 'task' });
    
    if (aiResult.tasks && aiResult.tasks.length > 0) {
      const events = aiResult.tasks.map(task => ({
        title: task.title,
        type: 'task',
        date: task.dueDate ? new Date(task.dueDate) : transcript.date,
        time: task.time || null,
        completed: false,
        transcriptId: transcript._id
      }));

      await Event.insertMany(events);
    }

    res.json({
      transcript,
      tasksCreated: aiResult.tasks ? aiResult.tasks.length : 0
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

    //also delete associated events
    await Event.deleteMany({ transcriptId: req.params.id });

    res.json({ message: 'Transcript deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;