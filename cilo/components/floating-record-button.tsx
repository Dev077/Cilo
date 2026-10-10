import React from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { RecordOrb } from '@/components/record-orb';
import { useTimeTheme } from '@/hooks/use-time-theme';

const ORB_SIZE = 66;
// Room around the sphere so its glow isn't clipped
const HALO = 1.2;
const BOX = ORB_SIZE * HALO;
const EDGE_MARGIN = 8;
// Matches the tab bar height in app/tabs/_layout.tsx
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 60;
const SNAP_SPRING = { damping: 18, stiffness: 180 };

/**
 * The record orb that floats over the tabs. Drag it anywhere to get it out of the way;
 * it snaps to the nearest side edge on release. Tap it to open the full-screen recorder.
 */
export function FloatingRecordButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const theme = useTimeTheme();

  const minX = EDGE_MARGIN;
  const maxX = width - BOX - EDGE_MARGIN;
  const minY = insets.top + EDGE_MARGIN;
  const maxY = height - TAB_BAR_HEIGHT - BOX - EDGE_MARGIN;

  const x = useSharedValue(maxX);
  const y = useSharedValue(maxY - 12);
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const pressed = useSharedValue(1);

  const pan = Gesture.Pan()
    .minDistance(6)
    .onStart(() => {
      dragStartX.set(x.get());
      dragStartY.set(y.get());
      pressed.set(withSpring(1.12, SNAP_SPRING));
    })
    .onUpdate((event) => {
      x.set(Math.min(Math.max(dragStartX.get() + event.translationX, minX), maxX));
      y.set(Math.min(Math.max(dragStartY.get() + event.translationY, minY), maxY));
    })
    .onEnd((event) => {
      // Snap to whichever side it's closer to (or was flung towards)
      const projectedCenter = x.get() + BOX / 2 + event.velocityX * 0.1;
      x.set(withSpring(projectedCenter < width / 2 ? minX : maxX, SNAP_SPRING));
      pressed.set(withSpring(1, SNAP_SPRING));
    });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd(() => {
      router.push('/record' as any);
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() },
      { scale: pressed.get() },
    ],
  }));

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <Animated.View
        style={[styles.container, style]}
        accessibilityRole="button"
        accessibilityLabel="Record a conversation"
      >
        <RecordOrb size={ORB_SIZE} colors={theme.colors} state="idle" level={0} haloScale={HALO} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
