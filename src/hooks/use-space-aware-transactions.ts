import { useActiveSpaceId } from '@/components/providers/space-provider'
import { queryKeys } from '@/lib/routes'
import { transactionService } from '@/services/transaction.service'
import { type CreateTransactionInput, type TransactionFilters, type UpdateTransactionInput } from '@/types/transaction'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Parâmetros para buscar transações com espaço automático
export interface UseSpaceAwareTransactionsParams {
  page?: number
  limit?: number
  filters?: Omit<TransactionFilters, 'spaceId'> // Remove spaceId dos filtros pois será injetado automaticamente
  enabled?: boolean
}

/**
 * Hook que busca transações automaticamente filtradas pelo espaço ativo
 */
export function useSpaceAwareTransactions(params?: UseSpaceAwareTransactionsParams) {
  const activeSpaceId = useActiveSpaceId()

  return useQuery({
    queryKey: queryKeys.transactions.list({
      ...params?.filters,
      spaceId: activeSpaceId || undefined,
    }),
    queryFn: () =>
      transactionService.getAll({
        page: params?.page,
        limit: params?.limit,
        filters: {
          ...params?.filters,
          spaceId: activeSpaceId || undefined,
        },
      }),
    enabled: params?.enabled !== false && !!activeSpaceId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para criar transação que automaticamente usa o espaço ativo
 */
export function useCreateSpaceAwareTransaction() {
  const queryClient = useQueryClient()
  const activeSpaceId = useActiveSpaceId()

  return useMutation({
    mutationFn: (data: Omit<CreateTransactionInput, 'spaceId'>) => {
      if (!activeSpaceId) {
        throw new Error('Nenhum espaço ativo selecionado')
      }

      return transactionService.create({
        ...data,
        spaceId: activeSpaceId,
      })
    },
    onSuccess: newTransaction => {
      // Invalidar queries de lista para refletir a nova transação
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() })

      // Adicionar a nova transação ao cache
      queryClient.setQueryData(queryKeys.transactions.detail(newTransaction.id), newTransaction)

      toast.success('Transação criada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar transação')
    },
  })
}

/**
 * Hook para atualizar transação que automaticamente valida o espaço
 */
export function useUpdateSpaceAwareTransaction() {
  const queryClient = useQueryClient()
  const activeSpaceId = useActiveSpaceId()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionInput }) => {
      // Se o spaceId não for fornecido nos dados, usar o espaço ativo
      const updateData = {
        ...data,
        spaceId: data.spaceId || activeSpaceId || undefined,
      }

      return transactionService.update(id, updateData)
    },
    onSuccess: updatedTransaction => {
      // Atualizar o cache da transação específica
      queryClient.setQueryData(queryKeys.transactions.detail(updatedTransaction.id), updatedTransaction)

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
 * Hook para excluir transação que automaticamente invalida cache do espaço ativo
 */
export function useDeleteSpaceAwareTransaction() {
  const queryClient = useQueryClient()
  const activeSpaceId = useActiveSpaceId()

  return useMutation({
    mutationFn: (id: string) => transactionService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remover a transação do cache
      queryClient.removeQueries({ queryKey: queryKeys.transactions.detail(deletedId) })

      // Invalidar queries de lista do espaço ativo para refletir a remoção
      if (activeSpaceId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.transactions.list({ spaceId: activeSpaceId }),
        })
      }

      // Invalidar todas as queries de lista como fallback
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() })

      toast.success('Transação excluída com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir transação')
    },
  })
}

/**
 * Hook para invalidar cache de transações do espaço ativo
 */
export function useInvalidateSpaceAwareTransactions() {
  const queryClient = useQueryClient()
  const activeSpaceId = useActiveSpaceId()

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
    },
    invalidateLists: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() })
    },
    invalidateActiveSpace: () => {
      if (activeSpaceId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.transactions.list({ spaceId: activeSpaceId }),
        })
      }
    },
    invalidateDetail: (id: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.detail(id) })
    },
  }
}
