const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['person', 'topic'],
    default: 'topic'
  },
  date: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#FEF3E2'
  },
  participants: [{
    type: String
  }],
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for faster queries by date
transcriptSchema.index({ date: -1 });

module.exports = mongoose.model('Transcript', transcriptSchema);