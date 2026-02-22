const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// @route   GET /api/events
// @desc    Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 }).populate('transcriptId');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/events/tasks
// @desc    Get all tasks (for to-do list)
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Event.find({ type: 'task' }).sort({ date: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/events/tasks/pending
// @desc    Get pending tasks
router.get('/tasks/pending', async (req, res) => {
  try {
    const tasks = await Event.find({ 
      type: 'task',
      completed: false 
    }).sort({ date: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/events/past
// @desc    Get past events (what happened)
router.get('/past', async (req, res) => {
  try {
    const events = await Event.find({ 
      type: 'event',
      date: { $lt: new Date() }
    }).sort({ date: -1 }).limit(10).populate('transcriptId');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/events/date/:date
// @desc    Get events by date (YYYY-MM-DD)
router.get('/date/:date', async (req, res) => {
  try {
    const startDate = new Date(req.params.date);
    const endDate = new Date(req.params.date);
    endDate.setDate(endDate.getDate() + 1);

    const events = await Event.find({
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ time: 1 }).populate('transcriptId');

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/events/summary/today
// @desc    Get today's summary (today's tasks + backlog + past events)
router.get('/summary/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get today's tasks (completed or not)
    const todaysTasks = await Event.find({
      type: 'task',
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ time: 1 });

    // Get backlog: incomplete tasks from before today
    const backlogTasks = await Event.find({
      type: 'task',
      completed: false,
      date: { $lt: today }
    }).sort({ date: 1 });

    // Combine: today's tasks first, then backlog
    const tasks = [...todaysTasks, ...backlogTasks];

    // Get recent past events (last 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const pastEvents = await Event.find({
      type: 'event',
      date: {
        $gte: weekAgo,
        $lt: today
      }
    }).sort({ date: -1 }).limit(5).populate('transcriptId');

    res.json({
      tasks,
      pastEvents
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('transcriptId');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/events
// @desc    Create a new event
router.post('/', async (req, res) => {
  try {
    const event = new Event({
      title: req.body.title,
      type: req.body.type,
      date: req.body.date || Date.now(),
      time: req.body.time,
      completed: req.body.completed || false,
      summary: req.body.summary,
      transcriptId: req.body.transcriptId
    });

    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PATCH /api/events/:id/toggle
// @desc    Toggle task completion
router.patch('/:id/toggle', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.completed = !event.completed;
    await event.save();

    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;