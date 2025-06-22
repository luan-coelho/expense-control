'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { Download, Upload, CheckCircle2, AlertCircle, FileText, Calendar, Filter } from 'lucide-react'

interface OperationRecord {
  id: string
  type: 'import' | 'export'
  status: 'success' | 'error' | 'warning'
  fileName: string
  recordsProcessed: number
  errors: number
  createdAt: string
  format: string
  details?: string
}

// Mock data - em um cenário real, isso viria de uma API
const mockOperations: OperationRecord[] = [
  {
    id: '1',
    type: 'export',
    status: 'success',
    fileName: 'transactions-2024-01-15.csv',
    recordsProcessed: 150,
    errors: 0,
    createdAt: '2024-01-15T10:30:00Z',
    format: 'CSV',
    details: 'Exportação de transações do último mês',
  },
  {
    id: '2',
    type: 'import',
    status: 'warning',
    fileName: 'bank-statement.xlsx',
    recordsProcessed: 89,
    errors: 3,
    createdAt: '2024-01-14T15:45:00Z',
    format: 'Excel',
    details: '3 registros com problemas de validação',
  },
  {
    id: '3',
    type: 'export',
    status: 'success',
    fileName: 'backup-completo-2024-01-10.json',
    recordsProcessed: 500,
    errors: 0,
    createdAt: '2024-01-10T09:15:00Z',
    format: 'JSON',
    details: 'Backup completo dos dados financeiros',
  },
  {
    id: '4',
    type: 'import',
    status: 'error',
    fileName: 'transacoes-invalidas.csv',
    recordsProcessed: 0,
    errors: 25,
    createdAt: '2024-01-08T14:20:00Z',
    format: 'CSV',
    details: 'Formato de arquivo não reconhecido',
  },
]

export function OperationHistory() {
  const [filterType, setFilterType] = useState<'all' | 'import' | 'export'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error' | 'warning'>('all')

  const filteredOperations = mockOperations.filter(operation => {
    const typeMatch = filterType === 'all' || operation.type === filterType
    const statusMatch = filterStatus === 'all' || operation.status === filterStatus
    return typeMatch && statusMatch
  })

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'success':
        return <Badge variant="default">Sucesso</Badge>
      case 'warning':
        return <Badge variant="secondary">Aviso</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      default:
        return null
    }
  }

  function getTypeIcon(type: string) {
    return type === 'import' ? (
      <Upload className="h-4 w-4 text-blue-500" />
    ) : (
      <Download className="h-4 w-4 text-green-500" />
    )
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Operação</label>
              <Select value={filterType} onValueChange={(value: 'all' | 'import' | 'export') => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="import">Importação</SelectItem>
                  <SelectItem value="export">Exportação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filterStatus}
                onValueChange={(value: 'all' | 'success' | 'error' | 'warning') => setFilterStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Operações
          </CardTitle>
          <CardDescription>Visualize todas as operações de importação e exportação realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOperations.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="Nenhuma operação encontrada"
              description="Não há operações que correspondam aos filtros selecionados."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Erros</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOperations.map(operation => (
                    <TableRow key={operation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(operation.type)}
                          <span className="capitalize">
                            {operation.type === 'import' ? 'Importação' : 'Exportação'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{operation.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(operation.status)}
                          {getStatusBadge(operation.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{operation.recordsProcessed}</Badge>
                      </TableCell>
                      <TableCell>
                        {operation.errors > 0 ? (
                          <Badge variant="destructive">{operation.errors}</Badge>
                        ) : (
                          <Badge variant="secondary">0</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{operation.format}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(operation.createdAt)}</TableCell>
                      <TableCell className="text-sm">{operation.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas Resumidas */}
      {filteredOperations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Sucessos</p>
                  <p className="text-2xl font-bold">
                    {filteredOperations.filter(op => op.status === 'success').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avisos</p>
                  <p className="text-2xl font-bold">
                    {filteredOperations.filter(op => op.status === 'warning').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Erros</p>
                  <p className="text-2xl font-bold">{filteredOperations.filter(op => op.status === 'error').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">
                    {filteredOperations.reduce((acc, op) => acc + op.recordsProcessed, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
