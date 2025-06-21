'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { spaceService } from '@/services'
import { 
  type CreateSpaceInput,
  type UpdateSpaceInput,
  type SpaceFilters,
  type SpaceWithRelations,
  type PaginatedSpaces,
} from '@/types/space'

// Query keys para espaços
export const spaceQueryKeys = {
  all: ['spaces'] as const,
  lists: () => [...spaceQueryKeys.all, 'list'] as const,
  list: (filters?: SpaceFilters) => [...spaceQueryKeys.lists(), { filters }] as const,
  details: () => [...spaceQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...spaceQueryKeys.details(), id] as const,
}

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
    queryKey: spaceQueryKeys.list(params?.filters),
    queryFn: () => spaceService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para buscar um espaço específico por ID
 */
export function useSpace(id: string) {
  return useQuery({
    queryKey: spaceQueryKeys.detail(id),
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
    queryKey: [...spaceQueryKeys.all, 'search', query],
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
    onSuccess: (newSpace) => {
      // Invalidar listas de espaços
      queryClient.invalidateQueries({ queryKey: spaceQueryKeys.lists() })
      
      // Adicionar o novo espaço ao cache
      queryClient.setQueryData(spaceQueryKeys.detail(newSpace.id), newSpace)
    },
  })
}

/**
 * Hook para atualizar um espaço existente
 */
export function useUpdateSpace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSpaceInput }) =>
      spaceService.update(id, data),
    onSuccess: (updatedSpace) => {
      // Atualizar o espaço específico no cache
      queryClient.setQueryData(spaceQueryKeys.detail(updatedSpace.id), updatedSpace)
      
      // Invalidar listas de espaços
      queryClient.invalidateQueries({ queryKey: spaceQueryKeys.lists() })
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
      queryClient.removeQueries({ queryKey: spaceQueryKeys.detail(deletedId) })
      
      // Invalidar listas de espaços
      queryClient.invalidateQueries({ queryKey: spaceQueryKeys.lists() })
    },
  })
}

/**
 * Hook para invalidar todas as queries de espaços
 */
export function useInvalidateSpaces() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: spaceQueryKeys.all })
  }
} 