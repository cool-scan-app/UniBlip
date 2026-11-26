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
import { isValidStore, useActiveStore } from '@/features/store-selection/active-store';
import {
  parseProduct,
  type ScannedProduct,
} from '@/features/barcode-scanning/product-catalog';

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
  changeQuantity: (productId: string, change: -1 | 1) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const {activeStore} = useActiveStore();
  const storeId = isValidStore(activeStore) ? activeStore.id : null;
  const [itemsByProduct, setItemsByProduct] = useState<Record<string, CartItem>>({});

  const gateway = useMemo<CartGateway>(
    () => ({
      async addScannedProduct(product) {
        const validated = parseProduct(product);

        if (!validated) {
          throw new CartAddError('The product details are incomplete or invalid.');
        }
        if (!storeId) {
          throw new CartAddError('Choose a store before adding products.');
        }
        if (validated.storeId !== storeId) {
          throw new CartAddError('This product is unavailable at the selected store.');
        }

        const key = JSON.stringify([storeId, validated.id]);

        setItemsByProduct((current) => ({
          ...current,
          [key]: {
            product: validated,
            quantity: (current[key]?.quantity ?? 0) + 1,
          },
        }));
      },
    }),
    [storeId],
  );

  function changeQuantity(productId: string, change: -1 | 1) {
    if (!storeId) return;

    const key = JSON.stringify([storeId, productId]);

    setItemsByProduct((current) => {
      const item = current[key];
      if (!item) return current;

      const quantity = item.quantity + change;
      if (quantity < 1 || !Number.isSafeInteger(quantity)) return current;

      return {
        ...current,
        [key]: { ...item, quantity },
      };
    });
  }

  function removeItem(productId: string) {
    if (!storeId) return;

    const key = JSON.stringify([storeId, productId]);

    setItemsByProduct((current) => {
      if (!current[key]) return current;

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function clearCart() {
    if (!storeId) return;

    setItemsByProduct((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([, item]) => item.product.storeId !== storeId),
      ),
    );
  }

  const items = Object.values(itemsByProduct).filter(
    ({product}) => product.storeId === storeId,
  );


  //const itemCount = Object.values(quantities).reduce((sum, n) => sum + n, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return <CartContext value={{ gateway, items, itemCount, changeQuantity, removeItem, clearCart }}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const value = use(CartContext);
  if (!value) throw new Error('useCart must be used inside <CartProvider>');
  return value;
}

export class CartAddError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CartAddError';
  }
}
