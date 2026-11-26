import { describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Pressable, Text, } from 'react-native';
import {useMemo, type ReactNode} from 'react';
import { ScanFeedback } from '@/features/barcode-scanning/components/scan-feedback';

import { calculateCartSubtotal } from '@/features/cart/cart-summary';
import CartRoute from '@/app/cart';
import HomeScreen from '@/app/index';
import type {
  ProductCatalog,
  ScannedProduct,
} from '@/features/barcode-scanning/product-catalog';
import { useBarcodeScanner } from '@/features/barcode-scanning/use-barcode-scanner';
import { CartAddError, CartProvider, useCart } from '@/features/cart/cart-gateway';
import {
  ActiveStoreProvider,
  useActiveStore,
  type Store,
} from '@/features/store-selection/active-store';

jest.mock('expo-router', () => ({
  router: {
    navigate: jest.fn(),
    push: jest.fn(),
  },
}));

const store: Store = {
  id: 'test-store',
  name: 'Test Store',
  latitude: 0,
  longitude: 0,
};

const milk: ScannedProduct = {
  id: 'milk',
  name: 'Milk 1 L',
  barcode: '6408430000159',
  storeId: store.id,
  price: { amount: 1.29, currency: 'EUR' },
};

const unknownBarcode = '4006381333931';
const failingBarcode = '5901234123457';

const catalog: ProductCatalog = {
  async lookup({ barcode }) {
    if (barcode === failingBarcode) {
      throw new Error('Catalog unavailable');
    }

    return barcode === milk.barcode
      ? { status: 'found', product: milk }
      : { status: 'not-found' };
  },
};

const chocolate: ScannedProduct = {
  ...milk,
  id: 'chocolate',
  name: 'Chocolate bar',
  barcode: '4006381333931',
};

function Task32Scanner({
  catalog,
  addProduct,
}: {
  catalog: ProductCatalog;
  addProduct: (product: ScannedProduct) => Promise<void>;
}) {
  const { gateway, items, itemCount } = useCart();
  const scanner = useBarcodeScanner({
    store,
    catalog,
    cart: {
      addScannedProduct(product) {
        return product.id === chocolate.id
          ? addProduct(product)
          : gateway.addScannedProduct(product);
      },
    },
  });

  return (
    <>
      {[milk, chocolate].map((product) => (
        <Pressable
          key={product.id}
          accessibilityRole="button"
          onPress={() => scanner.onBarcodeScanned?.({
            type: 'ean13',
            data: product.barcode,
          })}>
          <Text>{`Scan ${product.id}`}</Text>
        </Pressable>
      ))}

      <ScanFeedback
        state={scanner.state}
        storeName={store.name}
        itemCount={itemCount}
        onResume={() => scanner.resume({ intentional: true })}
        onRetry={scanner.retry}
        onClose={() => {}}
      />

      {items.map(({ product, quantity }) => (
        <Text key={product.id}>{`Cart: ${product.name} × ${quantity}`}</Text>
      ))}
    </>
  );
}

function Task32App({ unavailableOnRetry }: { unavailableOnRetry: boolean }) {
  const { gateway } = useCart();
  const catalog: ProductCatalog = {
    async lookup({ barcode }) {
      return {
        status: 'found',
        product: barcode === milk.barcode ? milk : chocolate,
      };
    },
  };

  // Keep the mock's call history across cart provider renders.
  const retryCatalog = useMemo<ProductCatalog>(() => {
    let chocolateLookups = 0;

    return {
      async lookup({ barcode }) {
        if (barcode === milk.barcode) return { status: 'found', product: milk };

        chocolateLookups += 1;
        return unavailableOnRetry && chocolateLookups > 1
          ? { status: 'not-found' }
          : { status: 'found', product: chocolate };
      },
    };
  }, [unavailableOnRetry]);

  const addProduct = useMemo(() => {
    let attempts = 0;

    return async (product: ScannedProduct) => {
      attempts += 1;
      if (attempts === 1) throw new Error('Temporary cart failure');
      await gateway.addScannedProduct(product);
    };
  }, [gateway]);

  return <Task32Scanner catalog={retryCatalog} addProduct={addProduct} />;
}

