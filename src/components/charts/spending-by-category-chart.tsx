'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BaseChart } from './base-chart'
import { useSpendingByCategory } from '@/hooks/use-analytics'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useBreakpoint, useScreenSize } from '@/hooks/use-mobile'
import { type AnalyticsFilters } from '@/services/analytics.service'
import { AlertCircle, PieChart as PieChartIcon } from 'lucide-react'

interface SpendingByCategoryChartProps {
  filters?: AnalyticsFilters
  height?: number
  className?: string
}

// Cores para o gráfico de pizza
const CHART_COLORS = [
  '#10b981', // green-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#ec4899', // pink-500
  '#6b7280', // gray-500
]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: {
      categoryName: string
      formattedAmount: string
      percentage: number
      transactionCount: number
    }
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-card border rounded-lg p-3 shadow-lg max-w-xs">
        <p className="font-medium text-foreground truncate">{data.categoryName}</p>
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

export function SpendingByCategoryChart({ filters, height = 400, className }: SpendingByCategoryChartProps) {
  const { data: response, isLoading, error } = useSpendingByCategory(filters)
  const breakpoint = useBreakpoint()
  const { width } = useScreenSize()

  // Configurações responsivas
  const getResponsiveConfig = () => {
    const baseConfig = {
      outerRadius: 120,
      showLabels: true,
      legendPosition: 'bottom' as const,
      legendHeight: 36,
    }

    switch (breakpoint) {
      case 'mobile':
        return {
          ...baseConfig,
          outerRadius: Math.min(width * 0.25, 80), // 25% da largura ou máximo 80px
          showLabels: false, // Desabilitar labels em mobile para evitar sobreposição
          legendHeight: 60, // Mais espaço para legend em mobile
        }
      case 'tablet':
        return {
          ...baseConfig,
          outerRadius: Math.min(width * 0.2, 100),
          showLabels: true,
          legendHeight: 48,
        }
      default:
        return baseConfig
    }
  }

  const config = getResponsiveConfig()

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
        description="Não foi possível carregar os dados de gastos por categoria."
        className={className}
      />
    )
  }

  if (!response?.data || response.data.length === 0) {
    return (
      <EmptyState
        icon={<PieChartIcon />}
        title="Nenhum gasto encontrado"
        description="Não há dados de gastos para o período selecionado."
        className={className}
      />
    )
  }

  // Preparar dados para o gráfico
  const chartData = response.data.map((item, index) => ({
    ...item,
    fill: item.color || CHART_COLORS[index % CHART_COLORS.length],
  }))

  // Função personalizada para renderizar labels responsivos
  const renderCustomLabel = ({ categoryName, percentage, cx, cy, midAngle, innerRadius, outerRadius }: any) => {
    if (!config.showLabels) return null
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 1.2
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    // Mostrar apenas percentuais maiores que 5% para evitar sobreposição
    if (percentage < 5) return null

    return (
      <text 
        x={x} 
        y={y} 
        fill="hsl(var(--foreground))" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gastos por Categoria</h3>
          <p className="text-sm text-muted-foreground">
            Total: {response.summary.formattedTotalSpending} em {response.summary.totalCategories} categorias
          </p>
        </div>
      </div>

      <BaseChart height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={config.outerRadius}
            dataKey="amount"
            label={config.showLabels ? renderCustomLabel : false}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip />}
            wrapperStyle={{ 
              outline: 'none',
              zIndex: 1000 
            }}
          />
          <Legend 
            verticalAlign={config.legendPosition}
            height={config.legendHeight}
            wrapperStyle={{
              paddingTop: breakpoint === 'mobile' ? '20px' : '10px',
              fontSize: breakpoint === 'mobile' ? '12px' : '14px'
            }}
            formatter={(value, entry) => (
              <span 
                style={{ color: entry.color }}
                className={breakpoint === 'mobile' ? 'text-xs' : 'text-sm'}
              >
                {breakpoint === 'mobile' && value.length > 15 
                  ? `${value.substring(0, 12)}...` 
                  : value
                }
              </span>
            )}
          />
        </PieChart>
      </BaseChart>
    </div>
  )
} 