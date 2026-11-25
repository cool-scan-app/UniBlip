import { describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

import CartRoute from '@/app/cart';
import HomeScreen from '@/app/index';
import type {
  ProductCatalog,
  ScannedProduct,
} from '@/features/barcode-scanning/product-catalog';
import { useBarcodeScanner } from '@/features/barcode-scanning/use-barcode-scanner';
import { CartProvider, useCart } from '@/features/cart/cart-gateway';
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

function ScannerControls() {
  const { gateway } = useCart();
  const scanner = useBarcodeScanner({ store, catalog, cart: gateway });

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => scanner.onBarcodeScanned({ type: 'ean13', data: milk.barcode })}>
        <Text>Scan milk</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => scanner.onBarcodeScanned({ type: 'ean13', data: unknownBarcode })}>
        <Text>Scan unknown product</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => scanner.onBarcodeScanned({ type: 'ean13', data: failingBarcode })}>
        <Text>Scan with catalog failure</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => scanner.onBarcodeScanned({ type: 'qr', data: 'unsupported' })}>
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