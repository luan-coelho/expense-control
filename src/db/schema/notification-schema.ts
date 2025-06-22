import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { usersTable } from './user-schema'

// Enum para tipos de notificação
export const notificationTypeEnum = pgEnum('notification_type', [
  'BUDGET_ALERT', // Alerta de orçamento excedido
  'RECURRING_REMINDER', // Lembrete de transação recorrente
  'FINANCIAL_GOAL', // Meta financeira atingida/próxima
  'LOW_BALANCE', // Saldo baixo em conta
  'MONTHLY_SUMMARY', // Resumo mensal
  'EXPENSE_LIMIT', // Limite de gastos atingido
  'CATEGORY_BUDGET', // Orçamento de categoria excedido
  'UNUSUAL_SPENDING', // Gasto incomum detectado
])

// Enum para status da notificação
export const notificationStatusEnum = pgEnum('notification_status', [
  'UNREAD', // Não lida
  'READ', // Lida
  'ARCHIVED', // Arquivada
])

// Enum para prioridade da notificação
export const notificationPriorityEnum = pgEnum('notification_priority', [
  'LOW', // Baixa
  'MEDIUM', // Média
  'HIGH', // Alta
  'URGENT', // Urgente
])

// Tabela de notificações
export const notificationsTable = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  status: notificationStatusEnum('status').notNull().default('UNREAD'),
  priority: notificationPriorityEnum('priority').notNull().default('MEDIUM'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data'), // Dados contextuais específicos do tipo de notificação
  isActionable: boolean('is_actionable').default(false).notNull(), // Se requer ação do usuário
  actionUrl: text('action_url'), // URL para ação relacionada
  readAt: timestamp('read_at'), // Quando foi lida
  archivedAt: timestamp('archived_at'), // Quando foi arquivada
  expiresAt: timestamp('expires_at'), // Data de expiração (opcional)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Tipos TypeScript para a tabela de notificações
export type Notification = typeof notificationsTable.$inferSelect
export type NewNotification = typeof notificationsTable.$inferInsert

// Tipos específicos para dados contextuais por tipo de notificação
export interface BudgetAlertData {
  budgetId: string
  budgetName: string
  currentAmount: number
  limitAmount: number
  percentage: number
}

export interface RecurringReminderData {
  transactionId: string
  transactionDescription: string
  amount: number
  dueDate: string
  recurrencePattern: string
}

export interface FinancialGoalData {
  goalId: string
  goalName: string
  currentAmount: number
  targetAmount: number
  percentage: number
  deadline?: string
}

export interface LowBalanceData {
  accountId: string
  accountName: string
  currentBalance: number
  minimumBalance: number
}

export interface MonthlySummaryData {
  month: string
  year: number
  totalIncome: number
  totalExpenses: number
  balance: number
  topCategories: Array<{
    categoryName: string
    amount: number
  }>
}

export interface ExpenseLimitData {
  categoryId?: string
  categoryName?: string
  spaceId?: string
  spaceName?: string
  currentAmount: number
  limitAmount: number
  period: 'daily' | 'weekly' | 'monthly'
}

export interface CategoryBudgetData {
  categoryId: string
  categoryName: string
  currentAmount: number
  budgetAmount: number
  percentage: number
  period: 'monthly' | 'yearly'
}

export interface UnusualSpendingData {
  transactionId: string
  amount: number
  categoryName: string
  averageAmount: number
  deviation: number
}

// Union type para todos os tipos de dados contextuais
export type NotificationData =
  | BudgetAlertData
  | RecurringReminderData
  | FinancialGoalData
  | LowBalanceData
  | MonthlySummaryData
  | ExpenseLimitData
  | CategoryBudgetData
  | UnusualSpendingData

// Tipo para notificação com dados tipados
export interface NotificationWithData<T extends NotificationData = NotificationData>
  extends Omit<Notification, 'data'> {
  data: T | null
}
