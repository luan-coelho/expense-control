'use client'

import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, Edit, Trash2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useRecurringTransactionInstances } from '@/hooks/use-recurring-transactions'
import { useActiveSpaceId } from '@/components/providers/space-provider'
import { formatCurrency } from '@/hooks/use-dashboard-stats'

interface UpcomingTransactionsProps {
  limit?: number
  showHeader?: boolean
}

export function UpcomingTransactions({ limit = 10, showHeader = true }: UpcomingTransactionsProps) {
  const [days, setDays] = useState(30) // Próximos 30 dias por padrão
  const activeSpaceId = useActiveSpaceId()

  const { data, isLoading, error, refetch } = useRecurringTransactionInstances(days)

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas Transações
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas Transações
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Erro ao carregar transações futuras</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const instances = data?.instances || []
  const filteredInstances = activeSpaceId
    ? instances.filter(instance => instance.space.id === activeSpaceId)
    : instances

  const displayInstances = limit ? filteredInstances.slice(0, limit) : filteredInstances

  if (displayInstances.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas Transações
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <EmptyState
            icon={<Calendar />}
            title="Nenhuma transação agendada"
            description="Não há transações recorrentes programadas para os próximos dias."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas Transações
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="text-sm border rounded px-2 py-1">
              <option value={7}>7 dias</option>
              <option value={15}>15 dias</option>
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-3">
        {displayInstances.map(instance => (
          <UpcomingTransactionItem key={instance.id} instance={instance} />
        ))}

        {filteredInstances.length > limit && (
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Mostrando {limit} de {filteredInstances.length} transações
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface UpcomingTransactionItemProps {
  instance: {
    id: string
    scheduledDate: string | Date
    amount: number
    description: string
    type: 'INCOME' | 'EXPENSE'
    category: { name: string; icon: string }
    space: { name: string }
    account: { name: string }
  }
}

function UpcomingTransactionItem({ instance }: UpcomingTransactionItemProps) {
  const scheduledDate = new Date(instance.scheduledDate)
  const isIncome = instance.type === 'INCOME'

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          <div className="h-4 w-4 flex items-center justify-center text-xs font-bold">{instance.category.icon}</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{instance.description}</span>
            <Badge variant="secondary" className="text-xs">
              {instance.category.name}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{format(scheduledDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
            <span>•</span>
            <span>
              {formatDistanceToNow(scheduledDate, {
                locale: ptBR,
                addSuffix: true,
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{instance.space.name}</span>
            <span>•</span>
            <span>{instance.account.name}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
            {isIncome ? '+' : '-'}
            {formatCurrency(instance.amount)}
          </div>
          <div className="text-xs text-muted-foreground">Recorrente</div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Editar transação">
            <Edit className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title="Cancelar transação">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
