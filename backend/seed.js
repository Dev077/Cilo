const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Transcript = require('./models/Transcript');
const Event = require('./models/Event');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const sampleTranscripts = [
  {
    label: 'Sarah Chen',
    type: 'person',
    date: new Date('2024-12-24T14:00:00'),
    duration: '32 min',
    content: 'Discussed Q1 campaign ideas and budget allocation for social media. Sarah suggested focusing on Instagram Reels and TikTok for the younger demographic. We agreed to allocate 40% of the budget to paid ads and 60% to organic content creation.',
    color: '#FEF3E2',
    participants: ['Sarah Chen', 'You'],
    tags: ['marketing', 'budget', 'social media']
  },
  {
    label: 'Product Meeting',
    type: 'topic',
    date: new Date('2024-12-23T10:00:00'),
    duration: '45 min',
    content: 'Finalized launch date for v2.0. Key features include: new onboarding flow, dark mode, and performance improvements. Launch scheduled for January 15th. Need to coordinate with marketing team for announcement.',
    color: '#E8F5E9',
    participants: ['Alex', 'Jordan', 'You'],
    tags: ['product', 'launch', 'planning']
  },
  {
    label: 'Alex Rodriguez',
    type: 'person',
    date: new Date('2024-12-23T15:00:00'),
    duration: '28 min',
    content: 'Design review session. Went through the new UI mockups for the dashboard. Alex suggested more white space and larger touch targets for mobile. Will iterate on the designs and present again next week.',
    color: '#E3F2FD',
    participants: ['Alex Rodriguez', 'You'],
    tags: ['design', 'UI', 'review']
  },
  {
    label: 'Budget Planning',
    type: 'topic',
    date: new Date('2024-12-22T11:00:00'),
    duration: '60 min',
    content: 'Annual budget planning session. Discussed department allocations for 2025. Engineering gets 45%, Marketing 25%, Operations 20%, and 10% reserved for unexpected expenses. Hiring plan includes 3 engineers and 1 designer.',
    color: '#FFF3E0',
    participants: ['Finance Team', 'You'],
    tags: ['finance', 'budget', 'planning']
  },
  {
    label: 'Jordan Kim',
    type: 'person',
    date: new Date('2024-12-22T16:00:00'),
    duration: '52 min',
    content: 'Investor update call. Presented Q4 metrics showing 40% growth in MAU. Discussed fundraising timeline - planning to start Series A conversations in Q2. Investors happy with progress but want to see improved retention.',
    color: '#FCE4EC',
    participants: ['Jordan Kim', 'You'],
    tags: ['investors', 'metrics', 'fundraising']
  },
  {
    label: 'Marketing Ideas',
    type: 'topic',
    date: new Date('2024-12-21T14:00:00'),
    duration: '35 min',
    content: 'Brainstorming session for Q1 marketing campaigns. Ideas include: influencer partnerships, referral program launch, and content series on YouTube. Decided to prioritize the referral program first.',
    color: '#EDE7F6',
    participants: ['Marketing Team', 'You'],
    tags: ['marketing', 'brainstorm', 'campaigns']
  },
  {
    label: 'Mom',
    type: 'person',
    date: new Date('2024-12-20T19:00:00'),
    duration: '18 min',
    content: 'Caught up with mom. She asked about work and holiday plans. Discussed Christmas dinner arrangements - she is bringing her famous pie. Reminded me to call grandma this weekend.',
    color: '#E0F7FA',
    participants: ['Mom', 'You'],
    tags: ['family', 'personal']
  },
  {
    label: 'App Design',
    type: 'topic',
    date: new Date('2024-12-19T10:00:00'),
    duration: '40 min',
    content: 'Deep dive into the app redesign. Focused on the onboarding experience. Decided to reduce steps from 5 to 3. Will use progressive disclosure for advanced settings. Animations should feel snappy but not rushed.',
    color: '#F3E5F5',
    participants: ['Design Team', 'You'],
    tags: ['design', 'app', 'UX']
  }
];

const sampleEvents = [
  {
    title: 'Team standup meeting',
    type: 'task',
    date: new Date(),
    time: '10:00 AM',
    completed: false
  },
  {
    title: 'Review project proposal',
    type: 'task',
    date: new Date(),
    time: '2:00 PM',
    completed: false
  },
  {
    title: 'Call with Alex about launch',
    type: 'task',
    date: new Date(),
    time: '4:30 PM',
    completed: false
  },
  {
    title: 'Coffee chat with Sarah',
    type: 'event',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    time: '3:00 PM',
    summary: 'Discussed new marketing strategies and Q2 goals'
  },
  {
    title: 'Product brainstorm',
    type: 'event',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    time: '11:00 AM',
    summary: 'Explored new feature ideas for the mobile app'
  },
  {
    title: 'Investor call',
    type: 'event',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    time: '2:00 PM',
    summary: 'Presented roadmap and answered questions about growth metrics'
  }
];

const seedDatabase = async () => {
  await connectDB();

  try {
    // Clear existing data
    await Transcript.deleteMany({});
    await Event.deleteMany({});
    console.log('Cleared existing data');

    // Insert sample transcripts
    const transcripts = await Transcript.insertMany(sampleTranscripts);
    console.log(`Inserted ${transcripts.length} transcripts`);

    // Link some events to transcripts
    sampleEvents[3].transcriptId = transcripts[0]._id; // Coffee chat -> Sarah Chen
    sampleEvents[4].transcriptId = transcripts[1]._id; // Product brainstorm -> Product Meeting
    sampleEvents[5].transcriptId = transcripts[4]._id; // Investor call -> Jordan Kim

    // Insert sample events
    const events = await Event.insertMany(sampleEvents);
    console.log(`Inserted ${events.length} events`);

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();