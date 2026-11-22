import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { LoadingScreen } from '@/components/loading-screen';

const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const [laidOut, setLaidOut] = useState(false);
  const [logoReady, setLogoReady] = useState(false);
  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    if (!laidOut || !logoReady) return;

    let cancelled = false;
    SplashScreen.hideAsync()
      .catch((error: unknown) => {
        console.error('Unable to hide the native splash screen:', error);
      })
      .finally(() => {
        if (!cancelled) {
          opacity.value = withTiming(0, { duration: DURATION, easing: Easing.inOut(Easing.ease) }, (finished) => {
            if (finished) scheduleOnRN(setVisible, false);
          });
        }
      });

    return () => {
      cancelled = true;
      cancelAnimation(opacity);
    };
  }, [laidOut, logoReady, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.splashOverlay, animatedStyle]}>
      <LoadingScreen onLayout={() => setLaidOut(true)} onLogoReady={() => setLogoReady(true)} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F5F7FA',
    zIndex: 1000,
  },
});
