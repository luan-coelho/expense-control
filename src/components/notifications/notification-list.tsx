'use client'

import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Bell,
  AlertTriangle,
  Info,
  DollarSign,
  Calendar,
  TrendingUp,
  Target,
  CheckCircle,
  Circle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { NotificationFilters } from '@/components/notifications/notification-filters'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAsUnread,
  useDeleteNotification,
  useMarkAllAsRead,
  useNotificationFilters,
  useNotificationSync,
} from '@/hooks/use-notifications'
import {
  type Notification,
  type NotificationTypeEnum,
  type NotificationPriorityEnum,
  type NotificationFilters as NotificationFiltersType,
  NotificationTypeLabels,
  NotificationPriorityLabels,
} from '@/types/notification'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface NotificationListProps {
  mode?: 'dropdown' | 'page'
  className?: string
}

// Ícones para cada tipo de notificação
const typeIcons = {
  BUDGET_ALERT: AlertTriangle,
  LOW_BALANCE: DollarSign,
  MONTHLY_SUMMARY: Calendar,
  UNUSUAL_SPENDING: TrendingUp,
  RECURRING_REMINDER: Bell,
  FINANCIAL_GOAL: Target,
  SYSTEM: Info,
  EXPENSE_LIMIT: AlertTriangle,
  CATEGORY_BUDGET: Target,
} as const

// Cores para cada prioridade
const priorityColors = {
  LOW: 'text-blue-600 dark:text-blue-400',
  MEDIUM: 'text-yellow-600 dark:text-yellow-400',
  HIGH: 'text-orange-600 dark:text-orange-400',
  URGENT: 'text-red-600 dark:text-red-400',
} as const

function NotificationItem({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onMarkAsUnread: (id: string) => void
  onDelete: (id: string) => void
}) {
  const IconComponent = typeIcons[notification.type as NotificationTypeEnum] || Bell
  const priorityColor = priorityColors[notification.priority as NotificationPriorityEnum]
  const isUnread = notification.status === 'UNREAD'

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        isUnread ? 'bg-muted/50 border-primary/20' : 'bg-background border-border hover:bg-muted/30',
      )}>
      {/* Ícone e status */}
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <IconComponent className={cn('h-4 w-4', priorityColor)} />
        {isUnread && <div className="h-2 w-2 rounded-full bg-primary" />}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn('text-sm leading-5', isUnread ? 'font-semibold' : 'font-medium')}>{notification.title}</h4>
          <div className="flex items-center gap-1 shrink-0">
            <Badge variant="secondary" className={cn('text-xs px-1.5 py-0.5', priorityColor)}>
              {NotificationPriorityLabels[notification.priority as NotificationPriorityEnum]}
            </Badge>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-5">{notification.message}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>

          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {NotificationTypeLabels[notification.type as NotificationTypeEnum]}
            </Badge>
          </div>
        </div>
      </div>

      {/* Ações */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isUnread ? (
            <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar como lida
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onMarkAsUnread(notification.id)}>
              <Circle className="h-4 w-4 mr-2" />
              Marcar como não lida
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onDelete(notification.id)} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  // Se a notificação tem URL, envolver em Link
  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export function NotificationList({ mode = 'page', className }: NotificationListProps) {
  const { filters, updateFilters } = useNotificationFilters()
  const [currentPage, setCurrentPage] = useState(1)

  // Configurações baseadas no modo
  const limit = mode === 'dropdown' ? 5 : 20
  const showFilters = mode === 'page'
  const showPagination = mode === 'page'

  // Hooks
  const { data, isLoading, error } = useNotifications({
    ...filters,
    page: currentPage,
    limit,
  })
  const markAsReadMutation = useMarkAsRead()
  const markAsUnreadMutation = useMarkAsUnread()
  const deleteMutation = useDeleteNotification()
  const markAllAsReadMutation = useMarkAllAsRead()

  // Sincronização em tempo real
  useNotificationSync()

  // Handlers
  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id)
  }

  const handleMarkAsUnread = (id: string) => {
    markAsUnreadMutation.mutate(id)
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  const handleFiltersChange = (newFilters: NotificationFiltersType) => {
    updateFilters(newFilters)
    setCurrentPage(1) // Reset para primeira página
  }

  // Estados de loading
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <Skeleton className="h-4 w-4 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Estados de erro
  if (error) {
    return (
      <div className={className}>
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12" />}
          title="Erro ao carregar notificações"
          description="Ocorreu um erro ao buscar as notificações. Tente novamente."
        />
      </div>
    )
  }

  const notifications = data?.data || []
  const hasUnread = notifications.some(n => n.status === 'UNREAD')
  const totalPages = data?.meta ? Math.ceil(data.meta.total / limit) : 1

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filtros (apenas no modo página) */}
      {showFilters && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Notificações</h2>
            {hasUnread && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </div>

          <NotificationFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </div>
      )}

      {/* Lista de notificações */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title="Nenhuma notificação encontrada"
          description={
            Object.keys(filters).length > 0
              ? 'Nenhuma notificação corresponde aos filtros aplicados.'
              : 'Você não tem notificações no momento.'
          }
        />
      ) : (
        <div className="space-y-2">
          {mode === 'dropdown' ? (
            <ScrollArea className="h-80">
              <div className="space-y-2 p-1">
                {notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAsUnread={handleMarkAsUnread}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="space-y-2">
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAsUnread={handleMarkAsUnread}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Paginação (apenas no modo página) */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages} • {data?.meta?.total || 0} notificação(ões)
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}>
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Ação para ver todas (apenas no modo dropdown) */}
      {mode === 'dropdown' && notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href="/notifications">Ver todas as notificações</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
