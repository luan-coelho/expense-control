import { useState } from 'react'
import { exportService, type ExportData } from '@/services/export.service'
import { toast } from 'sonner'

interface UseExportReturn {
  isExporting: boolean
  exportToCSV: (data: ExportData) => Promise<void>
  exportToPDF: (data: ExportData) => Promise<void>
}

export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false)

  const exportToCSV = async (data: ExportData): Promise<void> => {
    try {
      setIsExporting(true)
      await exportService.exportToCSV(data)
      toast.success('Relatório CSV exportado com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      toast.error('Erro ao exportar relatório CSV')
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPDF = async (data: ExportData): Promise<void> => {
    try {
      setIsExporting(true)
      await exportService.exportToPDF(data)
      toast.success('Relatório PDF aberto para impressão!')
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast.error('Erro ao exportar relatório PDF')
    } finally {
      setIsExporting(false)
    }
  }

  return {
    isExporting,
    exportToCSV,
    exportToPDF,
  }
}