describe('#32 cart errors and recovery', () => {
  it('rejects invalid and wrong-store products without changing an existing item', async () => {
    function GatewayCheck() {
      const { gateway, items } = useCart();

      return (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await gateway.addScannedProduct(milk);

              await expect(
                gateway.addScannedProduct({ ...milk, name: ' ' }),
              ).rejects.toThrow(CartAddError);

              await expect(
                gateway.addScannedProduct({ ...milk, storeId: 'other-store' }),
              ).rejects.toThrow('This product is unavailable at the selected store.');
            }}>
            <Text>Check cart validation</Text>
          </Pressable>

          {items.map(({ product, quantity }) => (
            <Text key={product.id}>{`Cart: ${product.name} × ${quantity}`}</Text>
          ))}
        </>
      );
    }

    await render(
      <ActiveStoreProvider initialStore={store}>
        <CartProvider>
          <GatewayCheck />
        </CartProvider>
      </ActiveStoreProvider>,
    );

    await press('Check cart validation');

    expect(screen.getByText('Cart: Milk 1 L × 1')).toBeOnTheScreen();
  });

  it.each([
    { unavailableOnRetry: false, feedback: 'Added Chocolate bar' },
    { unavailableOnRetry: true, feedback: 'Product not found' },
  ])('shows "$feedback" after retry and preserves an unrelated item', async ({
    unavailableOnRetry,
    feedback,
  }) => {
    await render(
      <ActiveStoreProvider initialStore={store}>
        <CartProvider>
          <Task32App unavailableOnRetry={unavailableOnRetry} />
        </CartProvider>
      </ActiveStoreProvider>,
    );

    await press('Scan milk');
    expect(screen.getByText('Added Milk 1 L')).toBeOnTheScreen();

    await press('Scan next');
    await press('Scan chocolate');

    expect(screen.getByText("Couldn't add Chocolate bar")).toBeOnTheScreen();
    expect(screen.getByText(/Your cart is unchanged/)).toBeOnTheScreen();
    expect(screen.queryByText(/^Cart: Chocolate bar/)).toBeNull();

    await press('Try again');

    expect(screen.getByText(feedback)).toBeOnTheScreen();
    expect(screen.getByText('Cart: Milk 1 L × 1')).toBeOnTheScreen();

    if (unavailableOnRetry) {
      expect(screen.queryByText(/^Cart: Chocolate bar/)).toBeNull();
    } else {
      expect(screen.getByText('Cart: Chocolate bar × 1')).toBeOnTheScreen();
    }
  });
});

function ScannerControls() {
  const { gateway } = useCart();
  const scanner = useBarcodeScanner({ store, catalog, cart: gateway });

    return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => scanner.onBarcodeScanned?.({ type: 'ean13', data: milk.barcode })}>
        <Text>Scan milk</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => scanner.onBarcodeScanned?.({ type: 'ean13', data: unknownBarcode })}>
        <Text>Scan unknown product</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => scanner.onBarcodeScanned?.({ type: 'ean13', data: failingBarcode })}>
        <Text>Scan with catalog failure</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => scanner.onBarcodeScanned?.({ type: 'qr', data: 'unsupported' })}>
        <Text>Scan QR code</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => scanner.resume({ intentional: true })}>
        <Text>Scan next</Text>
      </Pressable>

      <Text>{scanner.state.status}</Text>
    </>
  );
}

function TestApp({ route }: { route: 'home' | 'cart' | 'scan' }) {
  return (
    <ActiveStoreProvider initialStore={store}>
      <CartProvider>
        {route === 'home' && <HomeScreen />}
        {route === 'cart' && <CartRoute />}
        {route === 'scan' && <ScannerControls />}
      </CartProvider>
    </ActiveStoreProvider>
  );
}

async function press(name: string) {
  await act(async () => {
    await fireEvent.press(screen.getByRole('button', { name }));
  });
}

describe('#27 cart screen', () => {
  it('opens the cart from Home', async () => {
    await render(<TestApp route="home" />);

    await press('Open cart');

    expect(router.navigate).toHaveBeenCalledWith('/cart');
  });

  it('shows an empty cart and offers to start scanning', async () => {
    await render(<TestApp route="cart" />);

    expect(screen.getByRole('header', { name: 'My cart' })).toBeOnTheScreen();
    expect(screen.getByText('Your cart is empty')).toBeOnTheScreen();

    await press('Start Scanning');

    expect(router.push).toHaveBeenCalledWith('/scan');
  });
});

describe('#28 barcode-to-cart integration', () => {
  it('shows scanned product details and keeps the quantity after leaving the cart', async () => {
    const app = await render(<TestApp route="scan" />);

    await press('Scan milk');
    expect(screen.getByText('added')).toBeOnTheScreen();

    await press('Scan next');
    await press('Scan milk');

    await app.rerender(<TestApp route="cart" />);

    const expectedPrice = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR',
    }).format(1.29);

    expect(screen.getAllByText('Milk 1 L')).toHaveLength(1);
    expect(screen.getByText(`Barcode ${milk.barcode}`)).toBeOnTheScreen();
    expect(screen.getByText(expectedPrice)).toBeOnTheScreen();
    expect(screen.getByLabelText('Quantity 2')).toBeOnTheScreen();

    await app.rerender(<TestApp route="home" />);
    await app.rerender(<TestApp route="cart" />);

    expect(screen.getByLabelText('Quantity 2')).toBeOnTheScreen();
  });

  it.each([
    ['Scan unknown product', 'not-found'],
    ['Scan with catalog failure', 'lookup-failed'],
    ['Scan QR code', 'unsupported'],
  ])('leaves the existing cart intact after "%s"', async (button, status) => {
    const app = await render(<TestApp route="scan" />);

    await press('Scan milk');
    await press('Scan next');
    await press(button);

    expect(screen.getByText(status)).toBeOnTheScreen();

    await app.rerender(<TestApp route="cart" />);

    expect(screen.getAllByText('Milk 1 L')).toHaveLength(1);
    expect(screen.getByLabelText('Quantity 1')).toBeOnTheScreen();
  });
});


