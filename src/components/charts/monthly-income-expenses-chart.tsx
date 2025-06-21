'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useMonthlyIncomeExpenses } from '@/hooks/use-analytics'
import { BaseChart } from './base-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { type AnalyticsFilters } from '@/services/analytics.service'

interface MonthlyIncomeExpensesChartProps {
  filters?: AnalyticsFilters
  height?: number
  className?: string
  chartType?: 'line' | 'bar'
}

export function MonthlyIncomeExpensesChart({ 
  filters, 
  height = 400, 
  className = '',
  chartType: initialChartType = 'bar'
}: MonthlyIncomeExpensesChartProps) {
  const { data, isLoading, error } = useMonthlyIncomeExpenses(filters)
  const [chartType, setChartType] = useState<'line' | 'bar'>(initialChartType)

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

  // Componente customizado para tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Receitas: {data.formattedIncome}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Despesas: {data.formattedExpenses}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium">
                Saldo: {data.formattedNetBalance}
              </span>
            </div>
            <div className="text-xs text-muted-foreground pt-1">
              {data.transactionCount} transações
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
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="w-full" style={{ height }} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
    receitas: item.income,
    despesas: item.expenses,
    saldo: item.netBalance
  }))

  const ChartComponent = chartType === 'line' ? LineChart : BarChart

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header com toggle de tipo de gráfico */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Receitas vs Despesas Mensais</h3>
          <p className="text-sm text-muted-foreground">
            Comparação mensal das suas receitas e despesas
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={chartType === 'bar' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setChartType('bar')}
          >
            Barras
          </Button>
          <Button 
            variant={chartType === 'line' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setChartType('line')}
          >
            Linhas
          </Button>
        </div>
      </div>

      {/* Gráfico */}
      <BaseChart height={height} className="w-full">
        <ChartComponent data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="period" 
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
          <Legend />
          
          {chartType === 'line' ? (
            <>
              <Line 
                type="monotone" 
                dataKey="receitas" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Receitas"
              />
              <Line 
                type="monotone" 
                dataKey="despesas" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Despesas"
              />
              <Line 
                type="monotone" 
                dataKey="saldo" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Saldo Líquido"
              />
            </>
          ) : (
            <>
              <Bar 
                dataKey="receitas" 
                fill="#10b981" 
                name="Receitas"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="despesas" 
                fill="#ef4444" 
                name="Despesas"
                radius={[2, 2, 0, 0]}
              />
            </>
          )}
        </ChartComponent>
      </BaseChart>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Receitas</p>
                <p className="text-lg font-semibold text-green-600">
                  {data.summary.formattedTotalIncome}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Despesas</p>
                <p className="text-lg font-semibold text-red-600">
                  {data.summary.formattedTotalExpenses}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Líquido</p>
                <p className={`text-lg font-semibold ${
                  data.summary.totalNetBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.summary.formattedTotalNetBalance}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações adicionais */}
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">
          {data.summary.periodCount} períodos
        </Badge>
        <Badge variant="secondary">
          {data.summary.totalTransactions} transações
        </Badge>
      </div>
    </div>
  )
} 