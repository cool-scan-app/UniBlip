import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const carts = pgTable('carts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  items: text('items').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
})