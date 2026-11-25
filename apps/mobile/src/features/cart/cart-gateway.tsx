/**
 * Scanner -> Shopping Cart handoff (issue #25).
 *
 * TEMPORARY placeholder for the Shopping Cart feature (#6, #28-#31).
 * The scanner only calls `CartGateway.addScannedProduct`. The in-memory
 * implementation below exists so the scan flow can be used end to end today.
 * When #28 lands, replace the value given to <CartProvider> with the real cart;
 * quantity rules, store scoping (#30) and totals (#31) belong there, not here.
 */
import { createContext, use, useMemo, useState, type ReactNode } from 'react';

import type { ScannedProduct } from '@/features/barcode-scanning/product-catalog';
import { isValidStore, useActiveStore } from '@/features/store-selection/active-store';

export interface CartGateway {
  /** Adds one unit of a validated product. Rejects if the cart refused it. */
  addScannedProduct(product: ScannedProduct): Promise<void>;
}

export type CartItem = {
  product: ScannedProduct;
  quantity: number;
}

type CartContextValue = {
  gateway: CartGateway;
  items: CartItem[];
  /** Total units in the cart, for feedback such as "3 items in cart". */
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const {activeStore} = useActiveStore();
  const storeId = isValidStore(activeStore) ? activeStore.id : null;
  const [itemsByProduct, setItemsByProduct] = useState<Record<string, CartItem>>({});

  // const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Created once so the gateway identity is stable across renders.
  //const [gateway] = useState<CartGateway>(() => ({
  //  async addScannedProduct(product) {
  //    setQuantities((current) => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 }));
  //  },
  //}));

  const gateway = useMemo<CartGateway>(
    () => ({
      async addScannedProduct(product) {
        if (!storeId || product.storeId !== storeId) {
          throw new Error('This product does not belong to the active store.');
        }

        const key = JSON.stringify([storeId, product.id]);

        setItemsByProduct((current) => ({
          ...current,
          [key]: {
            product,
            quantity: (current[key]?.quantity ?? 0) + 1,
          },
        }));
      },
    }),
    [storeId],
  );

  const items = Object.values(itemsByProduct).filter(
    ({product}) => product.storeId === storeId,
  );


  //const itemCount = Object.values(quantities).reduce((sum, n) => sum + n, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return <CartContext value={{ gateway, items, itemCount }}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const value = use(CartContext);
  if (!value) throw new Error('useCart must be used inside <CartProvider>');
  return value;
}
