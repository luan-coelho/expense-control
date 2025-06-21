import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { categoryService } from '@/services'
import { queryKeys } from '@/lib/routes'
import {
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type CategoryWithRelations,
  type PaginatedCategories,
  type CategoryFilters,
} from '@/types/category'

// Parâmetros para buscar categorias
export interface UseCategoriesParams {
  page?: number
  limit?: number
  filters?: CategoryFilters
  enabled?: boolean
}

/**
 * Hook para buscar lista de categorias com filtros e paginação
 */
export function useCategories(params?: UseCategoriesParams) {
  return useQuery({
    queryKey: queryKeys.categories.list(params?.filters),
    queryFn: () => categoryService.getAll({
      page: params?.page,
      limit: params?.limit,
      filters: params?.filters,
    }),
    enabled: params?.enabled !== false,
    staleTime: 10 * 60 * 1000, // 10 minutos (categorias mudam menos que transações)
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para buscar categoria específica por ID
 */
export function useCategory(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoryService.getById(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para buscar categorias por tipo (INCOME ou EXPENSE)
 */
export function useCategoriesByType(type: 'INCOME' | 'EXPENSE', enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.categories.list({ type }),
    queryFn: () => categoryService.getByType(type),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para buscar apenas categorias raiz (sem pai)
 */
export function useRootCategories(type?: 'INCOME' | 'EXPENSE', enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.categories.list({ parentId: null, type }),
    queryFn: () => categoryService.getRootCategories(type),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para buscar subcategorias de uma categoria pai
 */
export function useCategoryChildren(parentId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.categories.list({ parentId }),
    queryFn: () => categoryService.getChildren(parentId),
    enabled: enabled && !!parentId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para buscar apenas categorias predefinidas do sistema
 */
export function useDefaultCategories(type?: 'INCOME' | 'EXPENSE', enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.categories.list({ isDefault: true, type }),
    queryFn: () => categoryService.getDefaultCategories(type),
    enabled,
    staleTime: 15 * 60 * 1000, // 15 minutos (categorias padrão raramente mudam)
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para pesquisar categorias por nome
 */
export function useSearchCategories(query: string, type?: 'INCOME' | 'EXPENSE', enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.categories.list({ search: query, type }),
    queryFn: () => categoryService.search(query, type),
    enabled: enabled && !!query && query.length >= 2, // Só pesquisar com 2+ caracteres
    staleTime: 5 * 60 * 1000, // 5 minutos para pesquisas
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para criar nova categoria
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCategoryInput) => categoryService.create(data),
    onSuccess: (newCategory) => {
      // Invalidar queries de lista para refletir a nova categoria
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })
      
      // Adicionar a nova categoria ao cache
      queryClient.setQueryData(
        queryKeys.categories.detail(newCategory.id),
        newCategory
      )

      toast.success('Categoria criada com sucesso!')
    },
    onError: (error: Error) => {
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao criar categoria'
      
      if (error.message.includes('Já existe uma categoria com este nome')) {
        errorMessage = 'Já existe uma categoria com este nome'
      } else if (error.message.includes('Categoria pai não encontrada')) {
        errorMessage = 'A categoria pai selecionada não foi encontrada'
      } else if (error.message.includes('validation')) {
        errorMessage = 'Dados inválidos. Verifique os campos preenchidos'
      } else if (error.message.includes('Não autorizado')) {
        errorMessage = 'Você não tem permissão para criar categorias'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    },
  })
}

/**
 * Hook para atualizar categoria existente
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryInput }) =>
      categoryService.update(id, data),
    onSuccess: (updatedCategory) => {
      // Atualizar o cache da categoria específica
      queryClient.setQueryData(
        queryKeys.categories.detail(updatedCategory.id),
        updatedCategory
      )

      // Invalidar queries de lista para refletir as mudanças
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })

      toast.success('Categoria atualizada com sucesso!')
    },
    onError: (error: Error) => {
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao atualizar categoria'
      
      if (error.message.includes('Não é possível editar categorias predefinidas do sistema')) {
        errorMessage = 'Esta categoria é predefinida do sistema e não pode ser editada'
      } else if (error.message.includes('Você não tem permissão para editar esta categoria')) {
        errorMessage = 'Você não tem permissão para editar esta categoria'
      } else if (error.message.includes('Categoria não encontrada')) {
        errorMessage = 'A categoria que você está tentando editar não foi encontrada'
      } else if (error.message.includes('Já existe uma categoria com este nome')) {
        errorMessage = 'Já existe uma categoria com este nome'
      } else if (error.message.includes('Uma categoria não pode ser pai de si mesma')) {
        errorMessage = 'Uma categoria não pode ser pai de si mesma'
      } else if (error.message.includes('Categoria pai não encontrada')) {
        errorMessage = 'A categoria pai selecionada não foi encontrada'
      } else if (error.message.includes('validation')) {
        errorMessage = 'Dados inválidos. Verifique os campos preenchidos'
      } else if (error.message.includes('Não autorizado')) {
        errorMessage = 'Você não tem permissão para editar categorias'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    },
  })
}

/**
 * Hook para excluir categoria
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remover a categoria do cache
      queryClient.removeQueries({ queryKey: queryKeys.categories.detail(deletedId) })

      // Invalidar queries de lista para refletir a remoção
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })

      toast.success('Categoria excluída com sucesso!')
    },
    onError: (error: Error) => {
      // Mensagens de erro mais específicas
      let errorMessage = 'Erro ao excluir categoria'
      
      if (error.message.includes('Não é possível excluir categorias predefinidas do sistema')) {
        errorMessage = 'Esta categoria é predefinida do sistema e não pode ser excluída'
      } else if (error.message.includes('Você não tem permissão para excluir esta categoria')) {
        errorMessage = 'Você não tem permissão para excluir esta categoria'
      } else if (error.message.includes('Categoria não encontrada')) {
        errorMessage = 'A categoria que você está tentando excluir não foi encontrada'
      } else if (error.message.includes('está sendo usada em') && error.message.includes('transação')) {
        // Extrair número de transações da mensagem
        const match = error.message.match(/(\d+) transação/)
        const count = match ? match[1] : 'algumas'
        errorMessage = `Esta categoria não pode ser excluída pois está sendo usada em ${count} transação(ões)`
      } else if (error.message.includes('possui') && error.message.includes('subcategoria')) {
        // Extrair número de subcategorias da mensagem
        const match = error.message.match(/(\d+) subcategoria/)
        const count = match ? match[1] : 'algumas'
        errorMessage = `Esta categoria não pode ser excluída pois possui ${count} subcategoria(s). Exclua primeiro as subcategorias`
      } else if (error.message.includes('Não autorizado')) {
        errorMessage = 'Você não tem permissão para excluir categorias'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    },
  })
}

/**
 * Hook para invalidar cache de categorias
 * Útil para forçar refetch após operações externas
 */
export function useInvalidateCategories() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
    invalidateLists: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })
    },
    invalidateDetail: (id: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(id) })
    },
  }
} 