/**
 * Scanner -> Shopping Cart handoff (issue #25).
 *
 * TEMPORARY placeholder for the Shopping Cart feature (#6, #28-#31).
 * The scanner only calls `CartGateway.addScannedProduct`. The in-memory
 * implementation below exists so the scan flow can be used end to end today.
 * When #28 lands, replace the value given to <CartProvider> with the real cart;
 * quantity rules, store scoping (#30) and totals (#31) belong there, not here.
 */
import { createContext, use, useState, type ReactNode } from 'react';

import type { ScannedProduct } from '@/features/barcode-scanning/product-catalog';

export interface CartGateway {
  /** Adds one unit of a validated product. Rejects if the cart refused it. */
  addScannedProduct(product: ScannedProduct): Promise<void>;
}

type CartContextValue = {
  gateway: CartGateway;
  /** Total units in the cart, for feedback such as "3 items in cart". */
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // Created once so the gateway identity is stable across renders.
  const [gateway] = useState<CartGateway>(() => ({
    async addScannedProduct(product) {
      setQuantities((current) => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 }));
    },
  }));

  const itemCount = Object.values(quantities).reduce((sum, n) => sum + n, 0);

  return <CartContext value={{ gateway, itemCount }}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const value = use(CartContext);
  if (!value) throw new Error('useCart must be used inside <CartProvider>');
  return value;
}
