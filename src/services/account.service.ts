import { routes } from '@/lib/routes'
import {
  type CreateAccountInput,
  type UpdateAccountInput,
  type AccountFilters,
  type AccountWithRelations,
  type PaginatedAccounts,
  type AccountTypeEnum,
} from '@/types/account'

/**
 * Serviço para gerenciamento de contas
 * 
 * Encapsula todas as operações CRUD de contas com a API
 */
class AccountService {
  /**
   * Buscar todas as contas com filtros e paginação
   */
  async getAll(params?: {
    page?: number
    limit?: number
    filters?: AccountFilters
  }): Promise<PaginatedAccounts> {
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
      ? `${routes.api.accounts.list}?${searchParams.toString()}`
      : routes.api.accounts.list

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao buscar contas')
    }

    return response.json()
  }

  /**
   * Buscar conta por ID
   */
  async getById(id: string): Promise<AccountWithRelations> {
    const response = await fetch(routes.api.accounts.byId(id))

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao buscar conta')
    }

    return response.json()
  }

  /**
   * Criar nova conta
   */
  async create(data: CreateAccountInput): Promise<AccountWithRelations> {
    const response = await fetch(routes.api.accounts.create, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao criar conta')
    }

    return response.json()
  }

  /**
   * Atualizar conta existente
   */
  async update(id: string, data: UpdateAccountInput): Promise<AccountWithRelations> {
    const response = await fetch(routes.api.accounts.update(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao atualizar conta')
    }

    return response.json()
  }

  /**
   * Excluir conta
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(routes.api.accounts.delete(id), {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || 'Erro ao excluir conta')
    }
  }

  /**
   * Buscar contas por tipo
   */
  async getByType(type: AccountTypeEnum): Promise<AccountWithRelations[]> {
    const result = await this.getAll({
      filters: { type },
      limit: 100, // Limite alto para pegar todas
    })
    return result.accounts
  }

  /**
   * Buscar contas com pesquisa por nome
   */
  async search(query: string, type?: AccountTypeEnum): Promise<AccountWithRelations[]> {
    const filters: AccountFilters = { search: query }
    if (type) {
      filters.type = type
    }

    const result = await this.getAll({
      filters,
      limit: 50, // Limite para pesquisa
    })
    return result.accounts
  }
}

// Exportar instância singleton
const accountService = new AccountService()
export default accountService 