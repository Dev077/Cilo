import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { TIME_THEMES, getTimeOfDay } from '@/constants/time-theme';

export default function HomeScreen() {
  const router = useRouter();
  const timeOfDay = getTimeOfDay();
  const theme = TIME_THEMES[timeOfDay];
  const userName = 'Dev';

  const handleTap = () => {
    router.push('/tabs/summary');
  };

  return (
    <Pressable style={styles.pressable} onPress={handleTap}>
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

        {/* Tap hint */}
        <View style={styles.hintContainer}>
          <Text style={[styles.hint, { color: theme.subtextColor }]}>
            Tap anywhere to continue
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
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
  hintContainer: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  hint: {
    fontSize: 14,
    fontWeight: '400',
  },
});