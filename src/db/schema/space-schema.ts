import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { usersTable } from './user-schema'

// Tabela de espaços
export const spacesTable = pgTable('spaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Tipos TypeScript para a tabela de espaços
export type Space = typeof spacesTable.$inferSelect
export type NewSpace = typeof spacesTable.$inferInsert 