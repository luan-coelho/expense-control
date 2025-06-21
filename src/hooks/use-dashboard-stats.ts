import { useMemo } from 'react'
import { useTransactions } from './use-transactions'
import { TransactionType } from '@/types/transaction'

export interface DashboardStats {
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  totalTransactions: number
  isLoading: boolean
  error: Error | null
}

/**
 * Hook para calcular estatísticas do dashboard
 */
export function useDashboardStats() {
  // Buscar todas as transações sem paginação para calcular estatísticas
  const { data, isLoading, error } = useTransactions({
    limit: 1000, // Limite alto para pegar todas as transações
  })

  const stats: DashboardStats = useMemo(() => {
    if (!data?.transactions) {
      return {
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        totalTransactions: 0,
        isLoading,
        error,
      }
    }

    const transactions = data.transactions

    // Calcular receitas
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    // Calcular despesas
    const totalExpenses = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    // Calcular saldo total (receitas - despesas)
    const totalBalance = totalIncome - totalExpenses

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      totalTransactions: transactions.length,
      isLoading,
      error,
    }
  }, [data, isLoading, error])

  return stats
}

/**
 * Utilitário para formatar valores monetários
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
} 