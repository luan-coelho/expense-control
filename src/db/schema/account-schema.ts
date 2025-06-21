import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { usersTable } from './user-schema'

// Tabela de contas
export const accountsTable = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Tipos TypeScript para a tabela de contas
export type Account = typeof accountsTable.$inferSelect
export type NewAccount = typeof accountsTable.$inferInsert 