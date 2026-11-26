import { Context, Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { db } from './prisma/db.js'

import * as userController from './controllers/userController.js'
import * as storeController from './controllers/storeController.js'
import * as storeProductController from './controllers/storeProductController.js'

const app = new Hono()

const api = app.basePath('/api/v1')
app.use('*', logger())
app.use('*', cors())


/**
 * Health check endpoint for liveness probe. Returns a JSON object with the status, uptime, and timestamp.
 */
app.get('/health/live', (c: Context) => {
  const uptime = process.uptime()
  const timestamp = new Date().toLocaleString()
  return c.json({ status: 'healthy', uptime, timestamp })
})

/**
 * Health check endpoint for readiness probe. Checks if the database and downstream services are available.
 */
app.get('/health/ready', async (c: Context) => {
  const uptime = process.uptime()
  const timestamp = new Date().toLocaleString()
  // Check if the database is connected with a trivial `SELECT 1` round trip.
  let db_connected = false
  try {
    const plan = db.raw.sql`SELECT 1 AS ok`.returnsRow({ ok: 'pg/int4@1' }).build()
    const rows = await db.query(plan)
    db_connected = rows.length === 1
  } catch {
    db_connected = false
  }
  const status = db_connected ? 'ready' : 'not ready'

  return c.json({ status, uptime, db_connected, timestamp })
})

  

/**
 * Root endpoint.
 */
api.get('/', (c: Context) => {
  return c.text('Hello Hono!')
})

/**
 * Dummy endpoints for the team.
 */
api.get('/team', userController.getAllUsers)

api.get('/team/:id', userController.getUserById)

/**
 * Endpoints for stores.
 */
api.get('/stores', storeController.getAllStores)

api.get('/stores/:storeId', storeController.getStoreById)

api.get('/stores/name/:storeName', storeController.getStoreByName)

api.get('/stores-addresses', storeController.getAllStoresWithAddress)

api.get('/stores/:storeId/address', storeController.getStoreWithAddressById)

/**
 * Endpoints for store products.
 */
api.get('/stores/:storeId/products/barcode/:barcode', storeProductController.getStoreProductByBarcode)

export default app
