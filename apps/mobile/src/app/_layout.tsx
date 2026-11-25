import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { devInitialStore } from '@/config/integration';
import { CartProvider } from '@/features/cart/cart-gateway';
import { ActiveStoreProvider, isValidStore, useActiveStore } from '@/features/store-selection/active-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ActiveStoreProvider initialStore={devInitialStore}>
      <CartProvider>
        <AnimatedSplashOverlay />
        <RootStack />
      </CartProvider>
    </ActiveStoreProvider>
  );
}

function RootStack() {
  const { activeStore } = useActiveStore();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      {/* Scanning requires an active store (issues #14, #20). */}
      <Stack.Protected guard={isValidStore(activeStore)}>
        <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      </Stack.Protected>
      <Stack.Screen name="store-picker" />
    </Stack>
  );
}