describe('#29 cart quantity and removal', () => {
  async function openCartWithMilk() {
    const app = await render(<TestApp route="scan" />);
    await press('Scan milk');
    await app.rerender(<TestApp route="cart" />);
  }

  function expectSubtotal(amount: number) {
    const formatted = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);

    expect(screen.getByText(`Subtotal ${formatted}`)).toBeOnTheScreen();
  }

  it('updates the quantity, item count, and subtotal, and stops at one', async () => {
    await openCartWithMilk();

    const increase = `Increase quantity of ${milk.name}`;
    const decrease = `Decrease quantity of ${milk.name}`;

    expect(screen.getByLabelText('Quantity 1')).toBeOnTheScreen();
    expectSubtotal(1.29);

    await press(increase);

    expect(screen.getByLabelText('Quantity 2')).toBeOnTheScreen();
    expect(screen.getByText('2 items')).toBeOnTheScreen();
    expectSubtotal(2.58);

    await press(decrease);

    expect(screen.getByLabelText('Quantity 1')).toBeOnTheScreen();
    expect(screen.getByText('1 item')).toBeOnTheScreen();
    expectSubtotal(1.29);
    expect(screen.getByRole('button', { name: decrease })).toBeDisabled();
  });

  it('shows the empty state after removing the final item', async () => {
    await openCartWithMilk();

    await press(`Remove ${milk.name}`);

    expect(screen.queryByText(milk.name)).toBeNull();
    expect(screen.getByText('Your cart is empty')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Clear cart' })).toBeNull();
  });

  it('keeps the cart on cancel and empties it after confirmation', async () => {
    await openCartWithMilk();
    await press(`Increase quantity of ${milk.name}`);

    await press('Clear cart');

    expect(screen.getByText('Remove all items from this cart?')).toBeOnTheScreen();
    expect(screen.getByLabelText('Quantity 2')).toBeOnTheScreen();

    await press('Cancel');

    expect(screen.queryByText('Remove all items from this cart?')).toBeNull();
    expect(screen.getByLabelText('Quantity 2')).toBeOnTheScreen();
    expectSubtotal(2.58);

    await press('Clear cart');
    await press('Remove all items');

    expect(screen.queryByText(milk.name)).toBeNull();
    expect(screen.getByText('Your cart is empty')).toBeOnTheScreen();
    expect(screen.queryByText(/^Subtotal /)).toBeNull();
  });
});


describe('#30 store-scoped cart', () => {
  const secondStore: Store = {
    ...store,
    id: 'store-2',
    name: 'Second Store',
  };

  const secondStoreMilk: ScannedProduct = {
    ...milk,
    storeId: secondStore.id,
  };

  function CartTestProviders({ children }: { children: ReactNode }) {
    return (
      <ActiveStoreProvider initialStore={store}>
        <CartProvider>{children}</CartProvider>
      </ActiveStoreProvider>
    );
  }

  async function setupCart() {
    return renderHook(
      () => {
        const cart = useCart();
        const { setActiveStore } = useActiveStore();

        return { cart, setActiveStore };
      },
      { wrapper: CartTestProviders },
    );
  }

  it('merges repeated additions within a store and restores each store’s own cart', async () => {
    const { result } = await setupCart();

    await act(async () => {
      await result.current.cart.gateway.addScannedProduct(milk);
      await result.current.cart.gateway.addScannedProduct(milk);
    });

    expect(result.current.cart.items).toMatchObject([
      { product: { id: milk.id, storeId: store.id }, quantity: 2 },
    ]);
    expect(result.current.cart.itemCount).toBe(2);

    await act(() => {
      result.current.setActiveStore(secondStore);
    });

    expect(result.current.cart.items).toEqual([]);
    expect(result.current.cart.itemCount).toBe(0);

    await act(async () => {
      await expect(
        result.current.cart.gateway.addScannedProduct(milk),
      ).rejects.toThrow(CartAddError);

      await result.current.cart.gateway.addScannedProduct(secondStoreMilk);
    });

    expect(result.current.cart.items).toMatchObject([
      { product: { id: milk.id, storeId: secondStore.id }, quantity: 1 },
    ]);
    expect(result.current.cart.itemCount).toBe(1);

    await act(() => {
      result.current.setActiveStore(store);
    });

    expect(result.current.cart.items).toMatchObject([
      { product: { id: milk.id, storeId: store.id }, quantity: 2 },
    ]);
    expect(result.current.cart.itemCount).toBe(2);
  });

  it('rejects an old scanner gateway even after returning to its store', async () => {
    const { result } = await setupCart();
    const oldGateway = result.current.cart.gateway;

    await act(() => {
      result.current.setActiveStore(secondStore);
    });

    await act(() => {
      result.current.setActiveStore(store);
    });

    await act(async () => {
      await expect(oldGateway.addScannedProduct(milk)).rejects.toThrow(
        'The selected store changed. Scan the product again.',
      );
    });

    expect(result.current.cart.items).toEqual([]);

    await act(async () => {
      await result.current.cart.gateway.addScannedProduct(milk);
    });

    expect(result.current.cart.itemCount).toBe(1);
  });
});


