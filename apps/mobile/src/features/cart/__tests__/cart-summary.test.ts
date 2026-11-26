import { describe, expect, it } from '@jest/globals';

import type { Money } from '@/features/barcode-scanning/product-catalog';

import type { CartItem } from '../cart-gateway';
import { calculateCartSubtotal } from '../cart-summary';

function item(id: string, quantity: number, price: Money | null): CartItem {
  return {
    quantity,
    product: {
      id,
      name: id,
      barcode: '6408430000159',
      storeId: 'test-store',
      price,
    },
  };
}

describe('#31 cart subtotal', () => {
  it('multiplies each unit price by its quantity and adds the amounts exactly', () => {
    const summary = calculateCartSubtotal([
      item('apples', 3, { amount: 0.1, currency: 'EUR' }),
      item('pears', 1, { amount: 0.2, currency: 'EUR' }),
      item('milk', 2, { amount: 1.29, currency: 'EUR' }),
    ]);

    expect(summary).toEqual({
      subtotals: [{ amount: 3.08, currency: 'EUR' }],
      hasUnpricedItems: false,
    });
  });

  it('keeps currencies separate and respects their decimal precision', () => {
    const summary = calculateCartSubtotal([
      item('euro product', 2, { amount: 1.29, currency: 'EUR' }),
      item('yen product', 3, { amount: 125, currency: 'JPY' }),
      item('dinar product', 2, { amount: 0.125, currency: 'KWD' }),
    ]);

    expect(summary).toEqual({
      subtotals: [
        { amount: 2.58, currency: 'EUR' },
        { amount: 375, currency: 'JPY' },
        { amount: 0.25, currency: 'KWD' },
      ],
      hasUnpricedItems: false,
    });
  });

  it('includes free products and flags products with missing prices', () => {
    const summary = calculateCartSubtotal([
      item('free sample', 2, { amount: 0, currency: 'EUR' }),
      item('missing price', 1, null),
    ]);

    expect(summary).toEqual({
      subtotals: [{ amount: 0, currency: 'EUR' }],
      hasUnpricedItems: true,
    });
  });

  it('returns no subtotals for an empty cart', () => {
    expect(calculateCartSubtotal([])).toEqual({
      subtotals: [],
      hasUnpricedItems: false,
    });
  });
});