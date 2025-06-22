import { routes } from '@/lib/routes'

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json'
  type: 'transactions' | 'full-backup' | 'report'
  filters?: {
    startDate?: string
    endDate?: string
    categoryIds?: string[]
    accountIds?: string[]
    spaceIds?: string[]
    type?: 'INCOME' | 'EXPENSE' | 'all'
  }
}

export interface ImportOptions {
  file: File
  mappings?: {
    description?: string
    amount?: string
    type?: string
    date?: string
    category?: string
    account?: string
    space?: string
  }
  preview?: boolean
}

export interface ImportResult {
  success: boolean
  imported: number
  errors: Array<{
    row: number
    errors: string[]
    data: any
  }>
  preview?: any[]
  stats?: {
    total: number
    valid: number
    invalid: number
  }
  transactions?: any[]
}

class ImportExportService {
  async exportData(options: ExportOptions): Promise<Blob> {
    const response = await fetch(routes.api.export, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro na exportação')
    }

    return response.blob()
  }

  async importData(options: ImportOptions): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', options.file)
    formData.append('mappings', JSON.stringify(options.mappings || {}))
    formData.append('preview', options.preview ? 'true' : 'false')

    const response = await fetch(routes.api.import, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro na importação')
    }

    return response.json()
  }

  async downloadTemplate(): Promise<Blob> {
    const response = await fetch(routes.api.import, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Erro ao baixar template')
    }

    return response.blob()
  }

  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export default new ImportExportService()
