'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type CategoryWithRelations } from '@/types/category'
import { CategoryForm } from './category-form'

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: CategoryWithRelations
  parentId?: string
  type?: 'INCOME' | 'EXPENSE'
}

export function CategoryModal({
  open,
  onOpenChange,
  category,
  parentId,
  type,
}: CategoryModalProps) {
  const isEditing = !!category
  const isCreatingSubcategory = !!parentId

  const getTitle = () => {
    if (isEditing) {
      return 'Editar Categoria'
    }
    if (isCreatingSubcategory) {
      return 'Nova Subcategoria'
    }
    return 'Nova Categoria'
  }

  const handleSuccess = (savedCategory: CategoryWithRelations) => {
    onOpenChange(false)
    // O toast de sucesso já é exibido pelos hooks
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <CategoryForm
          category={category}
          parentId={parentId}
          type={type}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          className="mt-4"
        />
      </DialogContent>
    </Dialog>
  )
} 