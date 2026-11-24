import { BarcodeScannerScreen } from '@/features/barcode-scanning/components/barcode-scanner-screen';
import { isValidStore, useActiveStore } from '@/features/store-selection/active-store';

/**
 * /scan — guarded by <Stack.Protected> in the root layout, so it is only
 * reachable with an active store. The check here is a second line of defence.
 */
export default function ScanRoute() {
  const { activeStore } = useActiveStore();
  if (!isValidStore(activeStore)) return null;

  // Keyed by store: a different store always starts a fresh scan session.
  return <BarcodeScannerScreen key={activeStore.id} store={activeStore} />;
}
