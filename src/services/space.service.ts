import { routes } from '@/lib/routes'
import {
  type CreateSpaceInput,
  type UpdateSpaceInput,
  type SpaceFilters,
  type SpaceWithRelations,
  type PaginatedSpaces,
} from '@/types/space'

/**
 * Serviço para gerenciamento de espaços
 * 
 * Encapsula todas as operações CRUD de espaços com a API
 */
class SpaceService {
  /**
   * Buscar todos os espaços com filtros e paginação
   */
  async getAll(params?: {
    page?: number
    limit?: number
    filters?: SpaceFilters
  }): Promise<PaginatedSpaces> {
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
      ? `${routes.api.spaces.list}?${searchParams.toString()}`
      : routes.api.spaces.list

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao buscar espaços')
    }

    return response.json()
  }

  /**
   * Buscar espaço por ID
   */
  async getById(id: string): Promise<SpaceWithRelations> {
    const response = await fetch(routes.api.spaces.byId(id))

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao buscar espaço')
    }

    return response.json()
  }

  /**
   * Criar novo espaço
   */
  async create(data: CreateSpaceInput): Promise<SpaceWithRelations> {
    const response = await fetch(routes.api.spaces.create, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao criar espaço')
    }

    return response.json()
  }

  /**
   * Atualizar espaço existente
   */
  async update(id: string, data: UpdateSpaceInput): Promise<SpaceWithRelations> {
    const response = await fetch(routes.api.spaces.update(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao atualizar espaço')
    }

    return response.json()
  }

  /**
   * Excluir espaço
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(routes.api.spaces.delete(id), {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao excluir espaço')
    }
  }

  /**
   * Buscar espaços com pesquisa por nome
   */
  async search(query: string): Promise<SpaceWithRelations[]> {
    const result = await this.getAll({
      filters: { search: query },
      limit: 50, // Limite para pesquisa
    })
    return result.spaces
  }
}

// Exportar instância singleton
const spaceService = new SpaceService()
export default spaceService 