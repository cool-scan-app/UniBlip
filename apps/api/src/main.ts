import { serve } from '@hono/node-server'
import app from './app.js'
import runMigrations from './db/migrate.js'

// Run database migrations before starting the server
runMigrations()

serve({
  fetch: app.fetch,
  port: 8000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
