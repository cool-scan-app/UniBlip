import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import sql from './db/pgsql.js'

const app = new Hono()

const api = app.basePath('/api/v1')
app.use('*', logger())
app.use('*', cors())

interface City {
  name: string
  location: string
}
interface Weather {
  city: string
  temp_lo: number
  temp_hi: number
  prcp: number
  date: Date
}

api.get('/db', async (c) => {
  const result = await sql<Weather[]>`SELECT * FROM weather;`
  return c.json(result)
})

api.get('/db/:temp_lo', async (c) => {
  const temp_lo = c.req.param('temp_lo')
  const result = await sql<Weather[]>`SELECT * FROM weather WHERE temp_lo = ${temp_lo};`
  return c.json(result[0])
})

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
  const dburl = process.env.DATABASE_URL
  return c.json({ status: 'Not yet ready. Database and downstream services are not yet implemented.', uptime, timestamp, dburl })
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
