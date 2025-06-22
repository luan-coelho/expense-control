import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/routes'
import notificationService from '@/services/notification.service'
import type {
  NotificationFilters,
  NotificationSettings,
  CreateNotificationInput,
  UpdateNotificationInput,
} from '@/types/notification'
import { toast } from 'sonner'
import { useEffect, useCallback, useState } from 'react'

// Hook para listar notificações
export function useNotifications(filters?: NotificationFilters & { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: () => notificationService.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 30000, // Refetch a cada 30 segundos para sincronização
    refetchOnWindowFocus: true,
  })
}

// Hook para buscar notificação por ID
export function useNotification(id: string) {
  return useQuery({
    queryKey: queryKeys.notifications.detail(id),
    queryFn: () => notificationService.getById(id),
    enabled: !!id,
    refetchOnWindowFocus: true,
  })
}

// Hook para contagem de não lidas com sincronização em tempo real
export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 1000 * 30, // 30 segundos
    refetchInterval: 1000 * 60, // Refetch a cada minuto
    refetchOnWindowFocus: true,
  })
}

// Hook para configurações
export function useNotificationSettings() {
  return useQuery({
    queryKey: queryKeys.notifications.settings(),
    queryFn: () => notificationService.getSettings(),
  })
}

// Hook para criar notificação
export function useCreateNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateNotificationInput) => notificationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      toast.success('Notificação criada com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar notificação')
    },
  })
}

// Hook para atualizar notificação
export function useUpdateNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNotificationInput }) => notificationService.update(id, data),
    onSuccess: updatedNotification => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      queryClient.setQueryData(queryKeys.notifications.detail(updatedNotification.id), updatedNotification)
      toast.success('Notificação atualizada com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar notificação')
    },
  })
}

// Hook para excluir notificação
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      toast.success('Notificação excluída com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir notificação')
    },
  })
}

// Hook para marcar como lida
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao marcar como lida')
    },
  })
}

// Hook para marcar como não lida
export function useMarkAsUnread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao marcar como não lida')
    },
  })
}

// Hook para marcar todas como lidas
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      toast.success(`${result.count} notificação(ões) marcada(s) como lida(s)`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao marcar todas como lidas')
    },
  })
}

// Hook para atualizar configurações
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) => notificationService.updateSettings(settings),
    onSuccess: updatedSettings => {
      queryClient.setQueryData(queryKeys.notifications.settings(), updatedSettings)
      toast.success('Configurações atualizadas com sucesso')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar configurações')
    },
  })
}

// Hook para sincronização em tempo real
export function useNotificationSync() {
  const queryClient = useQueryClient()

  const syncNotifications = useCallback(() => {
    // Invalidar queries críticas para forçar refetch
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() })
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
  }, [queryClient])

  useEffect(() => {
    // Configurar intervalo para sincronização automática
    const interval = setInterval(syncNotifications, 60000) // A cada 1 minuto

    // Listener para quando a aba volta ao foco
    const handleFocus = () => {
      syncNotifications()
    }

    // Listener para mudanças de visibilidade da página
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncNotifications()
      }
    }

    // Adicionar event listeners
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [syncNotifications])

  return { syncNotifications }
}

// Hook para busca em tempo real com debounce
export function useNotificationSearch(searchTerm: string, delay: number = 300) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [searchTerm, delay])

  return useNotifications({ search: debouncedSearchTerm })
}

// Hook para filtros persistentes (localStorage)
export function useNotificationFilters() {
  const [filters, setFilters] = useState<NotificationFilters>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notification-filters')
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  const updateFilters = useCallback((newFilters: NotificationFilters) => {
    setFilters(newFilters)
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-filters', JSON.stringify(newFilters))
    }
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    if (typeof window !== 'undefined') {
      localStorage.removeItem('notification-filters')
    }
  }, [])

  return { filters, updateFilters, clearFilters }
}
