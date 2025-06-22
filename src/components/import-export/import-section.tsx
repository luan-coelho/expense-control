'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useImportData, usePreviewImport, useDownloadTemplate } from '@/hooks/use-import-export'
import { ImportOptions, ImportResult } from '@/services/import-export.service'
import { Upload, Download, FileText, AlertCircle, CheckCircle2, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface ColumnMapping {
  description?: string
  amount?: string
  type?: string
  date?: string
  category?: string
  account?: string
  space?: string
}

export function ImportSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ImportResult | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping>({})
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const importMutation = useImportData()
  const previewMutation = usePreviewImport()
  const downloadTemplateMutation = useDownloadTemplate()

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewData(null)
      setShowPreview(false)
      toast.success(`Arquivo "${file.name}" selecionado`)
    }
  }

  function handlePreview() {
    if (!selectedFile) {
      toast.error('Selecione um arquivo primeiro')
      return
    }

    const options: ImportOptions = {
      file: selectedFile,
      mappings,
      preview: true,
    }

    previewMutation.mutate(options, {
      onSuccess: data => {
        setPreviewData(data)
        setShowPreview(true)
      },
    })
  }

  function handleImport() {
    if (!selectedFile) {
      toast.error('Selecione um arquivo primeiro')
      return
    }

    const options: ImportOptions = {
      file: selectedFile,
      mappings,
      preview: false,
    }

    importMutation.mutate(options, {
      onSuccess: () => {
        setSelectedFile(null)
        setPreviewData(null)
        setShowPreview(false)
        setMappings({})
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      },
    })
  }

  function handleDownloadTemplate() {
    downloadTemplateMutation.mutate()
  }

  function handleMappingChange(field: keyof ColumnMapping, value: string) {
    setMappings(prev => ({
      ...prev,
      [field]: value || undefined,
    }))
  }

  const availableColumns = previewData?.preview?.[0] ? Object.keys(previewData.preview[0]) : []

  return (
    <div className="space-y-6">
      {/* Template e Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4" />
              Template CSV
            </CardTitle>
            <CardDescription className="text-xs">Baixe o template para importação</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              disabled={downloadTemplateMutation.isPending}
              className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {downloadTemplateMutation.isPending ? 'Baixando...' : 'Baixar Template'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Upload className="h-4 w-4" />
              Upload de Arquivo
            </CardTitle>
            <CardDescription className="text-xs">Selecione um arquivo CSV ou Excel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{selectedFile.name}</span>
                  <Badge variant="secondary">{(selectedFile.size / 1024).toFixed(1)} KB</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mapeamento de Colunas */}
      {selectedFile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mapeamento de Colunas</CardTitle>
            <CardDescription>Configure como as colunas do seu arquivo devem ser interpretadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="description-mapping">Descrição</Label>
                <Select
                  value={mappings.description || ''}
                  onValueChange={value => handleMappingChange('description', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {availableColumns.map(col => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount-mapping">Valor</Label>
                <Select value={mappings.amount || ''} onValueChange={value => handleMappingChange('amount', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {availableColumns.map(col => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type-mapping">Tipo</Label>
                <Select value={mappings.type || ''} onValueChange={value => handleMappingChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {availableColumns.map(col => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date-mapping">Data</Label>
                <Select value={mappings.date || ''} onValueChange={value => handleMappingChange('date', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {availableColumns.map(col => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category-mapping">Categoria</Label>
                <Select value={mappings.category || ''} onValueChange={value => handleMappingChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {availableColumns.map(col => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="account-mapping">Conta</Label>
                <Select value={mappings.account || ''} onValueChange={value => handleMappingChange('account', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {availableColumns.map(col => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      {selectedFile && (
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={previewMutation.isPending}
            className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {previewMutation.isPending ? 'Carregando...' : 'Visualizar Preview'}
          </Button>

          <Button
            onClick={handleImport}
            disabled={importMutation.isPending || !showPreview}
            className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {importMutation.isPending ? 'Importando...' : 'Importar Dados'}
          </Button>
        </div>
      )}

      {/* Preview dos Dados */}
      {showPreview && previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview dos Dados
            </CardTitle>
            <CardDescription>Visualize como os dados serão importados</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Estatísticas */}
            {previewData.stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Total: {previewData.stats.total}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <Badge variant="default">Válidos: {previewData.stats.valid}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <Badge variant="destructive">Inválidos: {previewData.stats.invalid}</Badge>
                </div>
              </div>
            )}

            <Separator className="my-4" />

            {/* Tabela de Preview */}
            {previewData.preview && previewData.preview.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Conta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.preview.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {previewData.errors.some(error => error.row === index + 1) ? (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Erro
                            </Badge>
                          ) : (
                            <Badge variant="default">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{row.description || '-'}</TableCell>
                        <TableCell>{row.amount ? `R$ ${row.amount}` : '-'}</TableCell>
                        <TableCell>{row.type || '-'}</TableCell>
                        <TableCell>{row.date || '-'}</TableCell>
                        <TableCell>{row.category || '-'}</TableCell>
                        <TableCell>{row.account || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {previewData.preview.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Mostrando 10 de {previewData.preview.length} registros
                  </p>
                )}
              </div>
            )}

            {/* Erros */}
            {previewData.errors && previewData.errors.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-red-600 mb-3">Erros Encontrados:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {previewData.errors.map((error, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded-md">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium">Linha {error.row}:</span>
                        <ul className="list-disc list-inside mt-1">
                          {error.errors.map((err, errIndex) => (
                            <li key={errIndex} className="text-red-700">
                              {err}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
