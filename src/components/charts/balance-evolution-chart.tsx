'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useBalanceEvolution } from '@/hooks/use-analytics'
import { BaseChart } from './base-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Calendar, Activity } from 'lucide-react'
import { type AnalyticsFilters } from '@/services/analytics.service'

interface BalanceEvolutionChartProps {
  filters?: AnalyticsFilters
  height?: number
  className?: string
}

export function BalanceEvolutionChart({ 
  filters, 
  height = 400, 
  className = ''
}: BalanceEvolutionChartProps) {
  const { data, isLoading, error } = useBalanceEvolution(filters)

  // Função para formatar valores no tooltip
  const formatTooltipValue = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100)
  }

  // Função para formatar valores no eixo Y
  const formatYAxisValue = (value: number) => {
    if (value === 0) return 'R$ 0'
    
    const absValue = Math.abs(value)
    if (absValue >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    } else if (absValue >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`
    }
    return `R$ ${(value / 100).toFixed(0)}`
  }

  // Função para formatar data no eixo X
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    })
  }

  // Componente customizado para tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const date = new Date(label)
      const formattedDate = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{formattedDate}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Saldo: {data.formattedBalance}</span>
            </div>
            {data.dailyChange !== 0 && (
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${data.dailyChange > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">
                  Mudança: {data.formattedDailyChange}
                </span>
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-1">
              Receitas acumuladas: {formatTooltipValue(data.cumulativeIncome)}
            </div>
            <div className="text-xs text-muted-foreground">
              Despesas acumuladas: {formatTooltipValue(data.cumulativeExpenses)}
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="w-full" style={{ height }} />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className={`border-destructive/50 ${className}`}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">
              Erro ao carregar dados: {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center space-y-2">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Nenhum dado encontrado para o período selecionado
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Preparar dados para o gráfico
  const chartData = data.data.map(item => ({
    ...item,
    saldo: item.balance,
    date: formatDate(item.date)
  }))

  // Determinar cor da linha baseada na tendência
  const isPositiveTrend = data.summary.totalChange >= 0
  const lineColor = isPositiveTrend ? '#10b981' : '#ef4444'

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Evolução do Saldo</h3>
        <p className="text-sm text-muted-foreground">
          Acompanhe como seu saldo evoluiu ao longo do tempo
        </p>
      </div>

      {/* Gráfico */}
      <BaseChart height={height} className="w-full">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tickFormatter={formatYAxisValue}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
          <Line 
            type="monotone" 
            dataKey="saldo" 
            stroke={lineColor}
            strokeWidth={2}
            dot={{ r: 4, fill: lineColor }}
            activeDot={{ r: 6, fill: lineColor }}
            name="Saldo"
          />
        </LineChart>
      </BaseChart>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Inicial */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Inicial</p>
                <p className="text-lg font-bold">{data.summary.formattedInitialBalance}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Saldo Final */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Final</p>
                <p className="text-lg font-bold">{data.summary.formattedFinalBalance}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Variação Total */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Variação Total</p>
                <div className="flex items-center gap-2">
                  <p className={`text-lg font-bold ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
                    {data.summary.formattedTotalChange}
                  </p>
                  {isPositiveTrend ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Período */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Período</p>
                <p className="text-lg font-bold">{data.summary.periodDays} dias</p>
                <p className="text-xs text-muted-foreground">
                  {data.summary.totalTransactions} transações
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Adicionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Maior Saldo</p>
                <p className="text-lg font-bold text-green-600">{data.summary.formattedMaxBalance}</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Máximo
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Menor Saldo</p>
                <p className="text-lg font-bold text-red-600">{data.summary.formattedMinBalance}</p>
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                Mínimo
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 