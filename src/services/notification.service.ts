import { routes } from '@/lib/routes'
import {
  type Notification,
  type CreateNotificationInput,
  type UpdateNotificationInput,
  type NotificationFilters,
  type NotificationSettings,
  type PaginatedNotifications,
} from '@/types/notification'

class NotificationService {
  // Listar notificações com filtros e paginação
  async getAll(filters?: NotificationFilters & { page?: number; limit?: number }): Promise<PaginatedNotifications> {
    const searchParams = new URLSearchParams()

    if (filters?.page) searchParams.set('page', filters.page.toString())
    if (filters?.limit) searchParams.set('limit', filters.limit.toString())
    if (filters?.type) searchParams.set('type', filters.type)
    if (filters?.status) searchParams.set('status', filters.status)
    if (filters?.priority) searchParams.set('priority', filters.priority)
    if (filters?.isActionable !== undefined) searchParams.set('isActionable', filters.isActionable.toString())
    if (filters?.dateFrom) searchParams.set('dateFrom', filters.dateFrom)
    if (filters?.dateTo) searchParams.set('dateTo', filters.dateTo)

    const url = `${routes.api.notifications.list}?${searchParams.toString()}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Erro ao buscar notificações')
    }

    return response.json()
  }

  // Buscar notificação por ID
  async getById(id: string): Promise<Notification> {
    const response = await fetch(routes.api.notifications.byId(id))

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Notificação não encontrada')
      }
      throw new Error('Erro ao buscar notificação')
    }

    return response.json()
  }

  // Criar nova notificação
  async create(data: CreateNotificationInput): Promise<Notification> {
    const response = await fetch(routes.api.notifications.create, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Erro ao criar notificação')
    }

    return response.json()
  }

  // Atualizar notificação
  async update(id: string, data: UpdateNotificationInput): Promise<Notification> {
    const response = await fetch(routes.api.notifications.update(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Notificação não encontrada')
      }
      throw new Error('Erro ao atualizar notificação')
    }

    return response.json()
  }

  // Excluir notificação
  async delete(id: string): Promise<void> {
    const response = await fetch(routes.api.notifications.delete(id), {
      method: 'DELETE',
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Notificação não encontrada')
      }
      throw new Error('Erro ao excluir notificação')
    }
  }

  // Marcar como lida
  async markAsRead(id: string): Promise<Notification> {
    const response = await fetch(routes.api.notifications.markAsRead(id), {
      method: 'PATCH',
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Notificação não encontrada')
      }
      throw new Error('Erro ao marcar notificação como lida')
    }

    return response.json()
  }

  // Marcar como não lida
  async markAsUnread(id: string): Promise<Notification> {
    const response = await fetch(routes.api.notifications.markAsUnread(id), {
      method: 'PATCH',
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Notificação não encontrada')
      }
      throw new Error('Erro ao marcar notificação como não lida')
    }

    return response.json()
  }

  // Marcar todas como lidas
  async markAllAsRead(): Promise<{ count: number }> {
    const response = await fetch(routes.api.notifications.markAllAsRead, {
      method: 'PATCH',
    })

    if (!response.ok) {
      throw new Error('Erro ao marcar todas as notificações como lidas')
    }

    return response.json()
  }

  // Obter contagem de não lidas
  async getUnreadCount(): Promise<{ count: number }> {
    const response = await fetch(`${routes.api.notifications.list}?status=unread&limit=0`)

    if (!response.ok) {
      throw new Error('Erro ao buscar contagem de notificações não lidas')
    }

    const data = await response.json()
    return { count: data.pagination?.total || 0 }
  }

  // Obter configurações de notificação
  async getSettings(): Promise<NotificationSettings> {
    const response = await fetch(routes.api.notifications.settings)

    if (!response.ok) {
      throw new Error('Erro ao buscar configurações de notificação')
    }

    return response.json()
  }

  // Atualizar configurações de notificação
  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await fetch(routes.api.notifications.settings, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    })

    if (!response.ok) {
      throw new Error('Erro ao atualizar configurações de notificação')
    }

    return response.json()
  }
}

const notificationService = new NotificationService()
export default notificationService
