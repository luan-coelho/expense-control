import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TransactionItemProps {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: string
  date: string
  className?: string
}

export function TransactionItem({ description, amount, type, category, date, className }: TransactionItemProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className={cn('flex items-center justify-between p-4 border-b last:border-b-0', className)}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            type === 'INCOME' ? 'bg-green-100' : 'bg-red-100',
          )}>
          {type === 'INCOME' ? (
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          )}
        </div>
        <div>
          <p className="font-medium text-foreground">{description}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {category}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={cn('font-semibold', type === 'INCOME' ? 'text-green-600' : 'text-red-600')}>
          {type === 'INCOME' ? '+' : '-'}
          {formatCurrency(Math.abs(amount))}
        </p>
      </div>
    </div>
  )
}
