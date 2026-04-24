import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat,
  withSequence, withTiming, withDelay,
} from 'react-native-reanimated';

function Dot({ delay, color }: { delay: number; color: string }) {
  const scale = useSharedValue(0.6);
  useEffect(() => {
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 280 }),
        withTiming(0.6, { duration: 280 }),
      ),
      -1,
    ));
  }, [scale, delay]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

export default function LoadingDots({ color = '#fff' }: { color?: string }) {
  return (
    <View style={styles.row}>
      <Dot delay={0} color={color} />
      <Dot delay={160} color={color} />
      <Dot delay={320} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
