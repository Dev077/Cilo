import { useEffect, useState } from 'react';
import { TIME_THEMES, getTimeOfDay } from '@/constants/time-theme';

const CHECK_INTERVAL_MS = 60 * 1000;

/**
 * The hello page's time-of-day theme, kept current while the app stays open
 * (e.g. morning colors turn into afternoon colors at noon).
 */
export function useTimeTheme() {
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay);

  useEffect(() => {
    const timer = setInterval(() => setTimeOfDay(getTimeOfDay()), CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return TIME_THEMES[timeOfDay];
}
