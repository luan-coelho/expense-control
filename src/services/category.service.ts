import { routes } from '@/lib/routes'
import {
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type CategoryFilters,
  type CategoryWithRelations,
  type PaginatedCategories,
} from '@/types/category'

/**
 * Serviço para gerenciamento de categorias
 * 
 * Encapsula todas as operações CRUD de categorias com a API
 */
class CategoryService {
  /**
   * Buscar todas as categorias com filtros e paginação
   */
  async getAll(params?: {
    page?: number
    limit?: number
    filters?: CategoryFilters
  }): Promise<PaginatedCategories> {
    const searchParams = new URLSearchParams()

    if (params?.page) {
      searchParams.set('page', params.page.toString())
    }
    if (params?.limit) {
      searchParams.set('limit', params.limit.toString())
    }
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, value.toString())
        }
      })
    }

    const url = params && (params.page || params.limit || params.filters) 
      ? `${routes.api.categories.list}?${searchParams.toString()}`
      : routes.api.categories.list

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao buscar categorias')
    }

    return response.json()
  }

  /**
   * Buscar categoria por ID
   */
  async getById(id: string): Promise<CategoryWithRelations> {
    const response = await fetch(routes.api.categories.byId(id))

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao buscar categoria')
    }

    return response.json()
  }

  /**
   * Criar nova categoria
   */
  async create(data: CreateCategoryInput): Promise<CategoryWithRelations> {
    const response = await fetch(routes.api.categories.create, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao criar categoria')
    }

    return response.json()
  }

  /**
   * Atualizar categoria existente
   */
  async update(id: string, data: UpdateCategoryInput): Promise<CategoryWithRelations> {
    const response = await fetch(routes.api.categories.update(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao atualizar categoria')
    }

    return response.json()
  }

  /**
   * Excluir categoria
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(routes.api.categories.delete(id), {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao excluir categoria')
    }
  }

  /**
   * Buscar categorias por tipo (INCOME ou EXPENSE)
   */
  async getByType(type: 'INCOME' | 'EXPENSE'): Promise<CategoryWithRelations[]> {
    const result = await this.getAll({
      filters: { type },
      limit: 100, // Limite alto para pegar todas
    })
    return result.categories
  }

  /**
   * Buscar apenas categorias raiz (sem pai)
   */
  async getRootCategories(type?: 'INCOME' | 'EXPENSE'): Promise<CategoryWithRelations[]> {
    const filters: CategoryFilters = { parentId: null }
    if (type) {
      filters.type = type
    }

    const result = await this.getAll({
      filters,
      limit: 100, // Limite alto para pegar todas
    })
    return result.categories
  }

  /**
   * Buscar subcategorias de uma categoria pai
   */
  async getChildren(parentId: string): Promise<CategoryWithRelations[]> {
    const result = await this.getAll({
      filters: { parentId },
      limit: 100, // Limite alto para pegar todas
    })
    return result.categories
  }

  /**
   * Buscar apenas categorias predefinidas do sistema
   */
  async getDefaultCategories(type?: 'INCOME' | 'EXPENSE'): Promise<CategoryWithRelations[]> {
    const filters: CategoryFilters = { isDefault: true }
    if (type) {
      filters.type = type
    }

    const result = await this.getAll({
      filters,
      limit: 100, // Limite alto para pegar todas
    })
    return result.categories
  }

  /**
   * Buscar categorias com pesquisa por nome
   */
  async search(query: string, type?: 'INCOME' | 'EXPENSE'): Promise<CategoryWithRelations[]> {
    const filters: CategoryFilters = { search: query }
    if (type) {
      filters.type = type
    }

    const result = await this.getAll({
      filters,
      limit: 50, // Limite para pesquisa
    })
    return result.categories
  }
}

// Exportar instância singleton
const categoryService = new CategoryService()
export default categoryService 