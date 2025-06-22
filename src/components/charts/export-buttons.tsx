'use client'

import { Button } from '@/components/ui/button'
import { useExport } from '@/hooks/use-export'
import { type AnalyticsFilters } from '@/services/analytics.service'
import { type ExportData } from '@/services/export.service'
import { useSummaryMetrics, useSpendingByCategory, useSpendingBySpace } from '@/hooks/use-analytics'
import { Download, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExportButtonsProps {
  filters: AnalyticsFilters
  className?: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
}

export function ExportButtons({ filters, className, variant = 'outline', size = 'default' }: ExportButtonsProps) {
  const { isExporting, exportToCSV, exportToPDF } = useExport()

  // Buscar dados para exportação
  const { data: summaryMetrics } = useSummaryMetrics(filters)
  const { data: spendingByCategory } = useSpendingByCategory(filters)
  const { data: spendingBySpace } = useSpendingBySpace(filters)

  // Preparar dados para exportação
  const prepareExportData = (): ExportData => {
    return {
      summaryMetrics,
      spendingByCategory,
      spendingBySpace,
      filters,
      reportDate: new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  const handleExportCSV = async () => {
    const data = prepareExportData()
    await exportToCSV(data)
  }

  const handleExportPDF = async () => {
    const data = prepareExportData()
    await exportToPDF(data)
  }

  // Verificar se há dados para exportar
  const hasData = summaryMetrics || spendingByCategory || spendingBySpace
  const isDataLoading = !summaryMetrics && !spendingByCategory && !spendingBySpace

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant={variant}
        size={size}
        onClick={handleExportCSV}
        disabled={isExporting || !hasData || isDataLoading}
        className="flex items-center gap-2">
        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        <span className="hidden sm:inline">Exportar CSV</span>
        <span className="sm:hidden">CSV</span>
      </Button>

      <Button
        variant={variant}
        size={size}
        onClick={handleExportPDF}
        disabled={isExporting || !hasData || isDataLoading}
        className="flex items-center gap-2">
        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        <span className="hidden sm:inline">Exportar PDF</span>
        <span className="sm:hidden">PDF</span>
      </Button>

      {isDataLoading && <span className="text-xs text-muted-foreground hidden lg:inline">Carregando dados...</span>}

      {!hasData && !isDataLoading && (
        <span className="text-xs text-muted-foreground hidden lg:inline">Nenhum dado disponível</span>
      )}
    </div>
  )
}
