'use client'

import { queryKeys } from '@/lib/routes'
import { accountService } from '@/services'
import {
  type AccountFilters,
  type AccountTypeEnum,
  type CreateAccountInput,
  type UpdateAccountInput
} from '@/types/account'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Parâmetros para busca de contas
export interface UseAccountsParams {
  page?: number
  limit?: number
  filters?: AccountFilters
}

/**
 * Hook para buscar contas com paginação e filtros
 * As contas são globais para o usuário, não específicas por espaço
 */
export function useAccounts(params?: UseAccountsParams) {
  return useQuery({
    queryKey: queryKeys.accounts.list(params?.filters),
    queryFn: () => accountService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para buscar uma conta específica por ID
 */
export function useAccount(id: string) {
  return useQuery({
    queryKey: queryKeys.accounts.detail(id),
    queryFn: () => accountService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para buscar contas por tipo
 */
export function useAccountsByType(type: AccountTypeEnum) {
  return useQuery({
    queryKey: [...queryKeys.accounts.all, 'by-type', type],
    queryFn: () => accountService.getByType(type),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para pesquisar contas por nome
 */
export function useSearchAccounts(query: string, type?: AccountTypeEnum) {
  return useQuery({
    queryKey: [...queryKeys.accounts.all, 'search', query, type],
    queryFn: () => accountService.search(query, type),
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

/**
 * Hook para criar uma nova conta
 */
export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAccountInput) => accountService.create(data),
    onSuccess: newAccount => {
      // Invalidar listas de contas
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.lists() })

      // Adicionar a nova conta ao cache
      queryClient.setQueryData(queryKeys.accounts.detail(newAccount.id), newAccount)
    },
  })
}

/**
 * Hook para atualizar uma conta existente
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountInput }) => accountService.update(id, data),
    onSuccess: updatedAccount => {
      // Atualizar a conta específica no cache
      queryClient.setQueryData(queryKeys.accounts.detail(updatedAccount.id), updatedAccount)

      // Invalidar listas de contas
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.lists() })
    },
  })
}

/**
 * Hook para excluir uma conta
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => accountService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remover a conta do cache
      queryClient.removeQueries({ queryKey: queryKeys.accounts.detail(deletedId) })

      // Invalidar listas de contas
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.lists() })
    },
  })
}

/**
 * Hook para invalidar todas as queries de contas
 */
export function useInvalidateAccounts() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
  }
}