describe('#31 cart summary display', () => {
  it('shows the count and subtotal after a scan, then zero items after removal', async () => {
    const app = await render(<TestApp route="scan" />);

    await press('Scan milk');
    await app.rerender(<TestApp route="cart" />);

    const subtotal = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR',
    }).format(1.29);

    expect(screen.getByText('1 item')).toBeOnTheScreen();
    expect(screen.getByText(`Subtotal ${subtotal}`)).toBeOnTheScreen();

    await press(`Remove ${milk.name}`);

    expect(screen.getByText('Your cart is empty')).toBeOnTheScreen();
    expect(screen.getByText('0 items')).toBeOnTheScreen();
    expect(screen.queryByText(/^Subtotal/)).toBeNull();
  });
});



describe('#26 multi-item cart and Checkout readiness', () => {
  function CartWithProviders({ children }: { children: ReactNode }) {
    return (
      <ActiveStoreProvider initialStore={store}>
        <CartProvider>
          {children}
          <CartRoute />
        </CartProvider>
      </ActiveStoreProvider>
    );
  }

  function expectDisplayedTotals(itemCount: number, amount: number) {
    const subtotal = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);

    expect(
      screen.getByText(`${itemCount} ${itemCount === 1 ? 'item' : 'items'}`),
    ).toBeOnTheScreen();
    expect(screen.getByText(`Subtotal ${subtotal}`)).toBeOnTheScreen();
  }

  it('exposes the current product lines, quantities, and subtotal through cart mutations', async () => {
    const bar: ScannedProduct = {
      ...chocolate,
      price: { amount: 2.49, currency: 'EUR' },
    };
    const { result } = await renderHook(() => useCart(), {
      wrapper: CartWithProviders,
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(screen.getByText('Your cart is empty')).toBeOnTheScreen();
    expect(screen.getByText('0 items')).toBeOnTheScreen();

    await act(async () => {
      await result.current.gateway.addScannedProduct(milk);
      await result.current.gateway.addScannedProduct(bar);
    });

    expect(result.current.items).toEqual([
      { product: milk, quantity: 1 },
      { product: bar, quantity: 1 },
    ]);
    expect(result.current.itemCount).toBe(2);
    expectDisplayedTotals(2, 3.78);

    await press(`Increase quantity of ${milk.name}`);

    expect(result.current.items).toEqual([
      { product: milk, quantity: 2 },
      { product: bar, quantity: 1 },
    ]);
    expect(result.current.itemCount).toBe(3);
    expect(calculateCartSubtotal(result.current.items)).toEqual({
      subtotals: [{ amount: 5.07, currency: 'EUR' }],
      hasUnpricedItems: false,
    });
    expectDisplayedTotals(3, 5.07);

    await press(`Remove ${bar.name}`);

    expect(screen.queryByText(bar.name)).toBeNull();
    expect(result.current.items).toEqual([{ product: milk, quantity: 2 }]);
    expect(result.current.itemCount).toBe(2);
    expectDisplayedTotals(2, 2.58);

    // Restore a second row so clearing exercises a multi-item cart.
    await act(async () => {
      await result.current.gateway.addScannedProduct(bar);
    });
    expect(result.current.items).toHaveLength(2);

    await press('Clear cart');
    await press('Remove all items');

    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(calculateCartSubtotal(result.current.items)).toEqual({
      subtotals: [],
      hasUnpricedItems: false,
    });
    expect(screen.getByText('Your cart is empty')).toBeOnTheScreen();
    expect(screen.getByText('0 items')).toBeOnTheScreen();
    expect(screen.queryByText(/^Subtotal /)).toBeNull();
  });
});