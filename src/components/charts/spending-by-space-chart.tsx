'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BaseChart } from './base-chart'
import { useSpendingBySpace } from '@/hooks/use-analytics'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { useBreakpoint } from '@/hooks/use-mobile'
import { type AnalyticsFilters } from '@/services/analytics.service'
import { AlertCircle, Building2 } from 'lucide-react'

interface SpendingBySpaceChartProps {
  filters?: AnalyticsFilters
  height?: number
  className?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: {
      spaceName: string
      formattedAmount: string
      percentage: number
      transactionCount: number
    }
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-card border rounded-lg p-3 shadow-lg max-w-xs">
        <p className="font-medium text-foreground truncate">{data.spaceName}</p>
        <p className="text-sm text-muted-foreground">
          Valor: {data.formattedAmount}
        </p>
        <p className="text-sm text-muted-foreground">
          Percentual: {data.percentage.toFixed(1)}%
        </p>
        <p className="text-sm text-muted-foreground">
          Transações: {data.transactionCount}
        </p>
      </div>
    )
  }
  return null
}

export function SpendingBySpaceChart({ filters, height = 400, className }: SpendingBySpaceChartProps) {
  const { data: response, isLoading, error } = useSpendingBySpace(filters)
  const breakpoint = useBreakpoint()

  // Configurações responsivas
  const getResponsiveConfig = () => {
    switch (breakpoint) {
      case 'mobile':
        return {
          showXAxisLabels: false,
          barSize: 40,
          margin: { top: 20, right: 10, left: 10, bottom: 20 },
        }
      case 'tablet':
        return {
          showXAxisLabels: true,
          barSize: 50,
          margin: { top: 20, right: 20, left: 20, bottom: 60 },
        }
      default:
        return {
          showXAxisLabels: true,
          barSize: 60,
          margin: { top: 20, right: 30, left: 20, bottom: 60 },
        }
    }
  }

  const config = getResponsiveConfig()

  // Função para formatar valores no eixo Y
  const formatYAxisValue = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`
    }
    return `R$ ${value.toFixed(0)}`
  }

  // Função para formatar labels do eixo X
  const formatXAxisLabel = (spaceName: string) => {
    if (!config.showXAxisLabels) return ''
    if (spaceName.length > 10) {
      return spaceName.substring(0, 10) + '...'
    }
    return spaceName
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Skeleton className="h-6 w-48" />
        <Skeleton className={`w-full h-[${height}px]`} />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle />}
        title="Erro ao carregar dados"
        description="Não foi possível carregar os dados de gastos por espaço."
        className={className}
      />
    )
  }

  if (!response?.data || response.data.length === 0) {
    return (
      <EmptyState
        icon={<Building2 />}
        title="Nenhum gasto encontrado"
        description="Não há dados de gastos para o período selecionado."
        className={className}
      />
    )
  }

  // Preparar dados para o gráfico (converter centavos para reais)
  const chartData = response.data.map((item) => ({
    ...item,
    amount: item.amount / 100, // Converter centavos para reais
  }))

  // Cards de resumo
  const summaryCards = [
    {
      title: 'Total de Gastos',
      value: response.summary.formattedTotalSpending,
      description: `${response.summary.totalSpaces} espaços`,
    },
    {
      title: 'Maior Gasto',
      value: chartData[0]?.formattedAmount || 'R$ 0,00',
      description: chartData[0]?.spaceName || 'N/A',
    },
    {
      title: 'Média por Espaço',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format((response.summary.totalSpending / 100) / response.summary.totalSpaces),
      description: 'Distribuição',
    },
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gastos por Espaço</h3>
          <p className="text-sm text-muted-foreground">
            Distribuição dos gastos entre os espaços
          </p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico */}
      <BaseChart height={height}>
        <BarChart
          data={chartData}
          margin={config.margin}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="spaceName"
            tick={{ fontSize: 12 }}
            tickFormatter={formatXAxisLabel}
            angle={breakpoint === 'mobile' ? -45 : 0}
            textAnchor={breakpoint === 'mobile' ? 'end' : 'middle'}
            height={breakpoint === 'mobile' ? 80 : 60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={formatYAxisValue}
            width={breakpoint === 'mobile' ? 60 : 80}
          />
          <Tooltip 
            content={<CustomTooltip />}
            wrapperStyle={{ 
              outline: 'none',
              zIndex: 1000 
            }}
          />
          <Bar 
            dataKey="amount" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            maxBarSize={config.barSize}
          />
        </BarChart>
      </BaseChart>
    </div>
  )
} 