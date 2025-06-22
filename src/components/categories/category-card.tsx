'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit, Trash2, Plus, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type CategoryWithRelations } from '@/types/category'
import { useDeleteCategory } from '@/hooks'

interface CategoryCardProps {
  category: CategoryWithRelations
  onEdit?: (category: CategoryWithRelations) => void
  onCreateSubcategory?: (parentCategory: CategoryWithRelations) => void
  showActions?: boolean
  showType?: boolean
  className?: string
}

export function CategoryCard({
  category,
  onEdit,
  onCreateSubcategory,
  showActions = true,
  showType = true,
  className,
}: CategoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteCategory = useDeleteCategory()

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteCategory.mutateAsync(category.id)
    } catch (error) {
      // O erro já é tratado pelo hook
      console.error('Erro ao excluir categoria:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const isSystemCategory = category.isDefault && !category.user?.id
  const canEdit = !isSystemCategory
  const canDelete = !isSystemCategory
  const hasActions = (canEdit && onEdit) || canDelete || onCreateSubcategory

  return (
    <Card
      className={`relative transition-all hover:shadow-md ${
        isSystemCategory ? 'border-muted-foreground/20 bg-muted/20' : 'hover:border-primary/50'
      } ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Ícone da categoria */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium text-white relative ${
                isSystemCategory ? 'ring-2 ring-muted-foreground/30' : ''
              }`}
              style={{ backgroundColor: category.color || '#6B7280' }}>
              {category.icon || '📁'}
              {isSystemCategory && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-muted-foreground rounded-full flex items-center justify-center">
                  <Lock className="h-2 w-2 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{category.name}</h3>
                {isSystemCategory && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Categoria predefinida do sistema</p>
                      <p className="text-xs text-muted-foreground">Não pode ser editada ou excluída</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              {showType && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={category.type === 'INCOME' ? 'default' : 'secondary'} className="text-xs">
                    {category.type === 'INCOME' ? 'Receita' : 'Despesa'}
                  </Badge>
                  {isSystemCategory && (
                    <Badge variant="outline" className="text-xs border-muted-foreground/50 text-muted-foreground">
                      Sistema
                    </Badge>
                  )}
                  {!isSystemCategory && category.user?.id && (
                    <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                      Personalizada
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Menu de ações */}
          {showActions && hasActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onCreateSubcategory && (
                  <>
                    <DropdownMenuItem onClick={() => onCreateSubcategory(category)} className="cursor-pointer">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Subcategoria
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {canEdit && onEdit ? (
                  <DropdownMenuItem onClick={() => onEdit(category)} className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Categorias do sistema não podem ser editadas</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {canDelete ? (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="cursor-pointer text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? 'Excluindo...' : 'Excluir'}
                  </DropdownMenuItem>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Categorias do sistema não podem ser excluídas</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      {/* Subcategorias (se existirem) */}
      {category.children && category.children.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Subcategorias ({category.children.length})</p>
            <div className="flex flex-wrap gap-1">
              {category.children.slice(0, 3).map(child => (
                <Badge
                  key={child.id}
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: child.color || '#6B7280' }}>
                  {child.icon} {child.name}
                </Badge>
              ))}
              {category.children.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{category.children.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
