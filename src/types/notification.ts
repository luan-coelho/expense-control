import { z } from 'zod'
import type {
  Notification,
  NewNotification,
  NotificationData,
  NotificationWithData,
  BudgetAlertData,
  RecurringReminderData,
  FinancialGoalData,
  LowBalanceData,
  MonthlySummaryData,
  ExpenseLimitData,
  CategoryBudgetData,
  UnusualSpendingData,
} from '@/db/schema/notification-schema'

// Re-exportar tipos do schema
export type {
  Notification,
  NewNotification,
  NotificationData,
  NotificationWithData,
  BudgetAlertData,
  RecurringReminderData,
  FinancialGoalData,
  LowBalanceData,
  MonthlySummaryData,
  ExpenseLimitData,
  CategoryBudgetData,
  UnusualSpendingData,
}

// Enums para uso no frontend
export const NotificationType = {
  BUDGET_ALERT: 'BUDGET_ALERT',
  RECURRING_REMINDER: 'RECURRING_REMINDER',
  FINANCIAL_GOAL: 'FINANCIAL_GOAL',
  LOW_BALANCE: 'LOW_BALANCE',
  MONTHLY_SUMMARY: 'MONTHLY_SUMMARY',
  EXPENSE_LIMIT: 'EXPENSE_LIMIT',
  CATEGORY_BUDGET: 'CATEGORY_BUDGET',
  UNUSUAL_SPENDING: 'UNUSUAL_SPENDING',
} as const

export const NotificationStatus = {
  UNREAD: 'UNREAD',
  READ: 'READ',
  ARCHIVED: 'ARCHIVED',
} as const

export const NotificationPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const

// Labels para exibição no frontend
export const NotificationTypeLabels = {
  [NotificationType.BUDGET_ALERT]: 'Alerta de Orçamento',
  [NotificationType.RECURRING_REMINDER]: 'Lembrete de Recorrência',
  [NotificationType.FINANCIAL_GOAL]: 'Meta Financeira',
  [NotificationType.LOW_BALANCE]: 'Saldo Baixo',
  [NotificationType.MONTHLY_SUMMARY]: 'Resumo Mensal',
  [NotificationType.EXPENSE_LIMIT]: 'Limite de Gastos',
  [NotificationType.CATEGORY_BUDGET]: 'Orçamento de Categoria',
  [NotificationType.UNUSUAL_SPENDING]: 'Gasto Incomum',
} as const

export const NotificationStatusLabels = {
  [NotificationStatus.UNREAD]: 'Não Lida',
  [NotificationStatus.READ]: 'Lida',
  [NotificationStatus.ARCHIVED]: 'Arquivada',
} as const

export const NotificationPriorityLabels = {
  [NotificationPriority.LOW]: 'Baixa',
  [NotificationPriority.MEDIUM]: 'Média',
  [NotificationPriority.HIGH]: 'Alta',
  [NotificationPriority.URGENT]: 'Urgente',
} as const

// Schemas de validação Zod
export const notificationTypeSchema = z.enum([
  'BUDGET_ALERT',
  'RECURRING_REMINDER',
  'FINANCIAL_GOAL',
  'LOW_BALANCE',
  'MONTHLY_SUMMARY',
  'EXPENSE_LIMIT',
  'CATEGORY_BUDGET',
  'UNUSUAL_SPENDING',
])

export const notificationStatusSchema = z.enum(['UNREAD', 'READ', 'ARCHIVED'])
export const notificationPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

// Schema para criar notificação
export const createNotificationSchema = z.object({
  type: notificationTypeSchema,
  priority: notificationPrioritySchema.default('MEDIUM'),
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  message: z.string().min(1, 'Mensagem é obrigatória').max(1000, 'Mensagem muito longa'),
  data: z.record(z.any()).optional(),
  isActionable: z.boolean().default(false),
  actionUrl: z.string().url('URL inválida').optional(),
  expiresAt: z.string().datetime().optional(),
})

