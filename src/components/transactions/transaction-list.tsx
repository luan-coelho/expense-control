'use client'

import { useState, useEffect } from 'react'
import { Pencil, Trash2, Plus, Filter, Search, CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { useTransactions, useDeleteTransaction, type UseTransactionsParams } from '@/hooks/use-transactions'
import { type TransactionWithRelations, type TransactionFilters, TransactionType } from '@/types/transaction'
import { formatTransactionAmount } from '@/types/transaction'

interface TransactionListProps {
  onEdit?: (transaction: TransactionWithRelations) => void
  onAdd?: () => void
  filters?: TransactionFilters
  onFiltersChange?: (filters: TransactionFilters) => void
}

export function TransactionList({ onEdit, onAdd, filters = {}, onFiltersChange }: TransactionListProps) {
  const [page, setPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionWithRelations | null>(null)

  // Estado para os date pickers
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined,
  )
  const [endDate, setEndDate] = useState<Date | undefined>(filters.endDate ? new Date(filters.endDate) : undefined)

  // Sincronizar estado interno quando filtros externos mudarem
  useEffect(() => {
    setStartDate(filters.startDate ? new Date(filters.startDate) : undefined)
  }, [filters.startDate])

  useEffect(() => {
    setEndDate(filters.endDate ? new Date(filters.endDate) : undefined)
  }, [filters.endDate])

  const queryParams: UseTransactionsParams = {
    page,
    limit: 10,
    filters,
  }

  const { data, isLoading, error } = useTransactions(queryParams)
  const deleteMutation = useDeleteTransaction()

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    const newFilters = { ...filters }

    if (value === 'all' || value === '') {
      delete newFilters[key]
    } else {
      if (key === 'type') {
        newFilters[key] = value as 'INCOME' | 'EXPENSE'
      } else {
        newFilters[key] = value
      }
    }

    onFiltersChange?.(newFilters)
    setPage(1) // Reset para primeira página ao filtrar
  }

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date)

    const newFilters = { ...filters }

    if (date) {
      newFilters.startDate = date.toISOString().split('T')[0]
    } else {
      delete newFilters.startDate
    }

    onFiltersChange?.(newFilters)
    setPage(1) // Reset para primeira página ao filtrar
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date)

    const newFilters = { ...filters }

    if (date) {
      newFilters.endDate = date.toISOString().split('T')[0]
    } else {
      delete newFilters.endDate
    }

    onFiltersChange?.(newFilters)
    setPage(1) // Reset para primeira página ao filtrar
  }

  const handleDeleteClick = (transaction: TransactionWithRelations) => {
    setTransactionToDelete(transaction)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return

    try {
      await deleteMutation.mutateAsync(transactionToDelete.id)
      setDeleteDialogOpen(false)
      setTransactionToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
    }
  }

  const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('pt-BR')
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">Erro ao carregar transações: {error.message}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            {onAdd && (
              <Button onClick={onAdd} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Transação
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca por descrição - ocupa mais espaço */}
            <div className="flex-1 space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">
                Buscar
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por descrição..."
                  value={filters.search || ''}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  className="pl-10 w-full h-10 rounded-md"
                />
              </div>
            </div>

            {/* Filtro por tipo */}
            <div className="w-full lg:w-44 space-y-2">
              <Label htmlFor="type-filter" className="text-sm font-medium">
                Tipo
              </Label>
              <Select value={filters.type || 'all'} onValueChange={value => handleFilterChange('type', value)}>
                <SelectTrigger id="type-filter" className="w-full !h-10 rounded-md">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value={TransactionType.INCOME}>Receitas</SelectItem>
                  <SelectItem value={TransactionType.EXPENSE}>Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data inicial */}
            <div className="w-full lg:w-44 space-y-2">
              <Label htmlFor="start-date" className="flex items-center gap-2 text-sm font-medium">
                <CalendarDays className="h-4 w-4" />
                Data inicial
              </Label>
              <DatePicker
                id="start-date"
                date={startDate}
                onSelect={handleStartDateChange}
                placeholder="Data inicial"
                className="w-full h-10 rounded-md"
              />
            </div>

            {/* Data final */}
            <div className="w-full lg:w-44 space-y-2">
              <Label htmlFor="end-date" className="flex items-center gap-2 text-sm font-medium">
                <CalendarDays className="h-4 w-4" />
                Data final
              </Label>
              <DatePicker
                id="end-date"
                date={endDate}
                onSelect={handleEndDateChange}
                placeholder="Data final"
                className="w-full h-10 rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de transações */}
      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : !data?.transactions.length ? (
            <EmptyState
              icon={<Plus className="h-16 w-16" />}
              title="Nenhuma transação encontrada"
              description="Não há transações que correspondam aos filtros selecionados."
              action={
                onAdd ? (
                  <Button onClick={onAdd} variant="default" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeira transação
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="space-y-4">
                {data.transactions.map((transaction: TransactionWithRelations) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          variant={transaction.type === TransactionType.INCOME ? 'default' : 'destructive'}
                          className={
                            transaction.type === TransactionType.INCOME
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }>
                          {transaction.type === TransactionType.INCOME ? 'Receita' : 'Despesa'}
                        </Badge>
                        <span className="font-medium text-lg">{formatTransactionAmount(transaction.amount)}</span>
                      </div>

                      <div className="text-gray-900 font-medium mb-1">{transaction.description}</div>

                      <div className="text-sm text-gray-500 space-y-1">
                        <div>Data: {formatDate(transaction.date)}</div>
                        <div className="flex gap-4">
                          {transaction.category && <span>Categoria: {transaction.category.name}</span>}
                          {transaction.space && <span>Espaço: {transaction.space.name}</span>}
                          {transaction.account && <span>Conta: {transaction.account.name}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(transaction)}
                          className="flex items-center gap-1">
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(transaction)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {data.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Página {data.pagination.page} de {data.pagination.totalPages}({data.pagination.total} transações)
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={!data.pagination.hasPrev}>
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!data.pagination.hasNext}>
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a transação "{transactionToDelete?.description}"? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
