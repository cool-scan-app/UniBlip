import { describe, expect, it, jest } from '@jest/globals';

import { createApiProductCatalog, createMockProductCatalog, ProductLookupError } from '../product-catalog';

const product = {
  id: 'p1',
  name: 'Milk',
  barcode: '6408430000159',
  brand: 'Valio',
  storeId: 'store-1',
  price_in_cents: 129,
};

function jsonResponse(status: number, body: unknown): Response {
  return { status, ok: status >= 200 && status < 300, json: async () => body } as unknown as Response;
}

describe('createApiProductCatalog', () => {
  it('requests the store-specific endpoint and parses the product', async () => {
    const fetchImpl = jest.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => jsonResponse(200, product));
    const catalog = createApiProductCatalog({ baseUrl: 'http://api.test/', fetchImpl });

    const result = await catalog.lookup({ storeId: 'store-1', barcode: '6408430000159' });

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://api.test/stores/store-1/products/barcode/6408430000159',
      expect.objectContaining({ signal: expect.anything() }),
    );
    expect(result).toEqual({ status: 'found', product });
  });

  it('returns not-found for a JSON 404', async () => {
    const catalog = createApiProductCatalog({
      baseUrl: 'http://api.test',
      fetchImpl: async () => jsonResponse(404, { error: 'Product not found' }),
    });
    await expect(catalog.lookup({ storeId: 'store-1', barcode: '1' })).resolves.toEqual({ status: 'not-found' });
  });

  it('treats a non-JSON 404 (missing endpoint) as a server error, not "not found"', async () => {
    const catalog = createApiProductCatalog({
      baseUrl: 'http://api.test',
      fetchImpl: async () =>
        ({ status: 404, ok: false, json: async () => Promise.reject(new Error('not json')) }) as unknown as Response,
    });
    await expect(catalog.lookup({ storeId: 'store-1', barcode: '1' })).rejects.toMatchObject({ reason: 'server' });
  });

  it('rejects a product belonging to another store', async () => {
    const catalog = createApiProductCatalog({
      baseUrl: 'http://api.test',
      fetchImpl: async () => jsonResponse(200, { ...product, storeId: 'other-store' }),
    });
    await expect(catalog.lookup({ storeId: 'store-1', barcode: product.barcode })).rejects.toMatchObject({
      reason: 'bad-response',
    });
  });

  it('maps network failures and server errors', async () => {
    const offline = createApiProductCatalog({
      baseUrl: 'http://api.test',
      fetchImpl: async () => {
        throw new TypeError('Network request failed');
      },
    });
    await expect(offline.lookup({ storeId: 's', barcode: '1' })).rejects.toMatchObject({ reason: 'network' });

    const broken = createApiProductCatalog({ baseUrl: 'http://api.test', fetchImpl: async () => jsonResponse(500, {}) });
    await expect(broken.lookup({ storeId: 's', barcode: '1' })).rejects.toBeInstanceOf(ProductLookupError);
  });

  it('times out slow requests', async () => {
    const catalog = createApiProductCatalog({
      baseUrl: 'http://api.test',
      timeoutMs: 10,
      fetchImpl: (_url, init) =>
        new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))),
    });
    await expect(catalog.lookup({ storeId: 's', barcode: '1' })).rejects.toMatchObject({ reason: 'timeout' });
  });

  it('can be cancelled by the caller', async () => {
    const controller = new AbortController();
    const catalog = createApiProductCatalog({
      baseUrl: 'http://api.test',
      fetchImpl: (_url, init) =>
        new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))),
    });
    const pending = catalog.lookup({ storeId: 's', barcode: '1', signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ reason: 'aborted' });
  });
});

describe('createMockProductCatalog', () => {
  it('finds known products for the requested store', async () => {
    const catalog = createMockProductCatalog({ delayMs: 0 });
    await expect(catalog.lookup({ storeId: 'any', barcode: '6408430000159' })).resolves.toMatchObject({
      status: 'found',
      product: { storeId: 'any', barcode: '6408430000159' },
    });
    await expect(catalog.lookup({ storeId: 'any', barcode: '0000000000000' })).resolves.toEqual({ status: 'not-found' });
  });
});
