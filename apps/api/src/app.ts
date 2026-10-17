import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono().basePath('/api/v1')

app.use('*', logger())
app.use('*', cors())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/team', (c) => {
  return c.json({
    team: 'UniBlip',
    members: [
      { name: 'Jesper', role: 'Frontend' },
      { name: 'Mads', role: 'Backend' },
      { name: 'Mikkel', role: 'Backend' },
      { name: 'Nikolaj', role: 'Frontend' }
    ]
  })
})

app.get('/health', (c) => {
  return c.json({ status: 'is not broken (yet)' })
})

export default app
