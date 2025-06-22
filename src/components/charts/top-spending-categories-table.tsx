'use client'

import { useSpendingByCategory } from '@/hooks/use-analytics'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { type AnalyticsFilters } from '@/services/analytics.service'
import { AlertCircle, TrendingDown, Trophy, Medal, Award } from 'lucide-react'

interface TopSpendingCategoriesTableProps {
  filters?: AnalyticsFilters
  limit?: number
  className?: string
  showRanking?: boolean
  showPercentage?: boolean
}

export function TopSpendingCategoriesTable({
  filters,
  limit = 5,
  className,
  showRanking = true,
  showPercentage = true,
}: TopSpendingCategoriesTableProps) {
  const { data: response, isLoading, error } = useSpendingByCategory(filters)

  // Função para obter ícone do ranking
  const getRankingIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />
      default:
        return (
          <span className="h-4 w-4 flex items-center justify-center text-xs font-medium text-muted-foreground">
            {position}
          </span>
        )
    }
  }

  // Função para obter cor do badge baseada na posição
  const getBadgeVariant = (position: number) => {
    switch (position) {
      case 1:
        return 'default' as const
      case 2:
        return 'secondary' as const
      case 3:
        return 'outline' as const
      default:
        return 'outline' as const
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <EmptyState
            icon={<AlertCircle />}
            title="Erro ao carregar dados"
            description="Não foi possível carregar os dados das categorias de gastos."
          />
        </CardContent>
      </Card>
    )
  }

  if (!response?.data || response.data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <EmptyState
            icon={<TrendingDown />}
            title="Nenhum gasto encontrado"
            description="Não há dados de gastos para o período selecionado."
          />
        </CardContent>
      </Card>
    )
  }

  // Pegar apenas o número limitado de categorias
  const topCategories = response.data.slice(0, limit)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Top {limit} Categorias de Gastos
        </CardTitle>
        <CardDescription>Categorias com maiores gastos no período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {showRanking && <TableHead className="w-12">Pos.</TableHead>}
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              {showPercentage && <TableHead className="text-right w-20">%</TableHead>}
              <TableHead className="text-right w-20">Qtd.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topCategories.map((category, index) => {
              const position = index + 1
              return (
                <TableRow key={category.categoryId || 'unknown'} className="hover:bg-muted/50">
                  {showRanking && (
                    <TableCell>
                      <div className="flex items-center justify-center">{getRankingIcon(position)}</div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                        aria-label={`Cor da categoria ${category.categoryName}`}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm truncate">{category.categoryName}</span>
                        {position <= 3 && (
                          <Badge variant={getBadgeVariant(position)} className="text-xs w-fit mt-1">
                            {position === 1 ? '🥇 Maior gasto' : position === 2 ? '🥈 2º lugar' : '🥉 3º lugar'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{category.formattedAmount}</TableCell>
                  {showPercentage && (
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {category.percentage.toFixed(1)}%
                    </TableCell>
                  )}
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {category.transactionCount}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {/* Resumo */}
        {response.summary && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total de categorias: {response.summary.totalCategories}</span>
              <span className="font-medium">Total gasto: {response.summary.formattedTotalSpending}</span>
            </div>
            {topCategories.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                As {limit} principais categorias representam{' '}
                {topCategories.reduce((sum, cat) => sum + cat.percentage, 0).toFixed(1)}% do total de gastos
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
