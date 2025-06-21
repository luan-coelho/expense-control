import { z } from 'zod'
import { Transaction, NewTransaction } from '@/db/schema'

// Enum para tipos de transação
export const TransactionType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const

export type TransactionTypeEnum = typeof TransactionType[keyof typeof TransactionType]

// Schema de validação para criação de transação
export const createTransactionSchema = z.object({
  amount: z
    .string()
    .min(1, 'O valor é obrigatório')
    .refine(
      (val) => {
        const num = parseFloat(val.replace(',', '.'))
        return !isNaN(num) && num > 0
      },
      'O valor deve ser um número positivo'
    ),
  date: z.string().min(1, 'A data é obrigatória'),
  description: z
    .string()
    .min(1, 'A descrição é obrigatória')
    .max(255, 'A descrição deve ter no máximo 255 caracteres'),
  categoryId: z.string().uuid('Categoria inválida'),
  spaceId: z.string().uuid('Espaço inválido'),
  accountId: z.string().uuid('Conta inválida'),
  type: z.enum(['INCOME', 'EXPENSE'], {
    required_error: 'O tipo da transação é obrigatório',
  }),
  isRecurrent: z.boolean().default(false),
  recurrencePattern: z.string().optional().refine(
    (val) => {
      if (!val) return true // Não é obrigatório se não for recorrente
      try {
        const parsed = JSON.parse(val)
        return z.object({
          pattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
          interval: z.number().min(1).max(365).default(1),
          endDate: z.string().optional(),
          maxOccurrences: z.number().min(1).max(1000).optional(),
        }).safeParse(parsed).success
      } catch {
        return false
      }
    },
    'Padrão de recorrência inválido'
  ),
})

// Schema para atualização de transação
export const updateTransactionSchema = createTransactionSchema.partial()

// Schema para filtros de transação
export const transactionFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  spaceId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  search: z.string().optional(),
})

// Tipos derivados dos schemas
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>

// Tipo para transação com relacionamentos
export type TransactionWithRelations = Transaction & {
  category: {
    id: string
    name: string
    icon?: string | null
  }
  space: {
    id: string
    name: string
  }
  account: {
    id: string
    name: string
    type: string
  }
}

// Tipo para resposta paginada
export type PaginatedTransactions = {
  transactions: TransactionWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Utilitário para converter valor string para decimal
export function parseTransactionAmount(amount: string): string {
  return parseFloat(amount.replace(',', '.')).toFixed(2)
}

// Utilitário para formatar valor para exibição
export function formatTransactionAmount(amount: string): string {
  return parseFloat(amount).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

// Enum para padrões de recorrência
export const RecurrencePattern = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const

export type RecurrencePatternEnum = typeof RecurrencePattern[keyof typeof RecurrencePattern]

// Labels para padrões de recorrência
export const RecurrencePatternLabels: Record<RecurrencePatternEnum, string> = {
  DAILY: 'Diário',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
}

// Schema para dados de recorrência
export const recurrenceDataSchema = z.object({
  pattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().min(1).max(365).default(1), // A cada X dias/semanas/meses/anos
  endDate: z.string().optional(), // Data de fim da recorrência (opcional)
  maxOccurrences: z.number().min(1).max(1000).optional(), // Máximo de ocorrências (opcional)
})

// Tipo para dados de recorrência
export type RecurrenceData = z.infer<typeof recurrenceDataSchema>



// Utilitários para trabalhar com recorrência
export function parseRecurrencePattern(pattern: string | null): RecurrenceData | null {
  if (!pattern) return null
  try {
    const parsed = JSON.parse(pattern)
    const result = recurrenceDataSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function stringifyRecurrencePattern(data: RecurrenceData): string {
  return JSON.stringify(data)
}

export function getRecurrenceDescription(pattern: string | null): string {
  const data = parseRecurrencePattern(pattern)
  if (!data) return 'Não recorrente'
  
  const patternLabel = RecurrencePatternLabels[data.pattern]
  const interval = data.interval > 1 ? `a cada ${data.interval}` : ''
  
  let description = interval ? `${patternLabel} ${interval}` : patternLabel
  
  if (data.endDate) {
    const endDate = new Date(data.endDate).toLocaleDateString('pt-BR')
    description += ` até ${endDate}`
  } else if (data.maxOccurrences) {
    description += ` por ${data.maxOccurrences} vezes`
  }
  
  return description
}

// Tipo para transação recorrente com próximas ocorrências
export type RecurringTransactionWithOccurrences = TransactionWithRelations & {
  nextOccurrences: Date[]
} 