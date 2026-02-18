// API Configuration
// Change this to your computer's IP address if testing on a physical device
// For iOS Simulator: 'http://localhost:3000'
// For Android Emulator: 'http://10.0.2.2:3000'
// For Physical Device: 'http://YOUR_COMPUTER_IP:3000'

const API_BASE_URL = 'http://localhost:3000/api';

// Helper function for API calls
async function fetchAPI(endpoint: string, options?: RequestInit) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// ============ TRANSCRIPTS API ============

export const transcriptsAPI = {
  // Get all transcripts
  getAll: () => fetchAPI('/transcripts'),

  // Get single transcript by ID
  getById: (id: string) => fetchAPI(`/transcripts/${id}`),

  // Get transcripts by date (YYYY-MM-DD)
  getByDate: (date: string) => fetchAPI(`/transcripts/date/${date}`),

  // Get transcripts for a month
  getByMonth: (year: number, month: number) => 
    fetchAPI(`/transcripts/month/${year}/${month}`),

  // Create new transcript
  create: (data: {
    label: string;
    type?: 'person' | 'topic';
    date?: string;
    duration: string;
    content?: string;
    color?: string;
    participants?: string[];
    tags?: string[];
  }) => fetchAPI('/transcripts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update transcript
  update: (id: string, data: any) => fetchAPI(`/transcripts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete transcript
  delete: (id: string) => fetchAPI(`/transcripts/${id}`, {
    method: 'DELETE',
  }),
};

// ============ EVENTS API ============

export const eventsAPI = {
  // Get all events
  getAll: () => fetchAPI('/events'),

  // Get single event by ID
  getById: (id: string) => fetchAPI(`/events/${id}`),

  // Get all tasks
  getTasks: () => fetchAPI('/events/tasks'),

  // Get pending tasks
  getPendingTasks: () => fetchAPI('/events/tasks/pending'),

  // Get past events
  getPastEvents: () => fetchAPI('/events/past'),

  // Get events by date (YYYY-MM-DD)
  getByDate: (date: string) => fetchAPI(`/events/date/${date}`),

  // Get today's summary (tasks + past events)
  getTodaySummary: () => fetchAPI('/events/summary/today'),

  // Create new event
  create: (data: {
    title: string;
    type?: 'task' | 'event';
    date?: string;
    time?: string;
    completed?: boolean;
    summary?: string;
    transcriptId?: string;
  }) => fetchAPI('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update event
  update: (id: string, data: any) => fetchAPI(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Toggle task completion
  toggleComplete: (id: string) => fetchAPI(`/events/${id}/toggle`, {
    method: 'PATCH',
  }),

  // Delete event
  delete: (id: string) => fetchAPI(`/events/${id}`, {
    method: 'DELETE',
  }),
};

// ============ TYPES ============

export interface Transcript {
  _id: string;
  label: string;
  type: 'person' | 'topic';
  date: string;
  duration: string;
  content: string;
  color: string;
  participants: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  _id: string;
  title: string;
  type: 'task' | 'event';
  date: string;
  time?: string;
  completed: boolean;
  summary?: string;
  transcriptId?: Transcript;
  createdAt: string;
  updatedAt: string;
}

export interface TodaySummary {
  tasks: Event[];
  pastEvents: Event[];
}