import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { usersTable } from './user-schema'

// Tabela de categorias - suporta categorias predefinidas do sistema e customizadas do usuário
export const categoriesTable = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  // userId é nulo para categorias predefinidas do sistema, preenchido para categorias customizadas
  userId: uuid('user_id').references(() => usersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // Indica se é uma categoria predefinida do sistema (true) ou customizada pelo usuário (false)
  isDefault: boolean('is_default').default(false).notNull(),
  // Ícone para exibição na UI (nome do ícone, emoji, ou classe CSS)
  icon: text('icon'),
  // Cor em formato hexadecimal ou nome CSS para personalização visual
  color: text('color'),
  // Referência para categoria pai (permite hierarquia de categorias/subcategorias)
  parentId: uuid('parent_id'),
  // Tipo de transação que esta categoria se aplica (INCOME, EXPENSE, ou ambos se nulo)
  type: text('type'), // 'INCOME', 'EXPENSE', ou null para ambos
  // Ordem de exibição para categorias predefinidas
  sortOrder: text('sort_order'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Tipos TypeScript para a tabela de categorias
export type Category = typeof categoriesTable.$inferSelect
export type NewCategory = typeof categoriesTable.$inferInsert

// Tipo para categoria com subcategorias (para consultas hierárquicas)
export type CategoryWithChildren = Category & {
  children?: CategoryWithChildren[]
} 