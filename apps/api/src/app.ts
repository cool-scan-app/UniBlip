import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

const api = app.basePath('/api/v1')
app.use('*', logger())
app.use('*', cors())

/**
 * Health check endpoint for liveness probe. Returns a JSON object with the status, uptime, and timestamp.
 */
app.get('/health/live', (c) => {
  const uptime = process.uptime()
  const timestamp = new Date().toLocaleString()
  return c.json({ status: 'healthy', uptime, timestamp })
})

/**
 * Health check endpoint for readiness probe. Checks if the database and downstream services are available.
 */
app.get('/health/ready', (c) => {
  const uptime = process.uptime()
  const timestamp = new Date().toLocaleString()
  return c.json({ status: 'Not yet ready. Database and downstream services are not yet implemented.', uptime, timestamp })
})

/**
 * Root endpoint.
 */
api.get('/', (c) => {
  return c.text('Hello Hono!')
})

/**
 * Dummy endpoint for the team.
 */
api.get('/team', (c) => {
  return c.json({
    team: 'UniBlip',
    members: [
      { name: 'Bolex Bolero', roles: ['PM', 'Frontend'] },
      { name: 'Julia Wentalite', roles: ['UI/UX', 'Frontend'] },
      { name: 'Tob Babarin', roles: ['QA', 'Backend'] },
      { name: 'Jesper', roles: ['PO', 'Backend'] }
    ]
  })
})

export default app
