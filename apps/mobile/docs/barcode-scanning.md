# Barcode scanning (issues #19–#25, feature #5)

The scanner lets a customer open the camera, scan a product barcode, look it up
in the **active store's** catalog and hand a valid product to the cart.

Store selection (#15), the product catalog endpoint and the shopping cart (#28)
are other people's tasks and are not finished yet. The scanner only talks to
them through small interfaces, with temporary stand-ins, so each one can be
swapped for the real implementation without touching the scanner.

## How it fits together

```text
Home "Scan" button ──(no active store)──> "Choose a store before scanning" hint
        │
        └─(active store)──> /scan  (guarded by <Stack.Protected> in _layout.tsx)
                              │
   CameraView ─detections─> useBarcodeScanner
                              ├─ normalizeBarcode()     barcode.ts
                              ├─ duplicate gate + lock  scan-session.ts
                              ├─ ProductCatalog.lookup  product-catalog.ts
                              └─ CartGateway.addScannedProduct   features/cart/cart-gateway.tsx
                              │
                          ScanFeedback (status, messages, retry / scan again / close)
```

| File | Issue | What it does |
| --- | --- | --- |
| `src/app/index.tsx` | #20 | Scan button; shows a hint instead of opening the scanner without a store |
| `src/app/_layout.tsx` | #20, #14 | Providers; `/scan` is only reachable with an active store |
| `src/app/scan.tsx` | #20 | Scanner route, keyed by store id (a new store starts a fresh session) |
| `features/barcode-scanning/components/barcode-scanner-screen.tsx` | #21 | Permissions, camera lifecycle, preview, close |
| `features/barcode-scanning/barcode.ts` | #22 | Supported formats, normalisation, check digits |
| `features/barcode-scanning/scan-session.ts` | #22, #25 | State machine, duplicate suppression |
| `features/barcode-scanning/use-barcode-scanner.ts` | #22, #23, #25 | Detection → lookup → cart, cancellation, retries |
| `features/barcode-scanning/product-catalog.ts` | #23 | Catalog interface, API client, mock catalog |
| `features/barcode-scanning/components/scan-feedback.tsx` | #24 | Feedback for every state |

## Behaviour

**Supported barcodes**: EAN-13, EAN-8, UPC-A and UPC-E. QR, Code 128, Code 39,
Code 93, ITF-14, DataMatrix and PDF417 are detected only to tell the customer
"Not a product barcode"; they are never looked up and never touch the cart.

**Normalisation**: values are trimmed and check digits verified. EAN-13, UPC-A
and UPC-E are converted to **GTIN-13** (UPC-A `036000291452` → `0036000291452`),
because iOS and Android report UPC codes differently. EAN-8 stays 8 digits.
The catalog should store barcodes in this same form.

**No parallel processing**: a synchronous lock is taken on the first detection,
and the camera's `onBarcodeScanned` is switched off until the result is handled.

**Duplicates**: the same barcode is ignored as long as it stays in view, and for
3 s after it was last seen. A successful scan clears itself after 1.5 s. The
customer can press **Scan next** to scan the same product again on purpose
(e.g. a second carton of milk).

**Invalid scans never reach the cart**: unknown, unsupported, unreadable and
failed lookups all stop before `addScannedProduct`. A product whose `storeId`
or barcode doesn't match the request is rejected as well.

**Lookups**: 8 s timeout, cancelled when the scanner closes. Failures show
**Try again** (double taps are ignored) and **Scan another**.

**Camera**: mounted only while permission is granted, the screen is focused and
the app is in the foreground, so leaving the scanner releases the camera.
Handled states: checking, ask for permission, permanently denied (with
**Open Settings**), no camera (web/simulator) and camera failed to start.

**Accessibility**: every state has its own icon and text (feedback doesn't rely on
colour alone), status changes are announced to screen readers, and buttons are at least 48 px tall.

## Integration points for the rest of the team

### Store selection (#15): `features/store-selection/active-store.tsx`
A minimal `ActiveStoreProvider` / `useActiveStore()` placeholder. The `Store`
type matches the `/api/v1/stores` response on `feature/4-store-selection`.
Replace the internals with the real store state; keep `useActiveStore()` returning
`{ activeStore, setActiveStore, clearActiveStore }`, and the scanner keeps working.

### Product catalog: proposed backend endpoint
The scanner needs one endpoint that does not exist in `apps/api` yet:

```text
GET /api/v1/stores/:storeId/products/barcode/:barcode
200 { "id": "…", "name": "Milk 1 L", "barcode": "6408430000159", "storeId": "…",
      "price": { "amount": 1.29, "currency": "EUR" } }       // price may be null
404 { "error": "Product not found" }                          // must be JSON
```

It maps directly onto the existing `products` and `store_products` tables
(join on `product_id`, filter on `store_id` and `barcode`). A 404 **without** a
JSON body is treated as "endpoint missing" (an error), not "product not found".

### Shopping cart (#28): `features/cart/cart-gateway.tsx`
The scanner calls only:

```ts
interface CartGateway {
  addScannedProduct(product: ScannedProduct): Promise<void>; // reject = failure shown to the user
}
```

The current in-memory cart exists only so the flow works. Quantity rules, store
scoping (#30) and totals (#31) belong to the real cart. Replace what
`<CartProvider>` provides and keep `useCart()` returning `{ gateway, itemCount }`.

## Trying it in development

Development switches go in `apps/mobile/.env.local` (gitignored). Restart Expo after changing them.

```bash
EXPO_PUBLIC_DEV_MOCK_STORE=1       # start with "Dev Mock Store" selected (dev builds only)
EXPO_PUBLIC_CATALOG_SOURCE=api     # use the backend endpoint above instead of mock data
EXPO_PUBLIC_API_URL=http://192.168.1.10:8000   # optional, defaults to your PC's address
```

Development builds also show a **"DEV: type a barcode"** field under the camera,
so the flow can be tested in the web build or a simulator without a camera.

Mock catalog barcodes:

| Barcode | Result |
| --- | --- |
| `6408430000159` | Milk 1 L, 1.29 € |
| `6415600501811` | Rye bread, 2.49 € |
| `6411300000494` | Coffee 500 g, 5.99 € |
| `4006381333931` | Chocolate bar, 1.79 € |
| `96385074` (EAN-8) | Chewing gum, 0.99 € |
| `036000291452` (UPC-A) | Soda can, no price |
| `5901234123457` | Simulated catalog failure |
| any other valid EAN | Product not found |
| `HELLO` | Not a product barcode |

Camera scanning works in **Expo Go**; the camera plugin settings in `app.json`
(the iOS permission text) only apply to development/production builds.

## Tests

```bash
npm run test --workspace=mobile
```

The automated tests cover normalisation, the state machine, duplicate
suppression, the API client (404 / errors / timeout / cancel) and the full hook
(no parallel lookups, invalid scans never touch the cart, retries, cancellation
on close).

### Manual device checklist (#19)

Run on one iOS and one Android phone and note the results in issue #19.

- [ ] Scan button without a store shows the hint; with a store it opens the scanner
- [ ] First open asks for camera permission; **Allow** shows the preview
- [ ] Deny permission → explanation; deny permanently → **Open Settings** works
- [ ] EAN-13, EAN-8, UPC-A and UPC-E products are recognised
- [ ] A QR code shows "Not a product barcode"; the cart count doesn't change
- [ ] Holding the phone over one product adds it only once
- [ ] **Scan next** lets you scan the same product again
- [ ] Airplane mode with the API catalog → "No connection…" → **Try again** works once back online
- [ ] Closing the scanner turns the camera indicator off (iOS green dot / Android privacy dot)
- [ ] Sending the app to the background and back resumes the preview
- [ ] Layout fits a small phone (e.g. iPhone SE) without clipped buttons
- [ ] VoiceOver / TalkBack read out the scan result

## Known limitations

- Web only supports scanning in browsers with the `BarcodeDetector` API (Chrome on Android/desktop); the dev text field works everywhere.
- Store selection, the catalog endpoint and the cart are stand-ins (see above).
- `npm run lint` currently crashes for everyone (not caused by this feature): `apps/api` uses
  TypeScript 7, npm hoists it to the root `node_modules`, and ESLint's TypeScript
  parser can't load TypeScript 7. Tracked as part of #8.
