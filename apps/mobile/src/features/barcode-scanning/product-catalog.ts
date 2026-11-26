/**
 * Store-specific product lookup (issue #23).
 *
 * The scanner talks to the catalog only through the `ProductCatalog` interface.
 * Two implementations exist:
 *  - `createApiProductCatalog`: calls the backend endpoint below.
 *  - `createMockProductCatalog`: in-memory data for development.
 *
 * Backend contract (apps/api, mounted under `/api/v1`, which is part of `baseUrl`):
 *   GET {baseUrl}/stores/:storeId/products/barcode/:barcode
 *   200 -> { id, name, brand, barcode, storeId, price_in_cents }
 *   404 -> { "error": "Store product not found" }
 * `barcode` is the canonical GTIN produced by `normalizeBarcode`.
 * `price_in_cents` is an integer amount in euro cents.
 */

export type ScannedProduct = {
  id: string;
  name: string;
  brand: string;
  barcode: string;
  storeId: string;
  price_in_cents: number;
};

export type ProductLookupRequest = {
  storeId: string;
  barcode: string;
  signal?: AbortSignal;
};

export type ProductLookupResult = { status: 'found'; product: ScannedProduct } | { status: 'not-found' };

export interface ProductCatalog {
  /**
   * Resolves `found` or `not-found`. Rejects with `ProductLookupError` when the
   * lookup could not be completed (network, server, timeout, bad response).
   */
  lookup(request: ProductLookupRequest): Promise<ProductLookupResult>;
}

export class ProductLookupError extends Error {
  constructor(
    message: string,
    readonly reason: 'network' | 'timeout' | 'server' | 'bad-response' | 'aborted',
  ) {
    super(message);
    this.name = 'ProductLookupError';
  }
}

const DEFAULT_TIMEOUT_MS = 8000;

export function createApiProductCatalog({
  baseUrl,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = fetch,
}: {
  baseUrl: string;
  timeoutMs?: number;
  fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>;
}): ProductCatalog {
  return {
    async lookup({ storeId, barcode, signal }) {
      const url = `${baseUrl.replace(/\/$/, '')}/stores/${encodeURIComponent(storeId)}/products/barcode/${encodeURIComponent(barcode)}`;

      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
      const forwardAbort = () => controller.abort();
      if (signal?.aborted) controller.abort();
      signal?.addEventListener('abort', forwardAbort);

      let response: Response;
      try {
        response = await fetchImpl(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      } catch {
        if (timedOut) throw new ProductLookupError('The product lookup took too long.', 'timeout');
        if (signal?.aborted) throw new ProductLookupError('The product lookup was cancelled.', 'aborted');
        throw new ProductLookupError('Could not reach the product catalog.', 'network');
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', forwardAbort);
      }

      const body: unknown = await response.json().catch(() => undefined);

      if (response.status === 404) {
        // A JSON 404 means "no such product in this store". A non-JSON 404
        // means the endpoint itself is missing, which is a server problem.
        if (body && typeof body === 'object') return { status: 'not-found' };
        throw new ProductLookupError('The product catalog is not available.', 'server');
      }
      if (!response.ok) {
        throw new ProductLookupError(`The product catalog returned an error (${response.status}).`, 'server');
      }

      const product = parseProduct(body);
      if (!product) throw new ProductLookupError('The product catalog sent an unexpected response.', 'bad-response');
      if (product.storeId !== storeId || product.barcode !== barcode) {
        throw new ProductLookupError('The product catalog returned a different product.', 'bad-response');
      }
      return { status: 'found', product };
    },
  };
}

function parseProduct(value: unknown): ScannedProduct | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v.id !== 'string' ||
    typeof v.name !== 'string' ||
    typeof v.brand !== 'string' ||
    typeof v.barcode !== 'string' ||
    typeof v.storeId !== 'string' ||
    !Number.isInteger(v.price_in_cents) ||
    (v.price_in_cents as number) < 0
  ) {
    return null;
  }
  return {
    id: v.id,
    name: v.name,
    brand: v.brand,
    barcode: v.barcode,
    storeId: v.storeId,
    price_in_cents: v.price_in_cents as number,
  };
}

/** Development data. Barcodes are canonical GTINs with valid check digits. */
export const MOCK_PRODUCTS: Omit<ScannedProduct, 'storeId'>[] = [
  { id: 'mock-milk', name: 'Milk 1 L', barcode: '6408430000159', price_in_cents: 129, brand: 'Valio' },
  { id: 'mock-bread', name: 'Rye bread', barcode: '6415600501811', price_in_cents: 249, brand: 'Vaasan' },
  { id: 'mock-coffee', name: 'Coffee 500 g', barcode: '6411300000494', price_in_cents: 599, brand: 'Löfbergs Lila' },
  { id: 'mock-chocolate', name: 'Chocolate bar', barcode: '4006381333931', price_in_cents: 179, brand: 'Fazer' },
  { id: 'mock-gum', name: 'Chewing gum', barcode: '96385074', price_in_cents: 99, brand: 'Jenkki' },
  { id: 'mock-soda', name: 'Soda can', barcode: '0036000291452', price_in_cents: 200, brand: 'Pepsi' },
];

/** Looking up this barcode in the mock catalog simulates a server error. */
export const MOCK_FAILING_BARCODE = '5901234123457';

export function createMockProductCatalog({ delayMs = 400 }: { delayMs?: number } = {}): ProductCatalog {
  return {
    lookup({ storeId, barcode, signal }) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          signal?.removeEventListener('abort', onAbort);
          if (barcode === MOCK_FAILING_BARCODE) {
            reject(new ProductLookupError('Simulated catalog failure.', 'server'));
            return;
          }
          const match = MOCK_PRODUCTS.find((p) => p.barcode === barcode);
          resolve(match ? { status: 'found', product: { ...match, storeId } } : { status: 'not-found' });
        }, delayMs);
        const onAbort = () => {
          clearTimeout(timer);
          reject(new ProductLookupError('The product lookup was cancelled.', 'aborted'));
        };
        if (signal?.aborted) return onAbort();
        signal?.addEventListener('abort', onAbort);
      });
    },
  };
}
