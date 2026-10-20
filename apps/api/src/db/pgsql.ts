import 'dotenv/config'
import postgres from 'postgres'

const db_url = process.env.DATABASE_URL
if (!db_url) {
  throw new Error('DATABASE_URL is not defined in the environment variables.')
}
const sql = postgres(db_url)

export default sql