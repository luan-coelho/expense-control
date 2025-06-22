'use client'

import { queryKeys } from '@/lib/routes'
import { spaceService } from '@/services'
import {
  type CreateSpaceInput,
  type SpaceFilters,
  type UpdateSpaceInput
} from '@/types/space'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Parâmetros para busca de espaços
export interface UseSpacesParams {
  page?: number
  limit?: number
  filters?: SpaceFilters
}

/**
 * Hook para buscar espaços com paginação e filtros
 */
export function useSpaces(params?: UseSpacesParams) {
  return useQuery({
    queryKey: queryKeys.spaces.list(params?.filters),
    queryFn: () => spaceService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para buscar um espaço específico por ID
 */
export function useSpace(id: string) {
  return useQuery({
    queryKey: queryKeys.spaces.detail(id),
    queryFn: () => spaceService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para pesquisar espaços por nome
 */
export function useSearchSpaces(query: string) {
  return useQuery({
    queryKey: [...queryKeys.spaces.all, 'search', query],
    queryFn: () => spaceService.search(query),
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

/**
 * Hook para criar um novo espaço
 */
export function useCreateSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSpaceInput) => spaceService.create(data),
    onSuccess: newSpace => {
      // Invalidar listas de espaços
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.lists() })

      // Adicionar o novo espaço ao cache
      queryClient.setQueryData(queryKeys.spaces.detail(newSpace.id), newSpace)
    },
  })
}

/**
 * Hook para atualizar um espaço existente
 */
export function useUpdateSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSpaceInput }) => spaceService.update(id, data),
    onSuccess: updatedSpace => {
      // Atualizar o espaço específico no cache
      queryClient.setQueryData(queryKeys.spaces.detail(updatedSpace.id), updatedSpace)

      // Invalidar listas de espaços
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.lists() })
    },
  })
}

/**
 * Hook para excluir um espaço
 */
export function useDeleteSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => spaceService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remover o espaço do cache
      queryClient.removeQueries({ queryKey: queryKeys.spaces.detail(deletedId) })

      // Invalidar listas de espaços
      queryClient.invalidateQueries({ queryKey: queryKeys.spaces.lists() })
    },
  })
}

/**
 * Hook para invalidar todas as queries de espaços
 */
export function useInvalidateSpaces() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.spaces.all })
  }
}
