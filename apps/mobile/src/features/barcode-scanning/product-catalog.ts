/**
 * Store-specific product lookup (issue #23).
 *
 * The scanner talks to the catalog only through the `ProductCatalog` interface.
 * Two implementations exist:
 *  - `createApiProductCatalog`: calls the backend endpoint proposed below.
 *  - `createMockProductCatalog`: in-memory data for development until that
 *    endpoint exists.
 *
 * Proposed backend contract (not implemented in apps/api yet):
 *   GET /api/v1/stores/:storeId/products/barcode/:barcode
 *   200 -> { id, name, barcode, storeId, price: { amount, currency } | null }
 *   404 -> { "error": "Product not found" }
 * `barcode` is the canonical GTIN produced by `normalizeBarcode`.
 */

export type Money = {
  /** Decimal amount in major units, e.g. 2.49 */
  amount: number;
  /** ISO 4217 code, e.g. "EUR" */
  currency: string;
};

export type ScannedProduct = {
  id: string;
  name: string;
  barcode: string;
  storeId: string;
  price: Money | null;
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
      const url = `${baseUrl.replace(/\/$/, '')}/api/v1/stores/${encodeURIComponent(storeId)}/products/barcode/${encodeURIComponent(barcode)}`;

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


export function parseProduct(value: unknown): ScannedProduct | null {
  if (!value || typeof value !== 'object') return null;

  const { id, name, barcode, storeId, price } = value as Record<string, unknown>;

  if (
    typeof id !== 'string' || !id.trim() ||
    typeof name !== 'string' || !name.trim() ||
    typeof barcode !== 'string' || !/^\d{8,14}$/.test(barcode) ||
    typeof storeId !== 'string' || !storeId.trim()
  ) {
    return null;
  }

  if (price === null) return { id, name, barcode, storeId, price };
  if (!price || typeof price !== 'object') return null;

  const { amount: rawAmount, currency } = price as Record<string, unknown>;
  const amount =
    typeof rawAmount === 'string' && rawAmount.trim() !== ''
      ? Number(rawAmount)
      : rawAmount;

  if (
    typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 ||
    typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)
  ) {
    return null;
  }

  return { id, name, barcode, storeId, price: { amount, currency } };
}


/** Development data. Barcodes are canonical GTINs with valid check digits. */
export const MOCK_PRODUCTS: Omit<ScannedProduct, 'storeId'>[] = [
  { id: 'mock-milk', name: 'Milk 1 L', barcode: '6408430000159', price: { amount: 1.29, currency: 'EUR' } },
  { id: 'mock-bread', name: 'Rye bread', barcode: '6415600501811', price: { amount: 2.49, currency: 'EUR' } },
  { id: 'mock-coffee', name: 'Coffee 500 g', barcode: '6411300000494', price: { amount: 5.99, currency: 'EUR' } },
  { id: 'mock-chocolate', name: 'Chocolate bar', barcode: '4006381333931', price: { amount: 1.79, currency: 'EUR' } },
  { id: 'mock-gum', name: 'Chewing gum', barcode: '96385074', price: { amount: 0.99, currency: 'EUR' } },
  { id: 'mock-soda', name: 'Soda can', barcode: '0036000291452', price: null },
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
