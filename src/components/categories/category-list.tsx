'use client'

import { useState } from 'react'
import { Search, Plus, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { type CategoryWithRelations, type CategoryFilters } from '@/types/category'
import { useCategories, useSearchCategories } from '@/hooks'
import { CategoryCard } from './category-card'

interface CategoryListProps {
  onCreateCategory?: () => void
  onEditCategory?: (category: CategoryWithRelations) => void
  onCreateSubcategory?: (parentCategory: CategoryWithRelations) => void
  showActions?: boolean
  type?: 'INCOME' | 'EXPENSE'
  className?: string
}

export function CategoryList({
  onCreateCategory,
  onEditCategory,
  onCreateSubcategory,
  showActions = true,
  type,
  className,
}: CategoryListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<CategoryFilters>({
    type,
  })

  // Usar busca se houver termo de pesquisa, senão usar lista normal
  const shouldSearch = searchTerm.trim().length > 0
  
  const {
    data: searchResults = [],
    isLoading: isSearching
  } = useSearchCategories(searchTerm, filters.type, shouldSearch)

  const {
    data: categoriesData,
    isLoading: isLoadingCategories
  } = useCategories({
    filters,
    enabled: !shouldSearch,
  })

  const categories = shouldSearch ? searchResults : (categoriesData?.categories || [])
  const isLoading = shouldSearch ? isSearching : isLoadingCategories

  const handleFilterChange = (key: keyof CategoryFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }))
  }

  const clearFilters = () => {
    setFilters({ type })
    setSearchTerm('')
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== type
  ) || searchTerm.length > 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com busca e filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar categorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          {/* Filtro por tipo */}
          {!type && (
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => handleFilterChange('type', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="INCOME">Receitas</SelectItem>
                <SelectItem value="EXPENSE">Despesas</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Filtro por origem */}
          <Select
            value={filters.isDefault === undefined ? 'all' : filters.isDefault.toString()}
            onValueChange={(value) => handleFilterChange('isDefault', 
              value === 'all' ? undefined : value === 'true'
            )}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="true">Sistema</SelectItem>
              <SelectItem value="false">Personalizadas</SelectItem>
            </SelectContent>
          </Select>

          {/* Limpar filtros */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="px-3"
            >
              <Filter className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Botão criar categoria */}
        {onCreateCategory && (
          <Button onClick={onCreateCategory} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        )}
      </div>

      {/* Indicadores de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary">
              Busca: "{searchTerm}"
            </Badge>
          )}
          {filters.type && (
            <Badge variant="secondary">
              Tipo: {filters.type === 'INCOME' ? 'Receitas' : 'Despesas'}
            </Badge>
          )}
          {filters.isDefault !== undefined && (
            <Badge variant="secondary">
              {filters.isDefault ? 'Categorias do Sistema' : 'Categorias Personalizadas'}
            </Badge>
          )}
        </div>
      )}

      {/* Lista de categorias */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-muted rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-lg mb-2">
            {searchTerm || hasActiveFilters 
              ? 'Nenhuma categoria encontrada'
              : 'Nenhuma categoria criada ainda'
            }
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            {searchTerm || hasActiveFilters
              ? 'Tente ajustar os filtros ou termo de busca'
              : 'Crie sua primeira categoria para começar a organizar suas transações'
            }
          </div>
          {onCreateCategory && !searchTerm && !hasActiveFilters && (
            <Button onClick={onCreateCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Categoria
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {categories.map((category: CategoryWithRelations) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={onEditCategory}
              onCreateSubcategory={onCreateSubcategory}
              showActions={showActions}
              showType={!type} // Só mostrar tipo se não estiver filtrado por tipo
            />
          ))}
        </div>
      )}

      {/* Informações de resultados */}
      {!isLoading && categories.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {shouldSearch 
            ? `${categories.length} categoria(s) encontrada(s)`
            : `Total: ${categories.length} categoria(s)`
          }
        </div>
      )}
    </div>
  )
} 