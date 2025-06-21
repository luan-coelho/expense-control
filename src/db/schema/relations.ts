import { relations } from 'drizzle-orm'
import { usersTable } from './user-schema'
import { categoriesTable } from './category-schema'
import { spacesTable } from './space-schema'
import { accountsTable } from './account-schema'
import { transactionsTable } from './transaction-schema'

// Relacionamentos do usuário
export const usersRelations = relations(usersTable, ({ many }) => ({
  transactions: many(transactionsTable),
  categories: many(categoriesTable),
  spaces: many(spacesTable),
  accounts: many(accountsTable),
}))

// Relacionamentos das categorias
export const categoriesRelations = relations(categoriesTable, ({ one, many }) => ({
  // Relacionamento com usuário (nulo para categorias predefinidas do sistema)
  user: one(usersTable, {
    fields: [categoriesTable.userId],
    references: [usersTable.id],
  }),
  // Relacionamento com transações
  transactions: many(transactionsTable),
  // Relacionamento hierárquico - categoria pai
  parent: one(categoriesTable, {
    fields: [categoriesTable.parentId],
    references: [categoriesTable.id],
    relationName: 'categoryHierarchy',
  }),
  // Relacionamento hierárquico - subcategorias
  children: many(categoriesTable, {
    relationName: 'categoryHierarchy',
  }),
}))

// Relacionamentos dos espaços
export const spacesRelations = relations(spacesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [spacesTable.userId],
    references: [usersTable.id],
  }),
  transactions: many(transactionsTable),
}))

// Relacionamentos das contas
export const accountsRelations = relations(accountsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [accountsTable.userId],
    references: [usersTable.id],
  }),
  transactions: many(transactionsTable),
}))

// Relacionamentos das transações
export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [transactionsTable.userId],
    references: [usersTable.id],
  }),
  category: one(categoriesTable, {
    fields: [transactionsTable.categoryId],
    references: [categoriesTable.id],
  }),
  space: one(spacesTable, {
    fields: [transactionsTable.spaceId],
    references: [spacesTable.id],
  }),
  account: one(accountsTable, {
    fields: [transactionsTable.accountId],
    references: [accountsTable.id],
  }),
})) 