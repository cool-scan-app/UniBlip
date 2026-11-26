/**
 * Connects camera detections -> normalisation -> catalog lookup -> cart handoff
 * (issues #22, #23, #25). UI-agnostic: the screen renders `state` and wires
 * `onBarcodeScanned` to <CameraView>.
 */
import { useEffect, useReducer, useRef } from 'react';

import { CartAddError, type CartGateway } from '@/features/cart/cart-gateway';
import type { Store } from '@/features/store-selection/active-store';

import { detectionKey, normalizeBarcode } from './barcode';
import { parseProduct, ProductLookupError, type ProductCatalog, type ScannedProduct } from './product-catalog';
import {
  AUTO_RESUME_MS,
  createDuplicateGate,
  initialScanState,
  isAcceptingDetections,
  scanReducer,
  type DuplicateGate,
} from './scan-session';


export type BarcodeDetection = { type: string; data: string };

type Options = {
  store: Store;
  catalog: ProductCatalog;
  cart: CartGateway;
  cooldownMs?: number;
  /** Injected for tests. */
  now?: () => number;
};

export function useBarcodeScanner({ store, catalog, cart, cooldownMs = 3000, now = Date.now }: Options) {
  const [state, dispatch] = useReducer(scanReducer, initialScanState);

  // Synchronous lock: the camera can fire several callbacks before React
  // re-renders, so state alone can't prevent parallel processing.
  const busyRef = useRef(false);
  const addedForCurrentScanRef = useRef(false);
  // Prevents a double-tapped "Try again" from running two requests.
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const gateRef = useRef<DuplicateGate | null>(null);

  function gate(): DuplicateGate {
    gateRef.current ??= createDuplicateGate({ cooldownMs });
    return gateRef.current;
  }

  // Cancel any pending lookup when the scanner closes.
  useEffect(() => () => abortRef.current?.abort(), []);

 async function addToCart(product: ScannedProduct) {
    dispatch({ type: 'cart-add-started', product });

    try {
      await cart.addScannedProduct(product);
      addedForCurrentScanRef.current = true;
      dispatch({ type: 'cart-add-succeeded' });
    } catch (error) {
      const detail =
        error instanceof CartAddError
          ? error.message
          : 'The product could not be added. Please try again.';

      dispatch({
        type: 'cart-add-failed',
        message: `${detail} Your cart is unchanged.`,
      });
    }
  }
  
  async function lookUp(barcode: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    // Capture the store now so a late response can't be applied to another store.
    const storeId = store.id;
    inFlightRef.current = true;
    dispatch({ type: 'lookup-started', barcode });

    try {
      let result;
      try {
        result = await catalog.lookup({ storeId, barcode, signal: controller.signal });
      } catch (error) {
        if (!controller.signal.aborted) {
          dispatch({ type: 'lookup-failed', message: messageFor(error, 'Something went wrong while looking up the product.') });
        }
        return;
      }
      if (controller.signal.aborted) return;

      if (result.status === 'not-found') {
        dispatch({ type: 'lookup-not-found' });
        return;
      }
      const product = parseProduct(result.product);

      if (!product || product.storeId !== storeId || product.barcode !== barcode) {
        dispatch({
          type: 'lookup-failed',
          message: 'The store returned incomplete or mismatched product details.',
        });
        return;
      }

      await addToCart(product);
    } finally {
      inFlightRef.current = false;
    }
  }

  function onBarcodeScanned(detection: BarcodeDetection) {
    if (busyRef.current) return;
    const barcode = normalizeBarcode(detection.type, detection.data);
    if (!gate().accept(detectionKey(barcode), now())) return;
    addedForCurrentScanRef.current = false;
    busyRef.current = true;
    if (barcode.kind === 'unsupported') {
      dispatch({ type: 'unsupported-detected', reason: barcode.reason, barcodeType: detection.type });
      return;
    }
    void lookUp(barcode.gtin);
  }

  /**
   * Returns to scanning. `intentional` = the customer pressed "Scan next", which
   * allows the same product to be scanned again straight away.
   */
  function resume({ intentional }: { intentional: boolean }) {
    if (state.status === 'adding-to-cart' || state.status === 'scanning') return;
    abortRef.current?.abort();
    if (intentional) gate().reset();
    else gate().touch(now());
    busyRef.current = false;
    dispatch({ type: 'resume' });
  }

  function retry() {
    if (inFlightRef.current || addedForCurrentScanRef.current) return;

    if (state.status === 'lookup-failed') {
      void lookUp(state.barcode);
    } else if (state.status === 'cart-failed') {
      void lookUp(state.product.barcode);
    }
  }

  // Successful and "not a product" results clear themselves after a moment.
  const autoResumeMs = AUTO_RESUME_MS[state.status];
  useEffect(() => {
    if (autoResumeMs === undefined) return;
    const timer = setTimeout(() => {
      gateRef.current?.touch(now());
      busyRef.current = false;
      dispatch({ type: 'resume' });
    }, autoResumeMs);
    return () => clearTimeout(timer);
  }, [state, autoResumeMs, now]);

  return {
    state,
    /** Pass straight to <CameraView onBarcodeScanned>. Undefined while busy so the camera skips the work. */
    onBarcodeScanned: isAcceptingDetections(state) ? onBarcodeScanned : undefined,
    resume,
    retry,
  };
}

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof ProductLookupError) {
    switch (error.reason) {
      case 'network':
        return 'No connection to the product catalog. Check your internet connection and try again.';
      case 'timeout':
        return 'The product catalog is taking too long to answer. Please try again.';
      case 'bad-response':
        return 'The store returned incomplete or mismatched product details.';
      default:
        return 'The product catalog is not available right now. Please try again.';
    }
  }
  return fallback;
}
