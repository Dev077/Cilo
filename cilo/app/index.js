import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const THEMES = {
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
};

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export default function HomeScreen() {
  const timeOfDay = getTimeOfDay();
  const theme = THEMES[timeOfDay];
  const userName = 'Dev';

  return (
    <LinearGradient colors={theme.colors} style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        {/* Weather */}
        <View style={styles.weather}>
          <Text style={styles.weatherIcon}>{theme.weather}</Text>
          <Text style={[styles.temp, { color: theme.textColor }]}>{theme.temp}</Text>
        </View>

        {/* Greeting */}
        <Text style={[styles.greeting, { color: theme.textColor }]}>
          {theme.greeting}
        </Text>
        <Text style={[styles.name, { color: theme.subtextColor }]}>
          {userName}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  weather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  weatherIcon: {
    fontSize: 28,
  },
  temp: {
    fontSize: 20,
    fontWeight: '500',
  },
  greeting: {
    fontSize: 34,
    fontWeight: '400',
    lineHeight: 40,
  },
  name: {
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 40,
  },
});