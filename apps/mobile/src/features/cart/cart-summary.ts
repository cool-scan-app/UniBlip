import type { Money } from '@/features/barcode-scanning/product-catalog';

import type { CartItem } from './cart-gateway';

type CurrencySubtotal = {
  formatter: Intl.NumberFormat;
  unitsPerMajor: number;
  totalMinorUnits: number;
};

export function calculateCartSubtotal(items: readonly CartItem[]): {
  subtotals: Money[];
  hasUnpricedItems: boolean;
} {
  const byCurrency = new Map<string, CurrencySubtotal>();
  let hasUnpricedItems = false;

  for (const { product, quantity } of items) {
    if (product.price === null) {
      hasUnpricedItems = true;
      continue;
    }

    const { amount, currency } = product.price;
    let subtotal = byCurrency.get(currency);

    if (!subtotal) {
      const fractionDigits =
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).resolvedOptions().maximumFractionDigits ?? 2;

      subtotal = {
        formatter: new Intl.NumberFormat('en-US', {
          useGrouping: false,
          minimumFractionDigits: fractionDigits,
          maximumFractionDigits: fractionDigits,
        }),
        unitsPerMajor: 10 ** fractionDigits,
        totalMinorUnits: 0,
      };

      byCurrency.set(currency, subtotal);
    }

    // Round the unit price the same way it is displayed, then multiply.
    const unitPriceMinor = Number(subtotal.formatter.format(amount).replace('.', ''));
    subtotal.totalMinorUnits += unitPriceMinor * quantity;
  }

  return {
    subtotals: Array.from(byCurrency, ([currency, subtotal]) => ({
      amount: subtotal.totalMinorUnits / subtotal.unitsPerMajor,
      currency,
    })),
    hasUnpricedItems,
  };
}