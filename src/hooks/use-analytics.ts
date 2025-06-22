import { useQuery } from '@tanstack/react-query'
import { analyticsService, type AnalyticsFilters } from '@/services/analytics.service'
import { useActiveSpaceId } from '@/components/providers/space-provider'
import { queryKeys } from '@/lib/routes'

/**
 * Hook para buscar dados de gastos por categoria
 * Automaticamente inclui o filtro do espaço ativo
 */
export function useSpendingByCategory(filters?: AnalyticsFilters) {
  const activeSpaceId = useActiveSpaceId()

  // Combinar filtros do parâmetro com o filtro de espaço ativo
  const enhancedFilters = {
    ...filters,
    spaceId: activeSpaceId,
  }

  return useQuery({
    queryKey: queryKeys.analytics.spendingByCategory(enhancedFilters),
    queryFn: () => analyticsService.getSpendingByCategory(enhancedFilters),
    enabled: !!activeSpaceId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para buscar dados de gastos por espaço
 * Nota: Este hook não usa o filtro de espaço ativo pois compara todos os espaços
 */
export function useSpendingBySpace(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: queryKeys.analytics.spendingBySpace(filters),
    queryFn: () => analyticsService.getSpendingBySpace(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para buscar métricas de resumo e comparação de períodos
 * Automaticamente inclui o filtro do espaço ativo
 */
export function useSummaryMetrics(filters?: AnalyticsFilters) {
  const activeSpaceId = useActiveSpaceId()

  // Combinar filtros do parâmetro com o filtro de espaço ativo
  const enhancedFilters = {
    ...filters,
    spaceId: activeSpaceId,
  }

  return useQuery({
    queryKey: queryKeys.analytics.summaryMetrics(enhancedFilters),
    queryFn: () => analyticsService.getSummaryMetrics(enhancedFilters),
    enabled: !!activeSpaceId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para buscar dados mensais de receitas vs despesas
 * Automaticamente inclui o filtro do espaço ativo
 */
export function useMonthlyIncomeExpenses(filters?: AnalyticsFilters) {
  const activeSpaceId = useActiveSpaceId()

  // Combinar filtros do parâmetro com o filtro de espaço ativo
  const enhancedFilters = {
    ...filters,
    spaceId: activeSpaceId,
  }

  return useQuery({
    queryKey: queryKeys.analytics.monthlyIncomeExpenses(enhancedFilters),
    queryFn: () => analyticsService.getMonthlyIncomeExpenses(enhancedFilters),
    enabled: !!activeSpaceId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para buscar dados de evolução do saldo
 * Automaticamente inclui o filtro do espaço ativo
 */
export function useBalanceEvolution(filters?: AnalyticsFilters) {
  const activeSpaceId = useActiveSpaceId()

  // Combinar filtros do parâmetro com o filtro de espaço ativo
  const enhancedFilters = {
    ...filters,
    spaceId: activeSpaceId,
  }

  return useQuery({
    queryKey: queryKeys.analytics.balanceEvolution(enhancedFilters),
    queryFn: () => analyticsService.getBalanceEvolution(enhancedFilters),
    enabled: !!activeSpaceId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
