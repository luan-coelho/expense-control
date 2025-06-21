import { useMemo, useCallback, useRef, useEffect } from 'react'
import { type AnalyticsFilters } from '@/services/analytics.service'

/**
 * Hook para otimizar performance dos gráficos
 * Implementa memoização e debounce para evitar re-renders desnecessários
 */
export function useChartPerformance() {
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Debounce para redimensionamento de gráficos
   */
  const debouncedResize = useCallback((callback: () => void, delay = 300) => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }
    
    resizeTimeoutRef.current = setTimeout(callback, delay)
  }, [])

  /**
   * Cleanup do timeout quando o componente é desmontado
   */
  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Memoiza altura dos gráficos baseado no breakpoint
   */
  const getOptimizedHeight = useCallback((breakpoint: string) => {
    switch (breakpoint) {
      case 'mobile':
        return 280
      case 'tablet':
        return 320
      default:
        return 380
    }
  }, [])

  /**
   * Otimiza cores dos gráficos com memoização
   */
  const memoizedColors = useMemo(() => ({
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    success: 'hsl(142, 76%, 36%)',
    warning: 'hsl(38, 92%, 50%)',
    destructive: 'hsl(var(--destructive))',
    muted: 'hsl(var(--muted-foreground))',
    accent: 'hsl(var(--accent))',
    chart: [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ],
  }), [])

  /**
   * Otimiza formatação de valores monetários
   */
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }, [])

  /**
   * Otimiza formatação de percentuais
   */
  const formatPercentage = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100)
  }, [])

  return {
    debouncedResize,
    getOptimizedHeight,
    memoizedColors,
    formatCurrency,
    formatPercentage,
  }
} 