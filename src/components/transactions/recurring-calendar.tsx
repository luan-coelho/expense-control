'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecurringTransactionInstances } from '@/hooks/use-recurring-transactions'
import { formatCurrency } from '@/hooks/use-dashboard-stats'

interface RecurringCalendarProps {
  spaceId?: string
}

export function RecurringCalendar({ spaceId }: RecurringCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Buscar transações para o mês atual (30 dias à frente do início do mês)
  const { data, isLoading } = useRecurringTransactionInstances(60)
  
  const instances = data?.instances || []
  const filteredInstances = spaceId 
    ? instances.filter(instance => instance.space.id === spaceId)
    : instances

  // Agrupar transações por data
  const transactionsByDate = filteredInstances.reduce((acc, instance) => {
    const dateKey = format(new Date(instance.scheduledDate), 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(instance)
    return acc
  }, {} as Record<string, Array<typeof filteredInstances[0]>>)

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendário de Recorrências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendário de Recorrências
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayTransactions = transactionsByDate[dateKey] || []
            const isCurrentDay = isToday(day)
            
            return (
              <CalendarDay
                key={dateKey}
                date={day}
                transactions={dayTransactions}
                isToday={isCurrentDay}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 rounded" />
            <span>Receitas</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 rounded" />
            <span>Despesas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CalendarDayProps {
  date: Date
  transactions: Array<{
    type: 'INCOME' | 'EXPENSE'
    amount: number
  }>
  isToday: boolean
}

function CalendarDay({ date, transactions, isToday }: CalendarDayProps) {
  const dayNumber = format(date, 'd')
  const hasTransactions = transactions.length > 0
  
  // Calcular totais
  const income = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className={`
      min-h-12 p-1 border rounded-lg text-xs
      ${isToday ? 'bg-primary/10 border-primary' : 'border-border'}
      ${hasTransactions ? 'hover:bg-muted/50 cursor-pointer' : ''}
    `}>
      <div className={`
        font-medium mb-1
        ${isToday ? 'text-primary' : 'text-foreground'}
      `}>
        {dayNumber}
      </div>
      
      {hasTransactions && (
        <div className="space-y-1">
          {income > 0 && (
            <div className="bg-green-100 text-green-700 px-1 py-0.5 rounded text-xs">
              +{formatCurrency(income)}
            </div>
          )}
          {expense > 0 && (
            <div className="bg-red-100 text-red-700 px-1 py-0.5 rounded text-xs">
              -{formatCurrency(expense)}
            </div>
          )}
          
          {transactions.length > 2 && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              +{transactions.length - 2}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
} 