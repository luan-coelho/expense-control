import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import importExportService, { ExportOptions, ImportOptions, ImportResult } from '@/services/import-export.service'
import { queryKeys } from '@/lib/routes'

export function useExportData() {
  return useMutation({
    mutationFn: async (options: ExportOptions) => {
      const blob = await importExportService.exportData(options)
      const filename = `${options.type}-${new Date().toISOString().split('T')[0]}.${options.format}`
      importExportService.downloadBlob(blob, filename)
      return { success: true, filename }
    },
    onSuccess: data => {
      toast.success(`Arquivo ${data.filename} baixado com sucesso!`)
    },
    onError: (error: Error) => {
      toast.error(`Erro na exportação: ${error.message}`)
    },
  })
}

export function useImportData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (options: ImportOptions): Promise<ImportResult> => {
      return importExportService.importData(options)
    },
    onSuccess: data => {
      if (data.success && data.imported > 0) {
        toast.success(`${data.imported} transações importadas com sucesso!`)

        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all })
      } else if (data.errors.length > 0) {
        toast.warning(`Importação concluída com ${data.errors.length} erros`)
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro na importação: ${error.message}`)
    },
  })
}

export function usePreviewImport() {
  return useMutation({
    mutationFn: (options: ImportOptions): Promise<ImportResult> => {
      return importExportService.importData({ ...options, preview: true })
    },
    onError: (error: Error) => {
      toast.error(`Erro no preview: ${error.message}`)
    },
  })
}

export function useDownloadTemplate() {
  return useMutation({
    mutationFn: async () => {
      const blob = await importExportService.downloadTemplate()
      importExportService.downloadBlob(blob, 'template-importacao.csv')
      return { success: true }
    },
    onSuccess: () => {
      toast.success('Template baixado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao baixar template: ${error.message}`)
    },
  })
}
