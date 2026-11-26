# Shopping Cart verification

## Automated results

- Baseline on `feature/6-shopping-cart` before the #26 test: 6 suites passed, 70 tests passed.
- Final #26 run (`npm test -- --runInBand`): 6 suites passed, 71 tests passed.

| Behavior | Automated coverage |
| --- | --- |
| Open Cart, empty state, single product, and multiple products | `shopping-cart.test.tsx` |
| Barcode additions, repeated camera events, deliberate repeats, and retry protection | `use-barcode-scanner.test.tsx`, `scan-session.test.ts`, and `shopping-cart.test.tsx` |
| Invalid products, unknown barcodes, and failed operations leave the cart intact | `product-catalog.test.ts`, `use-barcode-scanner.test.tsx`, and `shopping-cart.test.tsx` |
| Quantity changes, removal, clear confirmation, and updated totals | `shopping-cart.test.tsx` and `cart-summary.test.ts` |
| Store isolation, stale scanner callbacks, and cart state after a screen remount | `shopping-cart.test.tsx` |
| Future Checkout reads current product lines, quantities, item count, and subtotal | `shopping-cart.test.tsx` |

## Manual checks

Record the device, platform, result, and any issue for each run.

- [ ] On a device with a camera, open the empty cart and confirm it shows zero items.
- [ ] Scan two different supported barcodes. Hold one barcode in frame and confirm it is added only once. Tap Scan next and deliberately scan it again to confirm its quantity increases by one.
- [ ] Navigate Home → Cart → Scan → Cart. Confirm both products and their quantities remain available.
- [ ] Change a quantity, remove one product, and verify the item count and subtotal after each action. Cancel Clear cart once, then confirm it and verify the empty state.
- [ ] Scan an unknown or unsupported barcode and confirm the cart contents are unchanged.
- [ ] When the store picker is available, switch stores with a populated cart. Verify that the new store shows only its own items and that switching back restores the original cart.

## Known limitations

- Jest uses mocked catalog responses and screen remounts. Physical camera behavior and real navigation are covered by the device checks above.
- The active-store provider is exercised in automated tests. The device-level store switch depends on the store picker being available in the tested build.
- Cart data is in memory for the app session. It survives navigation and resets when the app restarts.
- Future Checkout can read `useCart().items`, `useCart().itemCount`, and `calculateCartSubtotal(items)`. Products without a price are flagged by `hasUnpricedItems`. Checkout, payment, and server-side price or availability checks are outside this test’s scope.