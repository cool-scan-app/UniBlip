import { serve } from '@hono/node-server'
import app from './app.js'
import { deleteExpiredSessions } from './services/sessionService.js'

const SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

serve({
  fetch: app.fetch,
  port: 8000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

/**
 * Periodically delete expired sessions. Their carts are removed by the ON DELETE CASCADE.
 */
const cleanupExpiredSessions = async () => {
  try {
    const deleted = await deleteExpiredSessions()
    if (deleted > 0) {
      console.log(`Deleted ${deleted} expired session(s)`)
    }
  } catch (error) {
    console.error('Failed to delete expired sessions', error)
  }
}

setInterval(cleanupExpiredSessions, SESSION_CLEANUP_INTERVAL_MS).unref()
