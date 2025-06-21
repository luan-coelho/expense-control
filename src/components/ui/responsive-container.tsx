'use client'

import { forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useResponsiveLayout } from '@/hooks/use-responsive-layout'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  variant?: 'main' | 'section' | 'chart' | 'metrics' | 'filters'
  enableAnimations?: boolean
  touchOptimized?: boolean
}

/**
 * Container responsivo que se adapta automaticamente ao dispositivo
 * Aplica classes CSS e otimizações baseadas no breakpoint atual
 */
export const ResponsiveContainer = forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  ({ children, className, variant = 'section', enableAnimations = true, touchOptimized = true, ...props }, ref) => {
    const { 
      containerClasses, 
      mobileOptimizations, 
      performanceConfig,
      viewportConfig 
    } = useResponsiveLayout()

    // Selecionar classes baseadas na variante
    const getVariantClasses = () => {
      switch (variant) {
        case 'main':
          return containerClasses.main
        case 'section':
          return containerClasses.section
        case 'chart':
          return containerClasses.chartGrid
        case 'metrics':
          return containerClasses.metricsGrid
        case 'filters':
          return containerClasses.filtersGrid
        default:
          return containerClasses.section
      }
    }

    // Aplicar otimizações baseadas no dispositivo
    const getOptimizationClasses = () => {
      const classes: string[] = []

      // Otimizações para mobile
      if (mobileOptimizations.touchOptimized && touchOptimized) {
        classes.push('touch-manipulation')
      }

      if (mobileOptimizations.reduceAnimations && !enableAnimations) {
        classes.push('motion-reduce:animate-none')
      }

      // Otimizações de performance
      if (viewportConfig.isMobile) {
        classes.push('will-change-auto')
      }

      return classes.join(' ')
    }

    // Aplicar estilos de transição baseados na performance
    const getTransitionClasses = () => {
      if (!enableAnimations || mobileOptimizations.reduceAnimations) {
        return ''
      }

      const duration = performanceConfig.animationDuration
      return `transition-all duration-${duration} ease-in-out`
    }

    return (
      <div
        ref={ref}
        className={cn(
          getVariantClasses(),
          getOptimizationClasses(),
          getTransitionClasses(),
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveContainer.displayName = 'ResponsiveContainer'

/**
 * Container específico para gráficos com otimizações adicionais
 */
export const ResponsiveChartContainer = forwardRef<HTMLDivElement, Omit<ResponsiveContainerProps, 'variant'>>(
  ({ children, className, ...props }, ref) => {
    const { chartConfig, mobileOptimizations } = useResponsiveLayout()

    return (
      <ResponsiveContainer
        ref={ref}
        variant="chart"
        className={cn(
          'relative overflow-hidden',
          mobileOptimizations.useCompactLayout && 'space-y-3',
          className
        )}
        {...props}
      >
        <div 
          className="w-full"
          style={{ 
            height: chartConfig.chartHeight,
            minHeight: mobileOptimizations.useCompactLayout ? '240px' : '300px'
          }}
        >
          {children}
        </div>
      </ResponsiveContainer>
    )
  }
)

ResponsiveChartContainer.displayName = 'ResponsiveChartContainer'

/**
 * Container específico para métricas com grid responsivo
 */
export const ResponsiveMetricsContainer = forwardRef<HTMLDivElement, Omit<ResponsiveContainerProps, 'variant'>>(
  ({ children, className, ...props }, ref) => {
    const { mobileOptimizations, viewportConfig } = useResponsiveLayout()

    return (
      <ResponsiveContainer
        ref={ref}
        variant="metrics"
        className={cn(
          'auto-rows-fr',
          mobileOptimizations.shouldStackVertically && 'grid-cols-1',
          viewportConfig.isTablet && 'grid-cols-2',
          viewportConfig.isDesktop && 'grid-cols-4',
          className
        )}
        {...props}
      >
        {children}
      </ResponsiveContainer>
    )
  }
)

ResponsiveMetricsContainer.displayName = 'ResponsiveMetricsContainer' 