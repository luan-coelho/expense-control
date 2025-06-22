'use client'

import { useState } from 'react'
import { Edit, Trash2, Plus, AlertCircle, CreditCard, Search, Filter, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { useAccounts, useDeleteAccount } from '@/hooks'
import { type AccountWithRelations, type AccountTypeEnum } from '@/types/account'

interface AccountListProps {
  onEdit?: (account: AccountWithRelations) => void
  onAdd?: () => void
  className?: string
}

// Mapeamento de tipos de conta para labels em português
const accountTypeLabels: Record<AccountTypeEnum, string> = {
  CHECKING: 'Conta Corrente',
  SAVINGS: 'Poupança',
  CREDIT_CARD: 'Cartão de Crédito',
  INVESTMENT: 'Investimento',
  CASH: 'Dinheiro',
  OTHER: 'Outro',
}

// Cores para os badges de tipo de conta
const accountTypeColors: Record<AccountTypeEnum, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CHECKING: 'default',
  SAVINGS: 'secondary',
  CREDIT_CARD: 'destructive',
  INVESTMENT: 'outline',
  CASH: 'secondary',
  OTHER: 'outline',
}

export function AccountList({ onEdit, onAdd, className }: AccountListProps) {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<AccountTypeEnum | 'all'>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<AccountWithRelations | null>(null)

  const queryParams = {
    page,
    limit: 12, // 12 para grid 3x4
    filters: {
      ...(searchTerm && { search: searchTerm }),
      ...(typeFilter !== 'all' && { type: typeFilter }),
    },
  }

  const { data, isLoading, error } = useAccounts(queryParams)

  const deleteMutation = useDeleteAccount()

  const handleDeleteClick = (account: AccountWithRelations) => {
    setAccountToDelete(account)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return

    try {
      await deleteMutation.mutateAsync(accountToDelete.id)
      setDeleteDialogOpen(false)
      setAccountToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir conta:', error)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setTypeFilter('all')
    setPage(1) // Reset para primeira página ao limpar filtros
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(1) // Reset para primeira página ao buscar
  }

  const handleTypeFilterChange = (value: AccountTypeEnum | 'all') => {
    setTypeFilter(value)
    setPage(1) // Reset para primeira página ao filtrar
  }

  const hasActiveFilters = searchTerm.length > 0 || typeFilter !== 'all'

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <EmptyState
          icon={<AlertCircle />}
          title="Erro ao carregar contas"
          description="Ocorreu um erro ao carregar as contas. Tente novamente."
          action={
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          }
        />
      </div>
    )
  }

  const accounts = data?.accounts || []

  if (accounts.length === 0 && !hasActiveFilters) {
    return (
      <div className={className}>
        <EmptyState
          icon={<CreditCard />}
          title="Nenhuma conta encontrada"
          description="Crie sua primeira conta para gerenciar suas transações."
          action={
            onAdd ? (
              <Button onClick={onAdd} variant="default" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Criar Conta
              </Button>
            ) : undefined
          }
        />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar contas..."
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          {/* Filtro por tipo */}
          <Select value={typeFilter} onValueChange={value => handleTypeFilterChange(value as AccountTypeEnum | 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="CHECKING">Conta Corrente</SelectItem>
              <SelectItem value="SAVINGS">Poupança</SelectItem>
              <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
              <SelectItem value="INVESTMENT">Investimento</SelectItem>
              <SelectItem value="CASH">Dinheiro</SelectItem>
              <SelectItem value="OTHER">Outro</SelectItem>
            </SelectContent>
          </Select>

          {/* Limpar filtros */}
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="px-3">
              <Filter className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Botão criar conta */}
        {onAdd && (
          <Button onClick={onAdd} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        )}
      </div>

      {/* Indicadores de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && <Badge variant="secondary">Busca: "{searchTerm}"</Badge>}
          {typeFilter !== 'all' && <Badge variant="secondary">Tipo: {accountTypeLabels[typeFilter]}</Badge>}
        </div>
      )}

      {/* Lista de contas */}
      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-lg mb-2">Nenhuma conta encontrada</div>
          <div className="text-sm text-muted-foreground mb-4">Tente ajustar os filtros ou termo de busca</div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Contas ({data?.pagination?.total || accounts.length})</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map(account => (
              <Card key={account.id} className="relative hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {account.name}
                    </CardTitle>
                    <Badge variant={accountTypeColors[account.type as AccountTypeEnum]}>
                      {accountTypeLabels[account.type as AccountTypeEnum]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Criado em {new Date(account.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex gap-1">
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(account)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(account)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Página {data.pagination.page} de {data.pagination.totalPages}({data.pagination.total} contas)
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

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conta "{accountToDelete?.name}"? Esta ação não pode ser desfeita.
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
