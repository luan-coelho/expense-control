'use client'

import { Suspense, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SpaceList, SpaceForm } from '@/components/spaces'
import { useSpaces } from '@/hooks/use-spaces'
import { type SpaceWithRelations } from '@/types/space'
import { Building2, Plus } from 'lucide-react'

function SpaceStats() {
  const { data, isLoading } = useSpaces({ limit: 1000 }) // Buscar todos para estatísticas

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const spaces = data?.spaces || []
  const totalSpaces = spaces.length
  const recentSpaces = spaces.filter(space => {
    const createdAt = new Date(space.createdAt)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return createdAt >= sevenDaysAgo
  }).length

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Total de Espaços</h3>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSpaces}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Novos (7 dias)</h3>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{recentSpaces}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">Ativo</div>
        </CardContent>
      </Card>
    </div>
  )
}

function SpaceManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<SpaceWithRelations | null>(null)

  const handleAdd = () => {
    setSelectedSpace(null)
    setIsCreateDialogOpen(true)
  }

  const handleEdit = (space: SpaceWithRelations) => {
    setSelectedSpace(space)
    setIsEditDialogOpen(true)
  }

  const handleSuccess = () => {
    setIsCreateDialogOpen(false)
    setIsEditDialogOpen(false)
    setSelectedSpace(null)
  }

  const handleCancel = () => {
    setIsCreateDialogOpen(false)
    setIsEditDialogOpen(false)
    setSelectedSpace(null)
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <SpaceStats />

      {/* Lista de espaços */}
      <SpaceList onAdd={handleAdd} onEdit={handleEdit} />

      {/* Dialog para criar espaço */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Espaço</DialogTitle>
          </DialogHeader>
          <SpaceForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </DialogContent>
      </Dialog>

      {/* Dialog para editar espaço */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Espaço</DialogTitle>
          </DialogHeader>
          <SpaceForm 
            space={selectedSpace || undefined} 
            onSuccess={handleSuccess} 
            onCancel={handleCancel} 
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SpaceManagerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Estatísticas skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function SpacesPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Espaços</h1>
          <p className="text-muted-foreground">
            Organize suas finanças em diferentes espaços de vida
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="h-5 w-5" />
          <span className="text-sm">Gerencie seus espaços</span>
        </div>
      </div>

      {/* Space Manager */}
      <Suspense fallback={<SpaceManagerSkeleton />}>
        <SpaceManager />
      </Suspense>
    </div>
  )
} 