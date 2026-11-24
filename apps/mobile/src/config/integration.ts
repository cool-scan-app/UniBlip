/**
 * Switches between real integrations and development stand-ins while the
 * features the scanner depends on are still being built.
 *
 * Set these in `apps/mobile/.env.local` (gitignored) and restart Expo:
 *   EXPO_PUBLIC_CATALOG_SOURCE=api   use the backend product endpoint (default: mock)
 *   EXPO_PUBLIC_API_URL=http://192.168.1.10:8000   override the backend address
 *   EXPO_PUBLIC_DEV_MOCK_STORE=1     start with a mock active store (dev builds only)
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { createApiProductCatalog, createMockProductCatalog, type ProductCatalog } from '@/features/barcode-scanning/product-catalog';
import type { Store } from '@/features/store-selection/active-store';

const API_PORT = 8000;

/**
 * Backend address. On a phone, "localhost" is the phone itself, so in
 * development we reuse the host that serves the JS bundle (your PC's LAN IP).
 */
export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured;
  if (Platform.OS === 'web') return `http://localhost:${API_PORT}`;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host || 'localhost'}:${API_PORT}`;
}

export const catalogSource: 'api' | 'mock' = process.env.EXPO_PUBLIC_CATALOG_SOURCE === 'api' ? 'api' : 'mock';

export function createProductCatalog(): ProductCatalog {
  return catalogSource === 'api' ? createApiProductCatalog({ baseUrl: getApiBaseUrl() }) : createMockProductCatalog();
}

const MOCK_STORE: Store = {
  id: 'dev-mock-store',
  name: 'Dev Mock Store',
  latitude: 60.4518,
  longitude: 22.2666,
};

/** Store to preselect in development so the scanner can be tried before #15 exists. */
export const devInitialStore: Store | null =
  __DEV__ && process.env.EXPO_PUBLIC_DEV_MOCK_STORE === '1' ? MOCK_STORE : null;
