/**
 * Pure scan-session logic: the state machine for one scanner session and the
 * duplicate-detection gate. Kept free of React so it is easy to unit test.
 */
import type { ScannedProduct } from './product-catalog';

export type ScanState =
  | { status: 'scanning' }
  | { status: 'looking-up'; barcode: string }
  | { status: 'not-found'; barcode: string }
  | { status: 'unsupported'; reason: 'unsupported-format' | 'invalid-value'; type: string }
  | { status: 'lookup-failed'; barcode: string; message: string }
  | { status: 'adding-to-cart'; product: ScannedProduct }
  | { status: 'added'; product: ScannedProduct }
  | { status: 'cart-failed'; product: ScannedProduct; message: string };

export type ScanStatus = ScanState['status'];

export type ScanAction =
  | { type: 'lookup-started'; barcode: string }
  | { type: 'unsupported-detected'; reason: 'unsupported-format' | 'invalid-value'; barcodeType: string }
  | { type: 'lookup-not-found' }
  | { type: 'lookup-failed'; message: string }
  | { type: 'cart-add-started'; product: ScannedProduct }
  | { type: 'cart-add-succeeded' }
  | { type: 'cart-add-failed'; message: string }
  | { type: 'resume' };

export const initialScanState: ScanState = { status: 'scanning' };

/**
 * Transitions that don't make sense from the current state are ignored and the
 * same state object is returned, so late async results can't corrupt the flow.
 */
export function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    case 'lookup-started':
      // From scanning (new detection) or lookup-failed (retry).
      return state.status === 'scanning' || state.status === 'lookup-failed' || state.status === 'cart-failed'
        ? { status: 'looking-up', barcode: action.barcode }
        : state;
    case 'unsupported-detected':
      return state.status === 'scanning'
        ? { status: 'unsupported', reason: action.reason, type: action.barcodeType }
        : state;
    case 'lookup-not-found':
      return state.status === 'looking-up' ? { status: 'not-found', barcode: state.barcode } : state;
    case 'lookup-failed':
      return state.status === 'looking-up'
        ? { status: 'lookup-failed', barcode: state.barcode, message: action.message }
        : state;
    case 'cart-add-started':
      // From a successful lookup, or a retry after the cart refused.
      return state.status === 'looking-up' || state.status === 'cart-failed'
        ? { status: 'adding-to-cart', product: action.product }
        : state;
    case 'cart-add-succeeded':
      return state.status === 'adding-to-cart' ? { status: 'added', product: state.product } : state;
    case 'cart-add-failed':
      return state.status === 'adding-to-cart'
        ? { status: 'cart-failed', product: state.product, message: action.message }
        : state;
    case 'resume':
      // Never abandon an in-flight cart mutation.
      return state.status === 'adding-to-cart' ? state : initialScanState;
  }
}

/** States in which the camera should report detections. */
export function isAcceptingDetections(state: ScanState): boolean {
  return state.status === 'scanning';
}

/** States that resume scanning on their own after a short pause. */
export const AUTO_RESUME_MS: Partial<Record<ScanStatus, number>> = {
  added: 1500,
  'not-found': 2500,
  unsupported: 2500,
};

/**
 * Suppresses repeated detections of the same barcode.
 *
 * The camera reports a barcode many times per second while it is in view. A key
 * is blocked for `cooldownMs` after it was last *seen*, so holding the phone over
 * the same product never adds it twice. Moving away for longer than the
 * cooldown, or calling `reset()` (the customer tapped "Scan next"), allows the
 * same product to be scanned again intentionally.
 */
export function createDuplicateGate({ cooldownMs = 3000 }: { cooldownMs?: number } = {}) {
  let lastKey: string | null = null;
  let lastSeenAt = -Infinity;

  return {
    /** Returns true when the detection should be processed. */
    accept(key: string, now: number): boolean {
      const isRepeat = key === lastKey && now - lastSeenAt < cooldownMs;
      lastKey = key;
      lastSeenAt = now;
      return !isRepeat;
    },
    /** Marks a key as just seen without processing it (used when resuming). */
    touch(now: number) {
      if (lastKey !== null) lastSeenAt = now;
    },
    reset() {
      lastKey = null;
      lastSeenAt = -Infinity;
    },
  };
}

export type DuplicateGate = ReturnType<typeof createDuplicateGate>;
