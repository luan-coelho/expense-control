'use client'

import { forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AccessibleChartProps {
  children: ReactNode
  title: string
  description?: string
  className?: string
  ariaLabel?: string
  role?: string
}

/**
 * Wrapper para gráficos com melhorias de acessibilidade
 * Adiciona ARIA labels, roles e estrutura semântica apropriada
 */
export const AccessibleChart = forwardRef<HTMLDivElement, AccessibleChartProps>(
  ({ children, title, description, className, ariaLabel, role = 'img', ...props }, ref) => {
    const chartId = `chart-${title.toLowerCase().replace(/\s+/g, '-')}`
    const descriptionId = description ? `${chartId}-description` : undefined

    return (
      <div
        ref={ref}
        className={cn('relative', className)}
        role={role}
        aria-labelledby={chartId}
        aria-describedby={descriptionId}
        aria-label={ariaLabel || `Gráfico: ${title}`}
        tabIndex={0}
        {...props}>
        {/* Título visualmente oculto para screen readers */}
        <h3 id={chartId} className="sr-only">
          {title}
        </h3>

        {/* Descrição visualmente oculta para screen readers */}
        {description && (
          <p id={descriptionId} className="sr-only">
            {description}
          </p>
        )}

        {/* Conteúdo do gráfico */}
        <div className="w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md">
          {children}
        </div>

        {/* Instrução de navegação para screen readers */}
        <div className="sr-only" aria-live="polite">
          Use as teclas de seta para navegar pelos dados do gráfico. Pressione Enter para mais detalhes.
        </div>
      </div>
    )
  },
)

AccessibleChart.displayName = 'AccessibleChart'
