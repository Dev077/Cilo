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
  summary: {
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
  //flag to track if AI processing has been done
  processed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries by date
transcriptSchema.index({ date: -1 });

// Full-text search; matches in the label and summary count for more than the raw transcript
transcriptSchema.index(
  { label: 'text', summary: 'text', content: 'text' },
  { name: 'transcript_text_search', weights: { label: 5, summary: 3, content: 1 } }
);

module.exports = mongoose.model('Transcript', transcriptSchema);