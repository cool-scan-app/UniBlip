import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The repository is the only layer that touches the database. Mocking it lets
// the tests exercise routing, controllers and services without a live Postgres.
vi.mock('../src/repositories/storeRepository', () => ({
  getAllStores: vi.fn(),
  getStoreById: vi.fn(),
  getStoreByName: vi.fn(),
  getAllStoresWithAddress: vi.fn(),
  getStoreWithAddressById: vi.fn(),
}))

// app.ts imports the db client for the health check; stub it so no connection is created.
vi.mock('../src/prisma/db', () => ({ db: {} }))

import app from '../src/app'
import * as storeRepository from '../src/repositories/storeRepository'

const repo = vi.mocked(storeRepository)

const BASE = '/api/v1'

const stores = [
  { id: 'store-1', name: 'Citymarket Kupittaa', latitude: 60.4417566, longitude: 22.2862651 },
  { id: 'store-2', name: 'IKEA Raisio', latitude: 60.494487898100616, longitude: 22.2290341894674 },
]

const storesWithAddress = [
  { id: 'store-1', name: 'Citymarket Kupittaa', street: 'Uudenmaantie', streetNr: '17', city: 'Turku', postalCode: '20700' },
  { id: 'store-2', name: 'IKEA Raisio', street: 'Itäniityntie', streetNr: '15', city: 'Raisio', postalCode: '21280' },
]

const storeWithAddress = {
  id: 'store-1',
  name: 'Citymarket Kupittaa',
  latitude: 60.4417566,
  longitude: 22.2862651,
  street: 'Uudenmaantie',
  streetNr: '17',
  city: 'Turku',
  postalCode: '20700',
}

beforeEach(() => {
  vi.resetAllMocks()
  // Controllers log errors on the 500 path; keep test output clean.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GET /api/v1/stores', () => {
  it('returns all stores', async () => {
    repo.getAllStores.mockResolvedValue(stores as any)

    const res = await app.request(`${BASE}/stores`)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(stores)
    expect(repo.getAllStores).toHaveBeenCalledOnce()
  })

  it('returns an empty array when there are no stores', async () => {
    repo.getAllStores.mockResolvedValue([] as any)

    const res = await app.request(`${BASE}/stores`)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns 500 when the repository fails', async () => {
    repo.getAllStores.mockRejectedValue(new Error('db down'))

    const res = await app.request(`${BASE}/stores`)

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Failed to fetch stores' })
  })
})

describe('GET /api/v1/stores/:storeId', () => {
  it('returns the store with the given id', async () => {
    repo.getStoreById.mockResolvedValue(stores[0] as any)

    const res = await app.request(`${BASE}/stores/store-1`)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(stores[0])
    expect(repo.getStoreById).toHaveBeenCalledWith('store-1')
  })

  it('returns 404 when the store does not exist', async () => {
    repo.getStoreById.mockResolvedValue(null as any)

    const res = await app.request(`${BASE}/stores/missing`)

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Store not found' })
  })

  it('returns 500 when the repository fails', async () => {
    repo.getStoreById.mockRejectedValue(new Error('db down'))

    const res = await app.request(`${BASE}/stores/store-1`)

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Failed to fetch store' })
  })
})

describe('GET /api/v1/stores/name/:storeName', () => {
  it('returns the store with the given name', async () => {
    repo.getStoreByName.mockResolvedValue(stores[1] as any)

    const res = await app.request(`${BASE}/stores/name/IKEA%20Raisio`)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(stores[1])
    expect(repo.getStoreByName).toHaveBeenCalledWith('IKEA Raisio')
  })

  it('decodes non-ASCII store names', async () => {
    repo.getStoreByName.mockResolvedValue({ id: 'store-3', name: 'Café Arken', latitude: 60.45, longitude: 22.27 } as any)

    const res = await app.request(`${BASE}/stores/name/${encodeURIComponent('Café Arken')}`)

    expect(res.status).toBe(200)
    expect(repo.getStoreByName).toHaveBeenCalledWith('Café Arken')
  })

  it('does not get routed to the by-id handler', async () => {
    repo.getStoreByName.mockResolvedValue(stores[0] as any)

    await app.request(`${BASE}/stores/name/Citymarket`)

    expect(repo.getStoreById).not.toHaveBeenCalled()
  })

  it('returns 404 when no store has that name', async () => {
    repo.getStoreByName.mockResolvedValue(null as any)

    const res = await app.request(`${BASE}/stores/name/Nowhere`)

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Store not found' })
  })

  it('returns 500 when the repository fails', async () => {
    repo.getStoreByName.mockRejectedValue(new Error('db down'))

    const res = await app.request(`${BASE}/stores/name/IKEA`)

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Failed to fetch store' })
  })
})

describe('GET /api/v1/stores-addresses', () => {
  it('returns all stores with their address', async () => {
    repo.getAllStoresWithAddress.mockResolvedValue(storesWithAddress as any)

    const res = await app.request(`${BASE}/stores-addresses`)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(storesWithAddress)
    expect(repo.getAllStoresWithAddress).toHaveBeenCalledOnce()
  })

  it('returns an empty array when there are no stores', async () => {
    repo.getAllStoresWithAddress.mockResolvedValue([] as any)

    const res = await app.request(`${BASE}/stores-addresses`)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns 500 when the repository fails', async () => {
    repo.getAllStoresWithAddress.mockRejectedValue(new Error('db down'))

    const res = await app.request(`${BASE}/stores-addresses`)

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Failed to fetch stores with address' })
  })
})

describe('GET /api/v1/stores/:storeId/address', () => {
  it('returns the store with its address', async () => {
    repo.getStoreWithAddressById.mockResolvedValue(storeWithAddress as any)

    const res = await app.request(`${BASE}/stores/store-1/address`)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(storeWithAddress)
    expect(repo.getStoreWithAddressById).toHaveBeenCalledWith('store-1')
  })

  it('returns 404 when the store does not exist', async () => {
    repo.getStoreWithAddressById.mockResolvedValue(undefined as any)

    const res = await app.request(`${BASE}/stores/missing/address`)

    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Store not found' })
  })

  it('returns 500 when the repository fails', async () => {
    repo.getStoreWithAddressById.mockRejectedValue(new Error('db down'))

    const res = await app.request(`${BASE}/stores/store-1/address`)

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Failed to fetch store with address' })
  })
})
