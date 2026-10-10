export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export const TIME_THEMES = {
  morning: {
    colors: ['#FEF3E2', '#FECDA6', '#FDB4C4', '#FFE5EC'],
    greeting: 'Good morning,',
    weather: '☀️',
    temp: '21°',
    textColor: '#1a1a1a',
    subtextColor: 'rgba(0,0,0,0.5)',
  },
  afternoon: {
    colors: ['#FEF0F5', '#FECDD6', '#E8A0BF', '#F8BBD9'],
    greeting: 'Good afternoon,',
    weather: '🌤️',
    temp: '24°',
    textColor: '#1a1a1a',
    subtextColor: 'rgba(0,0,0,0.5)',
  },
  evening: {
    colors: ['#E0F7FA', '#B2EBF2', '#A8D8EA', '#C8E6C9'],
    greeting: 'Good evening,',
    weather: '🌙',
    temp: '20°',
    textColor: '#1a1a1a',
    subtextColor: 'rgba(0,0,0,0.5)',
  },
  night: {
    colors: ['#C5CAE9', '#9FA8DA', '#7E57C2', '#5C6BC0'],
    greeting: 'Happy late night,',
    weather: '🌧️',
    temp: '17°',
    textColor: '#ffffff',
    subtextColor: 'rgba(255,255,255,0.6)',
  },
} as const;

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
