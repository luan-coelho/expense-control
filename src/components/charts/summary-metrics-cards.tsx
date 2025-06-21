'use client'

import { useSummaryMetrics } from '@/hooks/use-analytics'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type AnalyticsFilters } from '@/services/analytics.service'
import { 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank, 
  ArrowUpDown, 
  Receipt, 
  Target,
  Building2,
  Tag,
  CreditCard,
  Wallet
} from 'lucide-react'

interface SummaryMetricsCardsProps {
  filters?: AnalyticsFilters
  className?: string
}

interface MetricCardProps {
  title: string
  value: string
  description?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  variant?: 'default' | 'income' | 'expense' | 'balance'
}

function MetricCard({ title, value, description, icon, trend, variant = 'default' }: MetricCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'income':
        return 'border-green-200 bg-green-50/50'
      case 'expense':
        return 'border-red-200 bg-red-50/50'
      case 'balance':
        return 'border-blue-200 bg-blue-50/50'
      default:
        return 'border-border'
    }
  }

  const getIconColor = () => {
    switch (variant) {
      case 'income':
        return 'text-green-600'
      case 'expense':
        return 'text-red-600'
      case 'balance':
        return 'text-blue-600'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Card className={`${getVariantStyles()} transition-all hover:shadow-md`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`${getIconColor()}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className="flex items-center space-x-1">
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <Badge 
                variant={trend.isPositive ? 'default' : 'destructive'}
                className="text-xs"
              >
                {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
              </Badge>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function SummaryMetricsCards({ filters, className }: SummaryMetricsCardsProps) {
  const { data, isLoading, error } = useSummaryMetrics(filters)

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <EmptyState
          icon={<AlertCircle />}
          title="Erro ao carregar métricas"
          description="Não foi possível carregar as métricas de resumo. Tente novamente."
        />
      </div>
    )
  }

  if (!data) {
    return (
      <div className={className}>
        <EmptyState
          icon={<Receipt />}
          title="Nenhum dado encontrado"
          description="Não há dados suficientes para exibir as métricas no período selecionado."
        />
      </div>
    )
  }

  const { current, comparison } = data

  // Determinar se a comparação é positiva para receitas/saldo (mais é melhor)
  // e negativa para despesas (menos é melhor)
  const getIncomeComparison = () => {
    if (!comparison) return undefined
    return {
      value: comparison.totalIncomeChange,
      isPositive: comparison.totalIncomeChange >= 0,
      label: 'vs período anterior'
    }
  }

  const getExpenseComparison = () => {
    if (!comparison) return undefined
    return {
      value: Math.abs(comparison.totalExpensesChange),
      isPositive: comparison.totalExpensesChange <= 0, // Menos despesa é positivo
      label: 'vs período anterior'
    }
  }

  const getBalanceComparison = () => {
    if (!comparison) return undefined
    return {
      value: comparison.netIncomeChange,
      isPositive: comparison.netIncomeChange >= 0,
      label: 'vs período anterior'
    }
  }

  const getTransactionComparison = () => {
    if (!comparison) return undefined
    return {
      value: Math.abs(comparison.transactionCountChange),
      isPositive: comparison.transactionCountChange >= 0,
      label: 'vs período anterior'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Métricas Principais */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Resumo Financeiro
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Receitas"
            value={current.formattedTotalIncome}
            description={`${current.incomeCount} transação(ões)`}
            icon={<TrendingUp className="h-4 w-4" />}
            trend={getIncomeComparison()}
            variant="income"
          />
          
          <MetricCard
            title="Total de Despesas"
            value={current.formattedTotalExpenses}
            description={`${current.expenseCount} transação(ões)`}
            icon={<TrendingDown className="h-4 w-4" />}
            trend={getExpenseComparison()}
            variant="expense"
          />
          
          <MetricCard
            title="Saldo Líquido"
            value={current.formattedNetIncome}
            description="Receitas - Despesas"
            icon={<PiggyBank className="h-4 w-4" />}
            trend={getBalanceComparison()}
            variant="balance"
          />
          
          <MetricCard
            title="Total de Transações"
            value={current.transactionCount.toString()}
            description="Todas as movimentações"
            icon={<Receipt className="h-4 w-4" />}
            trend={getTransactionComparison()}
          />
        </div>
      </div>

      {/* Métricas Detalhadas */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Análise Detalhada
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Receita Média"
            value={current.formattedAverageIncome}
            description="Por transação de receita"
            icon={<Wallet className="h-4 w-4" />}
            trend={comparison ? {
              value: Math.abs(comparison.averageIncomeChange),
              isPositive: comparison.averageIncomeChange >= 0,
              label: 'vs período anterior'
            } : undefined}
          />
          
          <MetricCard
            title="Despesa Média"
            value={current.formattedAverageExpense}
            description="Por transação de despesa"
            icon={<CreditCard className="h-4 w-4" />}
            trend={comparison ? {
              value: Math.abs(comparison.averageExpenseChange),
              isPositive: comparison.averageExpenseChange <= 0,
              label: 'vs período anterior'
            } : undefined}
          />
          
          <MetricCard
            title="Categorias Ativas"
            value={current.uniqueCategories.toString()}
            description="Categorias utilizadas"
            icon={<Tag className="h-4 w-4" />}
          />
          
          <MetricCard
            title="Espaços Ativos"
            value={current.uniqueSpaces.toString()}
            description="Espaços utilizados"
            icon={<Building2 className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Transações de Destaque */}
      {(current.largestExpense || current.largestIncome) && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Transações de Destaque
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {current.largestIncome && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Maior Receita
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xl font-bold text-green-800">
                      {current.largestIncome.formattedAmount}
                    </div>
                    <p className="text-sm text-green-700 font-medium">
                      {current.largestIncome.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      {current.largestIncome.categoryName && (
                        <Badge variant="outline" className="border-green-300 text-green-700">
                          {current.largestIncome.categoryName}
                        </Badge>
                      )}
                      {current.largestIncome.spaceName && (
                        <Badge variant="outline" className="border-green-300 text-green-700">
                          {current.largestIncome.spaceName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {current.largestExpense && (
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Maior Despesa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xl font-bold text-red-800">
                      {current.largestExpense.formattedAmount}
                    </div>
                    <p className="text-sm text-red-700 font-medium">
                      {current.largestExpense.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-red-600">
                      {current.largestExpense.categoryName && (
                        <Badge variant="outline" className="border-red-300 text-red-700">
                          {current.largestExpense.categoryName}
                        </Badge>
                      )}
                      {current.largestExpense.spaceName && (
                        <Badge variant="outline" className="border-red-300 text-red-700">
                          {current.largestExpense.spaceName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 