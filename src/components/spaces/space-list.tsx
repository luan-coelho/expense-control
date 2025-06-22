'use client'

import { useState } from 'react'
import { Edit, Trash2, Plus, AlertCircle, Building2, Search, Filter, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { useSpaces, useDeleteSpace } from '@/hooks'
import { type SpaceWithRelations } from '@/types/space'

interface SpaceListProps {
  onEdit?: (space: SpaceWithRelations) => void
  onAdd?: () => void
  className?: string
}

export function SpaceList({ onEdit, onAdd, className }: SpaceListProps) {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [spaceToDelete, setSpaceToDelete] = useState<SpaceWithRelations | null>(null)

  const queryParams = {
    page,
    limit: 12, // 12 para grid 3x4
    filters: searchTerm ? { search: searchTerm } : undefined,
  }

  const { data, isLoading, error } = useSpaces(queryParams)

  const deleteMutation = useDeleteSpace()

  const handleDeleteClick = (space: SpaceWithRelations) => {
    setSpaceToDelete(space)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!spaceToDelete) return

    try {
      await deleteMutation.mutateAsync(spaceToDelete.id)
      setDeleteDialogOpen(false)
      setSpaceToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir espaço:', error)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setPage(1) // Reset para primeira página ao limpar filtros
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(1) // Reset para primeira página ao buscar
  }

  const hasActiveFilters = searchTerm.length > 0

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
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
          title="Erro ao carregar espaços"
          description="Ocorreu um erro ao carregar os espaços. Tente novamente."
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

  const spaces = data?.spaces || []

  if (spaces.length === 0 && !hasActiveFilters) {
    return (
      <div className={className}>
        <EmptyState
          icon={<Building2 />}
          title="Nenhum espaço encontrado"
          description="Crie seu primeiro espaço para organizar suas finanças."
          action={
            onAdd ? (
              <Button onClick={onAdd} variant="default" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Criar Espaço
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
            placeholder="Buscar espaços..."
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          {/* Limpar filtros */}
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="px-3">
              <Filter className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Botão criar espaço */}
        {onAdd && (
          <Button onClick={onAdd} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Novo Espaço
          </Button>
        )}
      </div>

      {/* Indicadores de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && <Badge variant="secondary">Busca: "{searchTerm}"</Badge>}
        </div>
      )}

      {/* Lista de espaços */}
      {spaces.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-lg mb-2">Nenhum espaço encontrado</div>
          <div className="text-sm text-muted-foreground mb-4">Tente ajustar o termo de busca</div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Espaços ({data?.pagination?.total || spaces.length})</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {spaces.map(space => (
              <Card key={space.id} className="relative hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {space.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Criado em {new Date(space.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex gap-1">
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(space)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(space)}
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
                Página {data.pagination.page} de {data.pagination.totalPages}({data.pagination.total} espaços)
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
              Tem certeza que deseja excluir o espaço "{spaceToDelete?.name}"? Esta ação não pode ser desfeita.
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
