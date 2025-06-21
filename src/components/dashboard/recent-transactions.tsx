'use client'

import Link from 'next/link'
import { ArrowUpRight, ArrowDownLeft, Eye } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'

import { useTransactions } from '@/hooks/use-transactions'
import { TransactionType } from '@/types/transaction'
import { formatTransactionAmount } from '@/types/transaction'

interface RecentTransactionsProps {
  limit?: number
}

export function RecentTransactions({ limit = 5 }: RecentTransactionsProps) {
  const { data, isLoading, error } = useTransactions({
    limit,
    page: 1,
  })

  const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    })
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600">
            Erro ao carregar transações: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transações Recentes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/transactions" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Ver todas
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : !data?.transactions.length ? (
          <EmptyState
            icon={
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            }
            title="Nenhuma transação encontrada"
            description="Adicione sua primeira transação para começar a controlar suas finanças"
            action={{
              label: 'Adicionar Transação',
              onClick: () => window.location.href = '/transactions',
            }}
          />
        ) : (
          <div className="space-y-3">
            {data.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  {/* Ícone da transação */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === TransactionType.INCOME
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {transaction.type === TransactionType.INCOME ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4" />
                    )}
                  </div>

                  {/* Informações da transação */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatDate(transaction.date)}</span>
                      {transaction.category && (
                        <>
                          <span>•</span>
                          <span>{transaction.category.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Valor da transação */}
                <div className="text-right">
                  <Badge
                    variant={transaction.type === TransactionType.INCOME ? 'default' : 'destructive'}
                    className={`${
                      transaction.type === TransactionType.INCOME
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : 'bg-red-100 text-red-800 hover:bg-red-100'
                    }`}
                  >
                    {transaction.type === TransactionType.INCOME ? '+' : '-'}
                    {formatTransactionAmount(transaction.amount)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 