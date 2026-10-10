import React, { useEffect, useId } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  SharedValue,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type OrbState = 'idle' | 'listening' | 'processing';

type Props = {
  size: number;
  /** The hello page's four gradient colors, from the time-of-day theme */
  colors: readonly [string, string, string, string];
  state: OrbState;
  /** Voice level 0..1 while listening */
  level: number;
  /** Omit to render a plain view, e.g. when a parent gesture handles taps */
  onPress?: () => void;
  disabled?: boolean;
  /** Room around the droplet for the glow and ripples, as a multiple of size */
  haloScale?: number;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

// How fast the surface moves and how far it bulges, per state
const MOTION: Record<OrbState, { speed: number; wobble: number }> = {
  idle: { speed: 0.6, wobble: 0.035 },
  listening: { speed: 1.4, wobble: 0.05 },
  processing: { speed: 2.8, wobble: 0.08 },
};
const POINTS = 8;
const RIPPLE_COUNT = 3;
const RIPPLE_DURATION = 2400;

/**
 * A smooth closed blob: points around a circle are pushed in and out by layered sine waves,
 * then joined with Catmull-Rom curves so the outline stays round and liquid.
 */
function blobPath(cx: number, cy: number, radius: number, time: number, wobble: number, seed: number) {
  'worklet';
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < POINTS; i++) {
    const angle = (i / POINTS) * Math.PI * 2;
    const offset =
      0.55 * Math.sin(time * 1.3 + i * 1.9 + seed) +
      0.3 * Math.sin(time * 2.1 + i * 3.7 + seed * 2) +
      0.15 * Math.sin(time * 3.4 + i * 0.8 + seed * 3);
    const r = radius * (1 + wobble * offset);
    xs.push(cx + Math.cos(angle) * r);
    ys.push(cy + Math.sin(angle) * r);
  }

  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 0; i < POINTS; i++) {
    const p0 = (i - 1 + POINTS) % POINTS;
    const p2 = (i + 1) % POINTS;
    const p3 = (i + 2) % POINTS;
    const c1x = xs[i] + (xs[p2] - xs[p0]) / 6;
    const c1y = ys[i] + (ys[p2] - ys[p0]) / 6;
    const c2x = xs[p2] - (xs[p3] - xs[i]) / 6;
    const c2y = ys[p2] - (ys[p3] - ys[i]) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${xs[p2]},${ys[p2]}`;
  }
  return `${d} Z`;
}

/**
 * A liquid droplet in the hello page's time-of-day gradient. Its surface gently wobbles when
 * idle, ripples with your voice while listening, and churns while processing.
 */
export function RecordOrb({ size, colors, state, level, onPress, disabled, haloScale = 1.8 }: Props) {
  // SVG gradient ids must be unique per instance (the floating orb and recorder can both be mounted)
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const center = size / 2;
  // Leaves room inside the canvas for the biggest bulge (loud voice while listening)
  const radius = size * 0.4;

  const clock = useSharedValue(0);
  const speed = useSharedValue(MOTION[state].speed);
  const wobble = useSharedValue(MOTION[state].wobble);
  const voice = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const ripple0 = useSharedValue(0);
  const ripple1 = useSharedValue(0);
  const ripple2 = useSharedValue(0);
  const ripples = [ripple0, ripple1, ripple2];

  useFrameCallback((frame) => {
    const dt = (frame.timeSincePreviousFrame ?? 16) / 1000;
    clock.set(clock.get() + dt * speed.get());
  });

  useEffect(() => {
    speed.set(withTiming(MOTION[state].speed, { duration: 600 }));
    wobble.set(withTiming(MOTION[state].wobble, { duration: 600 }));

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
  }, [state, speed, wobble, rippleOpacity, ripple0, ripple1, ripple2]);

  useEffect(() => {
    voice.set(withSpring(state === 'listening' ? level : 0, { damping: 14, stiffness: 140 }));
  }, [level, state, voice]);

  const bodyProps = useAnimatedProps(() => ({
    d: blobPath(center, center, radius, clock.get(), wobble.get() + voice.get() * 0.12, 0),
  }));

  // A smaller current drifting inside the droplet gives it depth
  const currentProps = useAnimatedProps(() => {
    const t = clock.get();
    return {
      d: blobPath(
        center + Math.cos(t * 0.7) * radius * 0.16,
        center + radius * 0.1 + Math.sin(t * 0.9) * radius * 0.12,
        radius * 0.55,
        t * 1.2,
        (wobble.get() + voice.get() * 0.12) * 1.8,
        2.4,
      ),
    };
  });

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + voice.get() * 0.12 }],
  }));

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
        <Ripple key={i} progress={ripple} visibility={rippleOpacity} voice={voice} size={radius * 2} color={colors[2]} />
      ))}

      <Animated.View style={[styles.glow, { width: size, height: size, shadowColor: colors[2] }, bodyStyle]}>
        <Svg width={size} height={size}>
          <Defs>
            {/* Same colors and direction as the hello page background */}
            <LinearGradient id={`fill${id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors[0]} />
              <Stop offset="0.33" stopColor={colors[1]} />
              <Stop offset="0.66" stopColor={colors[2]} />
              <Stop offset="1" stopColor={colors[3]} />
            </LinearGradient>
            <LinearGradient id={`current${id}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors[2]} stopOpacity="0.55" />
              <Stop offset="1" stopColor={colors[3]} stopOpacity="0.2" />
            </LinearGradient>
            <RadialGradient id={`shine${id}`} cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <AnimatedPath animatedProps={bodyProps} fill={`url(#fill${id})`} stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} />
          <AnimatedPath animatedProps={currentProps} fill={`url(#current${id})`} />
          {/* Glassy highlight where the light catches the surface */}
          <Ellipse
            cx={center - radius * 0.32}
            cy={center - radius * 0.38}
            rx={radius * 0.26}
            ry={radius * 0.15}
            fill={`url(#shine${id})`}
            transform={`rotate(-35 ${center - radius * 0.32} ${center - radius * 0.38})`}
          />
        </Svg>
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
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
  ripple: {
    position: 'absolute',
    borderWidth: 1.5,
  },
});
