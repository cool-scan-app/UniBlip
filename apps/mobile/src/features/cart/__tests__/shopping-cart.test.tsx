import { describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import {useMemo} from 'react';
import { ScanFeedback } from '@/features/barcode-scanning/components/scan-feedback';


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