'use client'

import { cn } from '@/lib/utils'
import {
  getNotificationPriorityColor,
  getNotificationTypeIcon,
  type NotificationWithRelations,
} from '@/types/notification'
import { toast } from 'sonner'

interface ToastNotificationProps {
  notification: NotificationWithRelations
  onAction?: () => void
}

export function ToastNotification({ notification, onAction }: ToastNotificationProps) {
  const icon = getNotificationTypeIcon(notification.type)
  const priorityColor = getNotificationPriorityColor(notification.priority)

  return (
    <div className={cn('flex items-start space-x-3 p-1', priorityColor)}>
      <div className="text-lg">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{notification.title}</div>
        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</div>
        {notification.isActionable && notification.actionUrl && (
          <button onClick={onAction} className="text-xs text-primary hover:underline mt-2">
            Ver detalhes
          </button>
        )}
      </div>
    </div>
  )
}

// Hook para exibir notificações como toast
export function useToastNotifications() {
  const showNotification = (notification: NotificationWithRelations) => {
    const handleAction = () => {
      if (notification.actionUrl) {
        window.open(notification.actionUrl, '_blank')
      }
    }

    toast.custom(t => <ToastNotification notification={notification} onAction={handleAction} />, {
      duration: notification.priority === 'URGENT' ? 10000 : 5000,
      position: 'top-right',
    })
  }

  const showSuccess = (message: string) => {
    toast.success(message)
  }

  const showError = (message: string) => {
    toast.error(message)
  }

  const showInfo = (message: string) => {
    toast.info(message)
  }

  return {
    showNotification,
    showSuccess,
    showError,
    showInfo,
  }
}

// Componente para simular notificações (para testes)
export function NotificationSimulator() {
  const { showNotification } = useToastNotifications()

  const simulateNotifications = () => {
    // Simular diferentes tipos de notificação
    const mockNotifications: NotificationWithRelations[] = [
      {
        id: 'mock-1',
        userId: 'user-1',
        type: 'BUDGET_ALERT',
        priority: 'HIGH',
        title: 'Orçamento próximo do limite',
        message: 'Você gastou 85% do seu orçamento mensal. Considere revisar seus gastos.',
        data: { currentAmount: 1700, budgetLimit: 2000, percentage: 85 },
        status: 'UNREAD',
        isActionable: true,
        actionUrl: '/analytics',
        createdAt: new Date(),
        updatedAt: new Date(),
        readAt: null,
        expiresAt: null,
        archivedAt: null,
      },
      {
        id: 'mock-2',
        userId: 'user-1',
        type: 'LOW_BALANCE',
        priority: 'URGENT',
        title: 'Saldo baixo na conta',
        message: 'Sua conta corrente está com saldo de apenas R$ 45,30.',
        data: { accountName: 'Conta Corrente', currentBalance: 45.3, threshold: 100 },
        status: 'UNREAD',
        isActionable: true,
        actionUrl: '/accounts',
        createdAt: new Date(),
        updatedAt: new Date(),
        readAt: null,
        expiresAt: null,
        archivedAt: null,
      },
      {
        id: 'mock-3',
        userId: 'user-1',
        type: 'MONTHLY_SUMMARY',
        priority: 'MEDIUM',
        title: 'Resumo mensal disponível',
        message: 'Seu resumo financeiro de dezembro está pronto para visualização.',
        data: {
          month: 'dezembro',
          totalIncome: 5000,
          totalExpenses: 3200,
          balance: 1800,
        },
        status: 'UNREAD',
        isActionable: true,
        actionUrl: '/analytics',
        createdAt: new Date(),
        updatedAt: new Date(),
        readAt: null,
        expiresAt: null,
        archivedAt: null,
      },
    ]

    // Exibir notificações com intervalo
    mockNotifications.forEach((notification, index) => {
      setTimeout(() => {
        showNotification(notification)
      }, index * 2000)
    })
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-medium mb-2">Simulador de Notificações</h3>
      <p className="text-sm text-muted-foreground mb-4">Use este botão para testar as notificações toast.</p>
      <button
        onClick={simulateNotifications}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
        Simular Notificações
      </button>
    </div>
  )
}
