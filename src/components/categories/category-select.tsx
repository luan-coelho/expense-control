'use client'

import { useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { type CategoryWithRelations } from '@/types/category'
import { useRootCategories } from '@/hooks'

interface CategorySelectProps {
  value?: string
  onValueChange: (value: string | undefined) => void
  type?: 'INCOME' | 'EXPENSE'
  placeholder?: string
  disabled?: boolean
  className?: string
  allowClear?: boolean
}

export function CategorySelect({
  value,
  onValueChange,
  type,
  placeholder = 'Selecione uma categoria...',
  disabled = false,
  className,
  allowClear = true,
}: CategorySelectProps) {
  // Buscar categorias raiz (incluindo suas subcategorias)
  const { data: rootCategories = [], isLoading } = useRootCategories(type)

  // Flatten all categories (root + children) para exibir em lista simples
  const allCategories = useMemo(() => {
    const categories: Array<{ category: CategoryWithRelations; level: number }> = []

    rootCategories.forEach(category => {
      // Adicionar categoria raiz
      categories.push({ category, level: 0 })

      // Adicionar subcategorias se existirem
      if (category.children && category.children.length > 0) {
        category.children.forEach(child => {
          categories.push({ category: child as CategoryWithRelations, level: 1 })
        })
      }
    })

    return categories
  }, [rootCategories])

  const handleValueChange = (newValue: string) => {
    if (newValue === 'clear') {
      onValueChange(undefined)
    } else {
      onValueChange(newValue)
    }
  }

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Carregando categorias..." />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select value={value || ''} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* Opção para limpar seleção */}
        {allowClear && value && (
          <SelectItem value="clear" className="text-muted-foreground">
            Limpar seleção
          </SelectItem>
        )}

        {allCategories.length === 0 ? (
          <SelectItem value="empty" disabled>
            Nenhuma categoria encontrada
          </SelectItem>
        ) : (
          allCategories.map(item => (
            <SelectItem key={item.category.id} value={item.category.id}>
              <div className="flex items-center gap-2 w-full">
                {/* Indentação para subcategorias */}
                {item.level === 1 && <span className="w-4" />}

                {/* Ícone da categoria */}
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0"
                  style={{ backgroundColor: item.category.color || '#6B7280' }}>
                  {item.category.icon || '📁'}
                </span>

                {/* Nome da categoria */}
                <span className="flex-1 truncate">
                  {item.level === 1 && '└ '}
                  {item.category.name}
                </span>

                {/* Badges */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.category.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      Sistema
                    </Badge>
                  )}

                  {item.level === 0 && item.category.children && item.category.children.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {item.category.children.length}
                    </Badge>
                  )}
                </div>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
