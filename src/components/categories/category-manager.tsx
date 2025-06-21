'use client'

import { useState } from 'react'
import { type CategoryWithRelations } from '@/types/category'
import { CategoryList } from './category-list'
import { CategoryModal } from './category-modal'

interface CategoryManagerProps {
  type?: 'INCOME' | 'EXPENSE'
  className?: string
}

export function CategoryManager({
  type,
  className,
}: CategoryManagerProps) {
  const [modalState, setModalState] = useState<{
    open: boolean
    category?: CategoryWithRelations
    parentId?: string
    type?: 'INCOME' | 'EXPENSE'
  }>({
    open: false,
  })

  const handleCreateCategory = () => {
    setModalState({
      open: true,
      type,
    })
  }

  const handleEditCategory = (category: CategoryWithRelations) => {
    setModalState({
      open: true,
      category,
    })
  }

  const handleCreateSubcategory = (parentCategory: CategoryWithRelations) => {
    setModalState({
      open: true,
      parentId: parentCategory.id,
      type: parentCategory.type as 'INCOME' | 'EXPENSE',
    })
  }

  const handleCloseModal = () => {
    setModalState({
      open: false,
    })
  }

  return (
    <div className={className}>
      <CategoryList
        onCreateCategory={handleCreateCategory}
        onEditCategory={handleEditCategory}
        onCreateSubcategory={handleCreateSubcategory}
        type={type}
      />
      
      <CategoryModal
        open={modalState.open}
        onOpenChange={handleCloseModal}
        category={modalState.category}
        parentId={modalState.parentId}
        type={modalState.type}
      />
    </div>
  )
} 