import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import type { CartGateway } from '@/features/cart/cart-gateway';
import type { Store } from '@/features/store-selection/active-store';

import { ProductLookupError, type ProductCatalog, type ProductLookupResult, type ScannedProduct } from '../product-catalog';
import { useBarcodeScanner } from '../use-barcode-scanner';

const store: Store = { id: 'store-1', name: 'Test Store', latitude: 0, longitude: 0 };
const MILK = '6408430000159';
const milk: ScannedProduct = { id: 'milk', name: 'Milk', barcode: MILK, storeId: store.id, price: null };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function setup({
  lookup = async ({ barcode }) => (barcode === MILK ? { status: 'found', product: milk } : { status: 'not-found' }),
  addScannedProduct = async () => {},
}: {
  lookup?: ProductCatalog['lookup'];
  addScannedProduct?: CartGateway['addScannedProduct'];
} = {}) {
  let clock = 0;
  const catalog = { lookup: jest.fn(lookup) };
  const cart = { addScannedProduct: jest.fn(addScannedProduct) };
  const hook = await renderHook(() => useBarcodeScanner({ store, catalog, cart, cooldownMs: 3000, now: () => clock }));
  return {
    ...hook,
    catalog,
    cart,
    advanceClock: (ms: number) => {
      clock += ms;
    },
    scan: (type: string, data: string) => act(() => hook.result.current.onBarcodeScanned?.({ type, data })),
  };
}

describe('useBarcodeScanner', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('looks up a valid barcode in the active store and adds it to the cart once', async () => {
    const t = await setup();
    await t.scan('ean13', MILK);
    expect(t.catalog.lookup).toHaveBeenCalledWith(expect.objectContaining({ storeId: 'store-1', barcode: MILK }));
    expect(t.cart.addScannedProduct).toHaveBeenCalledTimes(1);
    expect(t.cart.addScannedProduct).toHaveBeenCalledWith(milk);
    expect(t.result.current.state.status).toBe('added');
  });

  it('does not start parallel lookups for a burst of detections', async () => {
    const pending = deferred<ProductLookupResult>();
    const t = await setup({ lookup: () => pending.promise });

    await act(async () => {
      // The camera fires many callbacks before React re-renders.
      const handler = t.result.current.onBarcodeScanned!;
      for (let i = 0; i < 10; i++) handler({ type: 'ean13', data: MILK });
      handler({ type: 'ean13', data: '4006381333931' });
    });
    expect(t.catalog.lookup).toHaveBeenCalledTimes(1);
    expect(t.result.current.onBarcodeScanned).toBeUndefined();

    await act(async () => pending.resolve({ status: 'found', product: milk }));
    expect(t.cart.addScannedProduct).toHaveBeenCalledTimes(1);
  });

  it('never touches the cart for unknown, unsupported or failed scans', async () => {
    const t = await setup({
      lookup: async ({ barcode }) => {
        if (barcode === '4006381333931') throw new ProductLookupError('down', 'server');
        return { status: 'not-found' };
      },
    });

    await t.scan('qr', 'https://example.com');
    expect(t.result.current.state.status).toBe('unsupported');
    await act(async () => t.result.current.resume({ intentional: true }));

    await t.scan('ean13', '4006381333932'); // bad check digit
    expect(t.result.current.state).toMatchObject({ status: 'unsupported', reason: 'invalid-value' });
    await act(async () => t.result.current.resume({ intentional: true }));

    await t.scan('ean13', '6411300000494');
    expect(t.result.current.state.status).toBe('not-found');
    await act(async () => t.result.current.resume({ intentional: true }));

    await t.scan('ean13', '4006381333931');
    expect(t.result.current.state.status).toBe('lookup-failed');

    expect(t.cart.addScannedProduct).not.toHaveBeenCalled();
    // Unsupported codes are never looked up at all.
    expect(t.catalog.lookup).toHaveBeenCalledTimes(2);
  });

  it('ignores the same product while it stays in view after auto-resume', async () => {
    const t = await setup();
    await t.scan('ean13', MILK);
    expect(t.result.current.state.status).toBe('added');

    // Auto-resume after the success message.
    await act(async () => jest.advanceTimersByTime(1500));
    expect(t.result.current.state.status).toBe('scanning');

    // Camera still pointed at the milk: keeps reporting it.
    for (let i = 0; i < 5; i++) {
      t.advanceClock(500);
      await t.scan('ean13', MILK);
    }
    expect(t.cart.addScannedProduct).toHaveBeenCalledTimes(1);
  });

  it('lets the customer scan the same product again intentionally', async () => {
    const t = await setup();
    await t.scan('ean13', MILK);
    await act(async () => t.result.current.resume({ intentional: true }));
    await t.scan('ean13', MILK);
    expect(t.cart.addScannedProduct).toHaveBeenCalledTimes(2);
  });

  it('retries a failed lookup without allowing double retries', async () => {
    let fail = true;
    const t = await setup({
      lookup: async () => {
        if (fail) throw new ProductLookupError('offline', 'network');
        return { status: 'found', product: milk };
      },
    });
    await t.scan('ean13', MILK);
    expect(t.result.current.state).toMatchObject({ status: 'lookup-failed' });
    expect(t.result.current.state.status === 'lookup-failed' && t.result.current.state.message).toMatch(/connection/i);

    fail = false;
    await act(async () => {
      t.result.current.retry();
      t.result.current.retry();
    });
    expect(t.catalog.lookup).toHaveBeenCalledTimes(2);
    expect(t.cart.addScannedProduct).toHaveBeenCalledTimes(1);
    expect(t.result.current.state.status).toBe('added');
  });

  it('reports a cart failure and can retry it', async () => {
    let calls = 0;
    const t = await setup({
      addScannedProduct: async () => {
        calls++;
        if (calls === 1) throw new Error('cart unavailable');
      },
    });
    await t.scan('ean13', MILK);
    expect(t.result.current.state.status).toBe('cart-failed');
    await act(async () => t.result.current.retry());
    expect(t.result.current.state.status).toBe('added');
    expect(t.catalog.lookup).toHaveBeenCalledTimes(1);
  });

  it('rejects a product returned for a different store', async () => {
    const t = await setup({ lookup: async () => ({ status: 'found', product: { ...milk, storeId: 'other' } }) });
    await t.scan('ean13', MILK);
    expect(t.result.current.state.status).toBe('lookup-failed');
    expect(t.cart.addScannedProduct).not.toHaveBeenCalled();
  });

  it('cancels the pending lookup when the scanner closes', async () => {
    let signal: AbortSignal | undefined;
    const t = await setup({
      lookup: (request) => {
        signal = request.signal;
        return new Promise(() => {});
      },
    });
    await t.scan('ean13', MILK);
    expect(signal?.aborted).toBe(false);
    await t.unmount();
    expect(signal?.aborted).toBe(true);
    expect(t.cart.addScannedProduct).not.toHaveBeenCalled();
  });
});
