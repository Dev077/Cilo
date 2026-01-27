const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['task', 'event'],
    default: 'event'
  },
  date: {
    type: Date,
    default: Date.now
  },
  time: {
    type: String
  },
  completed: {
    type: Boolean,
    default: false
  },
  summary: {
    type: String,
    default: ''
  },
  // Link to related transcript if any
  transcriptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transcript'
  }
}, {
  timestamps: true
});

// Index for faster queries by date
eventSchema.index({ date: -1 });
eventSchema.index({ type: 1, date: -1 });

module.exports = mongoose.model('Event', eventSchema);