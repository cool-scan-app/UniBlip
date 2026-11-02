import { pgTable, serial, text, timestamp, varchar, point } from 'drizzle-orm/pg-core'

export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  location: point('location'),
  created_at: timestamp('created_at').defaultNow().notNull(),
})