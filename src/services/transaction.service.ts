import { routes } from '@/lib/routes'
import { 
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type TransactionWithRelations,
  type PaginatedTransactions,
  type TransactionFilters
} from '@/types/transaction'

/**
 * Serviço para gerenciar operações de transações via API
 */
class TransactionService {
  /**
   * Buscar todas as transações com filtros e paginação
   */
  async getAll(params?: {
    page?: number
    limit?: number
    filters?: TransactionFilters
  }): Promise<PaginatedTransactions> {
    const searchParams = new URLSearchParams()

    if (params?.page) {
      searchParams.set('page', params.page.toString())
    }
    if (params?.limit) {
      searchParams.set('limit', params.limit.toString())
    }

    // Adicionar filtros
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, value.toString())
        }
      })
    }

    const url = `${routes.api.transactions.list}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || `Erro ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Buscar transação por ID
   */
  async getById(id: string): Promise<TransactionWithRelations> {
    const response = await fetch(routes.api.transactions.byId(id))
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || `Erro ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Criar nova transação
   */
  async create(data: CreateTransactionInput): Promise<TransactionWithRelations> {
    const response = await fetch(routes.api.transactions.create, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || `Erro ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Atualizar transação existente
   */
  async update(id: string, data: UpdateTransactionInput): Promise<TransactionWithRelations> {
    const response = await fetch(routes.api.transactions.update(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || `Erro ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Excluir transação
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(routes.api.transactions.delete(id), {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || `Erro ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }
}

// Exportar instância única do serviço
export const transactionService = new TransactionService()
export default transactionService 