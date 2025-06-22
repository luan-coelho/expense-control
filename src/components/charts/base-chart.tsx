'use client'

import { ResponsiveContainer } from 'recharts'
import { useBreakpoint } from '@/hooks/use-mobile'

interface BaseChartProps {
  children: React.ReactElement
  height?: number
  className?: string
  minHeight?: number
  maxHeight?: number
}

export function BaseChart({
  children,
  height = 300,
  className = '',
  minHeight = 200,
  maxHeight = 600,
}: BaseChartProps) {
  const breakpoint = useBreakpoint()

  // Ajustar altura baseado no breakpoint se não especificado
  const getResponsiveHeight = () => {
    if (height !== 300) return height // Se altura foi especificada, usar ela

    switch (breakpoint) {
      case 'mobile':
        return Math.max(minHeight, Math.min(250, maxHeight))
      case 'tablet':
        return Math.max(minHeight, Math.min(300, maxHeight))
      default:
        return Math.max(minHeight, Math.min(height, maxHeight))
    }
  }

  const responsiveHeight = getResponsiveHeight()

  return (
    <div className={`w-full ${className}`} style={{ minHeight: minHeight }}>
      <ResponsiveContainer width="100%" height={responsiveHeight} minHeight={minHeight}>
        {children}
      </ResponsiveContainer>
    </div>
  )
}
