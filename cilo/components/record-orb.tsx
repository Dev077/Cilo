import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  SharedValue,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type OrbState = 'idle' | 'listening' | 'processing';

type Props = {
  size: number;
  /** Four pastel colors, e.g. from TIME_THEMES */
  colors: readonly [string, string, string, string];
  state: OrbState;
  /** Voice level 0..1 while listening */
  level: number;
  /** Omit to render a plain view, e.g. when a parent gesture handles taps */
  onPress?: () => void;
  disabled?: boolean;
  /** Room around the sphere for the glow and ripples, as a multiple of size */
  haloScale?: number;
  showIcon?: boolean;
};

// How long one full turn of each swirl layer takes, per state (ms)
const SWIRL_DURATIONS: Record<OrbState, [number, number, number]> = {
  idle: [16000, 21000, 26000],
  listening: [6000, 8000, 10000],
  processing: [1800, 2600, 3400],
};
const RIPPLE_COUNT = 3;
const RIPPLE_DURATION = 2400;

function transparent(hex: string) {
  return `${hex}00`;
}

function spin(rotation: SharedValue<number>, duration: number, direction: 1 | -1) {
  cancelAnimation(rotation);
  const from = rotation.get() % 360;
  rotation.set(from);
  rotation.set(withRepeat(withTiming(from + 360 * direction, { duration, easing: Easing.linear }), -1));
}

/**
 * A soft pastel sphere: oversized gradient layers rotate at different speeds inside a circular
 * clip, so the colors drift into each other like a mesh gradient. It breathes when idle, swells
 * with your voice and sends out ripples while listening, and swirls fast while processing.
 */
export function RecordOrb({ size, colors, state, level, onPress, disabled, haloScale = 1.8, showIcon = true }: Props) {
  const swirlA = useSharedValue(0);
  const swirlB = useSharedValue(120);
  const swirlC = useSharedValue(240);
  const breathe = useSharedValue(1);
  const voice = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const ripple0 = useSharedValue(0);
  const ripple1 = useSharedValue(0);
  const ripple2 = useSharedValue(0);
  const ripples = [ripple0, ripple1, ripple2];

  useEffect(() => {
    const [a, b, c] = SWIRL_DURATIONS[state];
    spin(swirlA, a, 1);
    spin(swirlB, b, -1);
    spin(swirlC, c, 1);

    cancelAnimation(breathe);
    const amplitude = state === 'processing' ? 1.03 : 1.045;
    const period = state === 'processing' ? 700 : 2400;
    breathe.set(withRepeat(withSequence(
      withTiming(amplitude, { duration: period, easing: Easing.inOut(Easing.sin) }),
      withTiming(1, { duration: period, easing: Easing.inOut(Easing.sin) }),
    ), -1));

    rippleOpacity.set(withTiming(state === 'listening' ? 1 : 0, { duration: 400 }));
    [ripple0, ripple1, ripple2].forEach((ripple, i) => {
      cancelAnimation(ripple);
      ripple.set(0);
      if (state === 'listening') {
        ripple.set(withDelay(
          (RIPPLE_DURATION / RIPPLE_COUNT) * i,
          withRepeat(withTiming(1, { duration: RIPPLE_DURATION, easing: Easing.out(Easing.quad) }), -1),
        ));
      }
    });
  }, [state, swirlA, swirlB, swirlC, breathe, rippleOpacity, ripple0, ripple1, ripple2]);

  useEffect(() => {
    voice.set(withSpring(state === 'listening' ? level : 0, { damping: 14, stiffness: 140 }));
  }, [level, state, voice]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.get() * (1 + voice.get() * 0.18) }],
  }));
  const swirlStyleA = useAnimatedStyle(() => ({ transform: [{ rotate: `${swirlA.get()}deg` }] }));
  const swirlStyleB = useAnimatedStyle(() => ({ transform: [{ rotate: `${swirlB.get()}deg` }] }));
  const swirlStyleC = useAnimatedStyle(() => ({ transform: [{ rotate: `${swirlC.get()}deg` }] }));
  const iconStyle = useAnimatedStyle(() => ({
    opacity: withTiming(showIcon && state === 'idle' ? 0.9 : 0, { duration: 300 }),
  }));

  const swirlSize = size * 1.6;
  const swirlOffset = (size - swirlSize) / 2;
  const swirlLayer = { width: swirlSize, height: swirlSize, left: swirlOffset, top: swirlOffset };

  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={state === 'listening' ? 'Stop recording' : 'Start recording'}
      style={[styles.container, { width: size * haloScale, height: size * haloScale }]}
    >
      {ripples.map((ripple, i) => (
        <Ripple key={i} progress={ripple} visibility={rippleOpacity} voice={voice} size={size} color={colors[2]} />
      ))}

      <Animated.View style={[styles.glow, { width: size, height: size, borderRadius: size / 2, shadowColor: colors[2] }, bodyStyle]}>
        <View style={[styles.sphere, { width: size, height: size, borderRadius: size / 2 }]}>
          <LinearGradient colors={[colors[0], colors[1]]} style={StyleSheet.absoluteFill} />

          <Animated.View style={[styles.swirl, swirlLayer, swirlStyleA]}>
            <LinearGradient colors={[colors[2], transparent(colors[2])]} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 0.7 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <Animated.View style={[styles.swirl, swirlLayer, swirlStyleB]}>
            <LinearGradient colors={[colors[3], transparent(colors[3])]} start={{ x: 1, y: 0 }} end={{ x: 0.3, y: 0.8 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <Animated.View style={[styles.swirl, swirlLayer, swirlStyleC]}>
            <LinearGradient colors={[colors[1], transparent(colors[1])]} start={{ x: 0.5, y: 1 }} end={{ x: 0.5, y: 0.2 }} style={StyleSheet.absoluteFill} />
          </Animated.View>

          {/* Glassy highlight + soft underside give it volume */}
          <LinearGradient
            colors={['rgba(255,255,255,0.75)', 'rgba(255,255,255,0)']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.55, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(60,30,90,0.12)']}
            start={{ x: 0.5, y: 0.55 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <Animated.View style={[styles.icon, iconStyle]}>
            <Ionicons name="mic" size={size * 0.16} color="rgba(255,255,255,0.95)" />
          </Animated.View>
        </View>
      </Animated.View>
    </Container>
  );
}

function Ripple({ progress, visibility, voice, size, color }: {
  progress: SharedValue<number>;
  visibility: SharedValue<number>;
  voice: SharedValue<number>;
  size: number;
  color: string;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: (1 - progress.get()) * 0.4 * visibility.get(),
    transform: [{ scale: 1 + progress.get() * (0.45 + voice.get() * 0.35) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.ripple, { width: size, height: size, borderRadius: size / 2, borderColor: color, backgroundColor: `${color}33` }, style]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 12,
  },
  sphere: {
    overflow: 'hidden',
  },
  swirl: {
    position: 'absolute',
    borderRadius: 9999,
  },
  icon: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    position: 'absolute',
    borderWidth: 1.5,
  },
});
