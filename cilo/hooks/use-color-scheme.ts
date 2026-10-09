import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * React Native's `useColorScheme` can return 'unspecified', which isn't a theme
 * we define colors for. Narrow it to the two schemes the app actually styles.
 */
export function useColorScheme(): 'light' | 'dark' {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
