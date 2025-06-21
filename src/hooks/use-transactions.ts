import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { transactionService } from '@/services/transaction.service'
import { queryKeys } from '@/lib/routes'
import {
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type TransactionWithRelations,
  type PaginatedTransactions,
  type TransactionFilters,
} from '@/types/transaction'

// Parâmetros para buscar transações
export interface UseTransactionsParams {
  page?: number
  limit?: number
  filters?: TransactionFilters
  enabled?: boolean
}

/**
 * Hook para buscar lista de transações com filtros e paginação
 */
export function useTransactions(params?: UseTransactionsParams) {
  return useQuery({
    queryKey: queryKeys.transactions.list(params?.filters),
    queryFn: () => transactionService.getAll({
      page: params?.page,
      limit: params?.limit,
      filters: params?.filters,
    }),
    enabled: params?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para buscar transação específica por ID
 */
export function useTransaction(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => transactionService.getById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para criar nova transação
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTransactionInput) => transactionService.create(data),
    onSuccess: (newTransaction) => {
      // Invalidar queries de lista para refletir a nova transação
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() })
      
      // Adicionar a nova transação ao cache
      queryClient.setQueryData(
        queryKeys.transactions.detail(newTransaction.id),
        newTransaction
      )

      toast.success('Transação criada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar transação')
    },
  })
}

/**
 * Hook para atualizar transação existente
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionInput }) =>
      transactionService.update(id, data),
    onSuccess: (updatedTransaction) => {
      // Atualizar o cache da transação específica
      queryClient.setQueryData(
        queryKeys.transactions.detail(updatedTransaction.id),
        updatedTransaction
      )

      // Invalidar queries de lista para refletir as mudanças
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() })

      toast.success('Transação atualizada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar transação')
    },
  })
}

/**
 * Hook para excluir transação
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => transactionService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remover a transação do cache
      queryClient.removeQueries({ queryKey: queryKeys.transactions.detail(deletedId) })

      // Invalidar queries de lista para refletir a remoção
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() })

      toast.success('Transação excluída com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir transação')
    },
  })
}

/**
 * Hook para invalidar cache de transações
 * Útil para forçar refetch após operações externas
 */
export function useInvalidateTransactions() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
    },
    invalidateLists: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() })
    },
    invalidateDetail: (id: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.detail(id) })
    },
  }
} 