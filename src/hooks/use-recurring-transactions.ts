'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { routes, queryKeys } from '@/lib/routes'
import { CreateTransactionInput } from '@/types/transaction'

// Tipos para as respostas da API
interface RecurringTransactionInstance {
  id: string
  originalTransactionId: string
  scheduledDate: Date
  amount: number
  description: string
  type: 'INCOME' | 'EXPENSE'
  category: {
    id: string
    name: string
    icon: string
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
  isGenerated: boolean
  originalTransaction: {
    id: string
    createdAt: Date
    isRecurrent: boolean
    recurrencePattern: string
  }
}

interface RecurringTransactionsResponse {
  instances: RecurringTransactionInstance[]
  total: number
  days: number
  generatedAt: string
}

interface CreateRecurringTransactionResponse {
  transaction: {
    id: string
    amount: string
    description: string
    type: 'INCOME' | 'EXPENSE'
    date: Date
    isRecurrent: boolean
    recurrencePattern: string
  }
  nextInstances: RecurringTransactionInstance[]
  message: string
}

// Chaves de query
export const recurringTransactionKeys = {
  all: ['recurring-transactions'] as const,
  instances: (days?: number) => [...recurringTransactionKeys.all, 'instances', days] as const,
}

// Hook para buscar instâncias futuras de transações recorrentes
export function useRecurringTransactionInstances(days: number = 30) {
  return useQuery({
    queryKey: recurringTransactionKeys.instances(days),
    queryFn: async (): Promise<RecurringTransactionsResponse> => {
      const url = `${routes.api.transactions.list}/recurring?days=${days}&limit=50`
      const response = await fetch(url)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao buscar transações recorrentes')
      }

      const data = await response.json()

      // Converter strings de data para objetos Date
      return {
        ...data,
        instances: data.instances.map(
          (
            instance: RecurringTransactionInstance & {
              scheduledDate: string
              originalTransaction: { createdAt: string }
            },
          ) => ({
            ...instance,
            scheduledDate: new Date(instance.scheduledDate),
            originalTransaction: {
              ...instance.originalTransaction,
              createdAt: new Date(instance.originalTransaction.createdAt),
            },
          }),
        ),
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })
}

// Hook para criar transação recorrente
export function useCreateRecurringTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTransactionInput): Promise<CreateRecurringTransactionResponse> => {
      const response = await fetch(`${routes.api.transactions.list}/recurring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar transação recorrente')
      }

      const result = await response.json()

      // Converter strings de data para objetos Date nas instâncias
      return {
        ...result,
        nextInstances: result.nextInstances.map(
          (instance: RecurringTransactionInstance & { scheduledDate: string }) => ({
            ...instance,
            scheduledDate: new Date(instance.scheduledDate),
          }),
        ),
      }
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: recurringTransactionKeys.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
    },
  })
}

// Hook para obter estatísticas de transações recorrentes
export function useRecurringTransactionsStats(days: number = 30) {
  const { data: instances, ...rest } = useRecurringTransactionInstances(days)

  const stats = {
    totalInstances: instances?.total || 0,
    totalIncome: 0,
    totalExpenses: 0,
    netAmount: 0,
    upcomingThisWeek: 0,
    upcomingThisMonth: 0,
  }

  if (instances?.instances) {
    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    for (const instance of instances.instances) {
      const amount = instance.amount

      if (instance.type === 'INCOME') {
        stats.totalIncome += amount
      } else {
        stats.totalExpenses += amount
      }

      // Contar próximas transações
      if (instance.scheduledDate <= oneWeekFromNow) {
        stats.upcomingThisWeek++
      }
      if (instance.scheduledDate <= oneMonthFromNow) {
        stats.upcomingThisMonth++
      }
    }

    stats.netAmount = stats.totalIncome - stats.totalExpenses
  }

  return {
    data: instances,
    stats,
    ...rest,
  }
}
