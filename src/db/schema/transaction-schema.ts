import { boolean, decimal, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { usersTable } from './user-schema'
import { categoriesTable } from './category-schema'
import { spacesTable } from './space-schema'
import { accountsTable } from './account-schema'

// Enum para tipos de transação
export const transactionTypeEnum = pgEnum('transaction_type', ['INCOME', 'EXPENSE'])

// Tabela de transações
export const transactionsTable = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  date: timestamp('date').notNull(),
  description: text('description').notNull(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categoriesTable.id, { onDelete: 'restrict' }),
  spaceId: uuid('space_id')
    .notNull()
    .references(() => spacesTable.id, { onDelete: 'restrict' }),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accountsTable.id, { onDelete: 'restrict' }),
  type: transactionTypeEnum('type').notNull(),
  isRecurrent: boolean('is_recurrent').default(false).notNull(),
  recurrencePattern: text('recurrence_pattern'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Tipos TypeScript para a tabela de transações
export type Transaction = typeof transactionsTable.$inferSelect
export type NewTransaction = typeof transactionsTable.$inferInsert 