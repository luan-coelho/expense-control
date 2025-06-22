import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

// Tabela de usuários
export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').unique(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt'),
})

// Tipos TypeScript para a tabela de usuários
export type User = typeof usersTable.$inferSelect
export type NewUser = typeof usersTable.$inferInsert
