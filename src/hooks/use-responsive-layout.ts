import { useState, useEffect, useCallback } from 'react'
import { useBreakpoint } from './use-mobile'

interface ResponsiveLayoutConfig {
  chartHeight: number
  gridCols: {
    sm: number
    md: number
    lg: number
    xl: number
  }
  spacing: string
  cardPadding: string
  fontSize: {
    title: string
    description: string
    value: string
  }
}

/**
 * Hook para otimizar layout responsivo da página de relatórios
 * Ajusta automaticamente tamanhos, espaçamentos e layouts baseado no dispositivo
 */
export function useResponsiveLayout() {
  const breakpoint = useBreakpoint()
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  // Detectar orientação do dispositivo
  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)

    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [])

  /**
   * Configuração responsiva para gráficos
   */
  const getChartConfig = useCallback((): ResponsiveLayoutConfig => {
    const isMobile = breakpoint === 'mobile'
    const isTablet = breakpoint === 'tablet'
    const isLandscape = orientation === 'landscape'

    return {
      chartHeight: (() => {
        if (isMobile) {
          return isLandscape ? 240 : 280
        }
        if (isTablet) {
          return isLandscape ? 300 : 350
        }
        return 400
      })(),
      gridCols: {
        sm: isMobile ? 1 : 2,
        md: isTablet ? 2 : 3,
        lg: 3,
        xl: 4,
      },
      spacing: isMobile ? 'gap-3' : isTablet ? 'gap-4' : 'gap-6',
      cardPadding: isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-6',
      fontSize: {
        title: isMobile ? 'text-base' : isTablet ? 'text-lg' : 'text-xl',
        description: 'text-sm',
        value: isMobile ? 'text-xl' : 'text-2xl',
      },
    }
  }, [breakpoint, orientation])

  /**
   * Classes CSS responsivas para containers
   */
  const getContainerClasses = useCallback(() => {
    const config = getChartConfig()
    return {
      main: `container mx-auto ${config.cardPadding} space-y-4 sm:space-y-6`,
      section: `grid grid-cols-1 ${config.spacing}`,
      chartGrid: `grid grid-cols-1 lg:grid-cols-3 ${config.spacing}`,
      metricsGrid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${config.spacing}`,
      filtersGrid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${config.spacing}`,
    }
  }, [getChartConfig])

  /**
   * Configurações específicas para mobile
   */
  const getMobileOptimizations = useCallback(() => {
    const isMobile = breakpoint === 'mobile'

    return {
      shouldStackVertically: isMobile,
      useCompactLayout: isMobile,
      hideSecondaryInfo: isMobile && orientation === 'portrait',
      reduceAnimations: isMobile,
      touchOptimized: isMobile,
    }
  }, [breakpoint, orientation])

  /**
   * Configurações para tablets
   */
  const getTabletOptimizations = useCallback(() => {
    const isTablet = breakpoint === 'tablet'

    return {
      useHybridLayout: isTablet,
      adaptiveColumns: isTablet,
      optimizedTouch: isTablet,
      balancedSpacing: isTablet,
    }
  }, [breakpoint])

  /**
   * Configurações para desktop
   */
  const getDesktopOptimizations = useCallback(() => {
    const isDesktop = breakpoint === 'desktop'

    return {
      useFullLayout: isDesktop,
      enableHoverEffects: isDesktop,
      showAllDetails: isDesktop,
      optimizedForMouse: isDesktop,
    }
  }, [breakpoint])

  /**
   * Configurações de viewport específicas
   */
  const getViewportConfig = useCallback(() => {
    return {
      isMobile: breakpoint === 'mobile',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop',
      isPortrait: orientation === 'portrait',
      isLandscape: orientation === 'landscape',
      showSidebar: breakpoint !== 'mobile',
      useDrawer: breakpoint === 'mobile',
    }
  }, [breakpoint, orientation])

  /**
   * Configurações de performance baseadas no dispositivo
   */
  const getPerformanceConfig = useCallback(() => {
    const isMobile = breakpoint === 'mobile'

    return {
      animationDuration: isMobile ? 300 : 500,
      debounceDelay: isMobile ? 500 : 300,
      lazyLoadThreshold: isMobile ? 100 : 200,
      maxConcurrentCharts: isMobile ? 2 : 4,
      enableVirtualization: isMobile,
    }
  }, [breakpoint])

  return {
    breakpoint,
    orientation,
    chartConfig: getChartConfig(),
    containerClasses: getContainerClasses(),
    mobileOptimizations: getMobileOptimizations(),
    tabletOptimizations: getTabletOptimizations(),
    desktopOptimizations: getDesktopOptimizations(),
    viewportConfig: getViewportConfig(),
    performanceConfig: getPerformanceConfig(),
  }
}
