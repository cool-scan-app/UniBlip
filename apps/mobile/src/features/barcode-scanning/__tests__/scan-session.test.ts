import { describe, expect, it } from '@jest/globals';

import type { ScannedProduct } from '../product-catalog';
import { createDuplicateGate, initialScanState, isAcceptingDetections, scanReducer, type ScanState } from '../scan-session';

const product: ScannedProduct = {
  id: 'p1',
  name: 'Milk',
  barcode: '6408430000159',
  brand: 'Valio',
  storeId: 's1',
  price_in_cents: 129,
};

describe('scanReducer', () => {
  it('goes scanning -> looking-up -> adding-to-cart -> added', () => {
    let state: ScanState = initialScanState;
    state = scanReducer(state, { type: 'lookup-started', barcode: product.barcode });
    expect(state).toEqual({ status: 'looking-up', barcode: product.barcode });
    state = scanReducer(state, { type: 'cart-add-started', product });
    expect(state).toEqual({ status: 'adding-to-cart', product });
    state = scanReducer(state, { type: 'cart-add-succeeded' });
    expect(state).toEqual({ status: 'added', product });
  });

  it('ignores a new detection while a lookup is running', () => {
    const busy: ScanState = { status: 'looking-up', barcode: '1' };
    expect(scanReducer(busy, { type: 'lookup-started', barcode: '2' })).toBe(busy);
    expect(scanReducer(busy, { type: 'unsupported-detected', reason: 'unsupported-format', barcodeType: 'qr' })).toBe(busy);
  });

  it('never goes to the cart from not-found, unsupported or a failed lookup', () => {
    const states: ScanState[] = [
      { status: 'not-found', barcode: '1' },
      { status: 'unsupported', reason: 'unsupported-format', type: 'qr' },
      { status: 'lookup-failed', barcode: '1', message: 'x' },
      initialScanState,
    ];
    for (const state of states) {
      expect(scanReducer(state, { type: 'cart-add-started', product })).toBe(state);
    }
  });

  it('allows retrying a failed lookup and a failed cart add', () => {
    const lookupFailed: ScanState = { status: 'lookup-failed', barcode: '1', message: 'x' };
    expect(scanReducer(lookupFailed, { type: 'lookup-started', barcode: '1' })).toEqual({ status: 'looking-up', barcode: '1' });

    const cartFailed: ScanState = { status: 'cart-failed', product, message: 'x' };
    expect(scanReducer(cartFailed, { type: 'cart-add-started', product })).toEqual({ status: 'adding-to-cart', product });
  });

  it('does not abandon an in-flight cart add on resume', () => {
    const adding: ScanState = { status: 'adding-to-cart', product };
    expect(scanReducer(adding, { type: 'resume' })).toBe(adding);
  });

  it('ignores late lookup results after resuming', () => {
    expect(scanReducer(initialScanState, { type: 'lookup-not-found' })).toBe(initialScanState);
    expect(scanReducer(initialScanState, { type: 'lookup-failed', message: 'x' })).toBe(initialScanState);
    expect(scanReducer(initialScanState, { type: 'cart-add-succeeded' })).toBe(initialScanState);
  });

  it('only accepts detections while scanning', () => {
    expect(isAcceptingDetections(initialScanState)).toBe(true);
    expect(isAcceptingDetections({ status: 'added', product })).toBe(false);
  });
});

describe('createDuplicateGate', () => {
  it('blocks the same barcode while it stays in view', () => {
    const gate = createDuplicateGate({ cooldownMs: 3000 });
    expect(gate.accept('a', 0)).toBe(true);
    // Seen continuously every 500 ms for 10 s: never accepted again.
    for (let t = 500; t <= 10_000; t += 500) expect(gate.accept('a', t)).toBe(false);
  });

  it('accepts the same barcode again after it was out of view for the cooldown', () => {
    const gate = createDuplicateGate({ cooldownMs: 3000 });
    gate.accept('a', 0);
    expect(gate.accept('a', 3000)).toBe(true);
  });

  it('accepts a different barcode immediately', () => {
    const gate = createDuplicateGate({ cooldownMs: 3000 });
    gate.accept('a', 0);
    expect(gate.accept('b', 10)).toBe(true);
  });

  it('touch() extends the block, reset() lifts it', () => {
    const gate = createDuplicateGate({ cooldownMs: 3000 });
    gate.accept('a', 0);
    gate.touch(5000);
    expect(gate.accept('a', 6000)).toBe(false);
    gate.reset();
    expect(gate.accept('a', 6001)).toBe(true);
  });
});