// Schema para atualizar notificação
export const updateNotificationSchema = z.object({
  status: notificationStatusSchema.optional(),
  readAt: z.string().datetime().optional(),
  archivedAt: z.string().datetime().optional(),
})

// Schema para filtros de notificação
export const notificationFiltersSchema = z.object({
  type: notificationTypeSchema.optional(),
  status: notificationStatusSchema.optional(),
  priority: notificationPrioritySchema.optional(),
  isActionable: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
})

// Schema para configurações de notificação do usuário
export const notificationSettingsSchema = z.object({
  enableBudgetAlerts: z.boolean().default(true),
  enableRecurringReminders: z.boolean().default(true),
  enableFinancialGoals: z.boolean().default(true),
  enableLowBalanceAlerts: z.boolean().default(true),
  enableMonthlySummary: z.boolean().default(true),
  enableExpenseLimits: z.boolean().default(true),
  enableCategoryBudgets: z.boolean().default(true),
  enableUnusualSpending: z.boolean().default(false),
  budgetAlertThreshold: z.number().min(0).max(100).default(80), // Porcentagem
  lowBalanceThreshold: z.number().min(0).default(100), // Valor em reais
  unusualSpendingThreshold: z.number().min(1).default(2), // Multiplicador do desvio padrão
  emailNotifications: z.boolean().default(false),
  pushNotifications: z.boolean().default(true),
})

// Tipos derivados dos schemas
export type NotificationTypeEnum = z.infer<typeof notificationTypeSchema>
export type NotificationStatusEnum = z.infer<typeof notificationStatusSchema>
export type NotificationPriorityEnum = z.infer<typeof notificationPrioritySchema>
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>
export type NotificationFilters = z.infer<typeof notificationFiltersSchema>
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>

// Tipo para notificação com relacionamentos
export interface NotificationWithRelations extends Notification {
  user?: {
    id: string
    name: string | null
    email: string | null
  }
}

// Tipo para resposta paginada
export interface PaginatedNotifications {
  data: NotificationWithRelations[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Utilitários para notificações
export function getNotificationTypeLabel(type: NotificationTypeEnum): string {
  return NotificationTypeLabels[type]
}

export function getNotificationStatusLabel(status: NotificationStatusEnum): string {
  return NotificationStatusLabels[status]
}

export function getNotificationPriorityLabel(priority: NotificationPriorityEnum): string {
  return NotificationPriorityLabels[priority]
}

export function getNotificationPriorityColor(priority: NotificationPriorityEnum): string {
  switch (priority) {
    case 'LOW':
      return 'text-blue-600 bg-blue-50'
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-50'
    case 'HIGH':
      return 'text-orange-600 bg-orange-50'
    case 'URGENT':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export function getNotificationTypeIcon(type: NotificationTypeEnum): string {
  switch (type) {
    case 'BUDGET_ALERT':
      return '💰'
    case 'RECURRING_REMINDER':
      return '🔄'
    case 'FINANCIAL_GOAL':
      return '🎯'
    case 'LOW_BALANCE':
      return '⚠️'
    case 'MONTHLY_SUMMARY':
      return '📊'
    case 'EXPENSE_LIMIT':
      return '🚫'
    case 'CATEGORY_BUDGET':
      return '📂'
    case 'UNUSUAL_SPENDING':
      return '🔍'
    default:
      return '📢'
  }
}

export function isNotificationExpired(notification: Notification): boolean {
  if (!notification.expiresAt) return false
  return new Date(notification.expiresAt) < new Date()
}

export function formatNotificationDate(date: string | Date): string {
  const notificationDate = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - notificationDate.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return 'Agora mesmo'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min atrás`
  } else if (diffHours < 24) {
    return `${diffHours}h atrás`
  } else if (diffDays < 7) {
    return `${diffDays}d atrás`
  } else {
    return notificationDate.toLocaleDateString('pt-BR')
  }
}
