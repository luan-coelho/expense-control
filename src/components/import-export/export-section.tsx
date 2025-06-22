'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { useExportData } from '@/hooks/use-import-export'
import { useCategories } from '@/hooks/use-categories'
import { useAccounts } from '@/hooks/use-accounts'
import { useSpaces } from '@/hooks/use-spaces'
import { ExportOptions } from '@/services/import-export.service'
import { Download, FileText, Database, BarChart3 } from 'lucide-react'

export function ExportSection() {
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [type, setType] = useState<'transactions' | 'full-backup' | 'report'>('transactions')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([])
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE' | 'all'>('all')

  const exportMutation = useExportData()
  const { data: categories } = useCategories()
  const { data: accounts } = useAccounts()
  const { data: spaces } = useSpaces()

  function handleExport() {
    const options: ExportOptions = {
      format,
      type,
      filters: {
        startDate: startDate?.toISOString().split('T')[0],
        endDate: endDate?.toISOString().split('T')[0],
        categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
        accountIds: selectedAccounts.length > 0 ? selectedAccounts : undefined,
        spaceIds: selectedSpaces.length > 0 ? selectedSpaces : undefined,
        type: transactionType,
      },
    }

    exportMutation.mutate(options)
  }

  function handleCategoryToggle(categoryId: string, checked: boolean) {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId])
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId))
    }
  }

  function handleAccountToggle(accountId: string, checked: boolean) {
    if (checked) {
      setSelectedAccounts(prev => [...prev, accountId])
    } else {
      setSelectedAccounts(prev => prev.filter(id => id !== accountId))
    }
  }

  function handleSpaceToggle(spaceId: string, checked: boolean) {
    if (checked) {
      setSelectedSpaces(prev => [...prev, spaceId])
    } else {
      setSelectedSpaces(prev => prev.filter(id => id !== spaceId))
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tipos de Exportação */}
        <Card
          className={`cursor-pointer transition-colors ${type === 'transactions' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setType('transactions')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              Transações
            </CardTitle>
            <CardDescription className="text-xs">Exportar lista de transações com filtros</CardDescription>
          </CardHeader>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${type === 'report' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setType('report')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Relatório
            </CardTitle>
            <CardDescription className="text-xs">Relatório financeiro com resumo</CardDescription>
          </CardHeader>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${type === 'full-backup' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setType('full-backup')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4" />
              Backup Completo
            </CardTitle>
            <CardDescription className="text-xs">Backup de todos os dados</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configurações */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="format">Formato do Arquivo</Label>
            <Select value={format} onValueChange={(value: 'csv' | 'json') => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="transaction-type">Tipo de Transação</Label>
            <Select
              value={transactionType}
              onValueChange={(value: 'INCOME' | 'EXPENSE' | 'all') => setTransactionType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="INCOME">Receitas</SelectItem>
                <SelectItem value="EXPENSE">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data Inicial</Label>
              <DatePicker date={startDate} onSelect={setStartDate} placeholder="Selecionar data" />
            </div>
            <div>
              <Label>Data Final</Label>
              <DatePicker date={endDate} onSelect={setEndDate} placeholder="Selecionar data" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="space-y-4">
          {/* Categorias */}
          <div>
            <Label className="text-sm font-medium">Categorias</Label>
            <div className="max-h-32 overflow-y-auto space-y-2 mt-2 border rounded-md p-3">
              {categories?.categories?.map(category => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={checked => handleCategoryToggle(category.id, checked as boolean)}
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Contas */}
          <div>
            <Label className="text-sm font-medium">Contas</Label>
            <div className="max-h-32 overflow-y-auto space-y-2 mt-2 border rounded-md p-3">
              {accounts?.accounts?.map(account => (
                <div key={account.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`account-${account.id}`}
                    checked={selectedAccounts.includes(account.id)}
                    onCheckedChange={checked => handleAccountToggle(account.id, checked as boolean)}
                  />
                  <label
                    htmlFor={`account-${account.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {account.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Espaços */}
          <div>
            <Label className="text-sm font-medium">Espaços</Label>
            <div className="max-h-32 overflow-y-auto space-y-2 mt-2 border rounded-md p-3">
              {spaces?.spaces?.map(space => (
                <div key={space.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`space-${space.id}`}
                    checked={selectedSpaces.includes(space.id)}
                    onCheckedChange={checked => handleSpaceToggle(space.id, checked as boolean)}
                  />
                  <label
                    htmlFor={`space-${space.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {space.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleExport} disabled={exportMutation.isPending} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          {exportMutation.isPending ? 'Exportando...' : 'Exportar'}
        </Button>
      </div>
    </div>
  )
}
