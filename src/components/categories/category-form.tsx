'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type CategoryWithRelations,
} from '@/types/category'
import { useCreateCategory, useUpdateCategory, useRootCategories } from '@/hooks'
import { CategorySelect } from './category-select'

// Ícones predefinidos para categorias
const CATEGORY_ICONS = [
  '💰',
  '💸',
  '🏠',
  '🚗',
  '🍔',
  '🛒',
  '⚡',
  '💊',
  '🎓',
  '🎬',
  '✈️',
  '🏋️',
  '👕',
  '💻',
  '📱',
  '🎵',
  '🎮',
  '📚',
  '🍕',
  '☕',
  '🎁',
  '💳',
  '🏦',
  '📈',
  '💼',
  '🔧',
  '🎨',
  '🌟',
  '📊',
  '🎯',
]

// Cores predefinidas para categorias
const CATEGORY_COLORS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#84CC16',
  '#22C55E',
  '#10B981',
  '#14B8A6',
  '#06B6D4',
  '#0EA5E9',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#A855F7',
  '#C026D3',
  '#EC4899',
  '#F43F5E',
  '#6B7280',
]

interface CategoryFormProps {
  category?: CategoryWithRelations
  onSuccess?: (category: CategoryWithRelations) => void
  onCancel?: () => void
  parentId?: string
  type?: 'INCOME' | 'EXPENSE'
  className?: string
}

export function CategoryForm({ category, onSuccess, onCancel, parentId, type, className }: CategoryFormProps) {
  const [selectedIcon, setSelectedIcon] = useState(category?.icon || '📁')
  const [selectedColor, setSelectedColor] = useState(category?.color || '#6B7280')

  const isEditing = !!category
  const isSystemCategory = category?.isDefault && !category?.user?.id
  const schema = isEditing ? updateCategorySchema : createCategorySchema

  const form = useForm<CreateCategoryInput | UpdateCategoryInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name || '',
      type: (category?.type as 'INCOME' | 'EXPENSE') || type || 'EXPENSE',
      icon: category?.icon || '📁',
      color: category?.color || '#6B7280',
      parentId: category?.parentId || parentId || undefined,
    },
  })

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  // Buscar categorias raiz para seleção de pai
  const { data: rootCategories = [] } = useRootCategories(form.watch('type'))

  // Atualizar valores quando seleções mudam
  useEffect(() => {
    form.setValue('icon', selectedIcon)
  }, [selectedIcon, form])

  useEffect(() => {
    form.setValue('color', selectedColor)
  }, [selectedColor, form])

  const isLoading = createCategory.isPending || updateCategory.isPending

  const onSubmit = async (data: CreateCategoryInput | UpdateCategoryInput) => {
    // Não permitir submissão se for categoria do sistema
    if (isSystemCategory) {
      return
    }

    try {
      let result: CategoryWithRelations

      if (isEditing && category) {
        result = await updateCategory.mutateAsync({
          id: category.id,
          data: data as UpdateCategoryInput,
        })
      } else {
        result = await createCategory.mutateAsync(data as CreateCategoryInput)
      }

      onSuccess?.(result)
    } catch (error) {
      // O erro já é tratado pelos hooks
      console.error('Erro ao salvar categoria:', error)
    }
  }

  // Se for categoria do sistema, mostrar aviso
  if (isSystemCategory) {
    return (
      <div className={className}>
        <Card className="border-muted-foreground/20 bg-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-5 w-5" />
              Categoria Protegida
            </CardTitle>
            <CardDescription className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              Esta é uma categoria predefinida do sistema e não pode ser editada. As categorias do sistema garantem
              consistência e são compartilhadas entre todos os usuários.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Exibir informações da categoria em modo somente leitura */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-sm">{category?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <Badge variant={category?.type === 'INCOME' ? 'default' : 'secondary'} className="text-xs">
                  {category?.type === 'INCOME' ? 'Receita' : 'Despesa'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ícone</label>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium text-white mt-1"
                  style={{ backgroundColor: category?.color || '#6B7280' }}>
                  {category?.icon || '📁'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cor</label>
                <div
                  className="w-10 h-10 rounded-full border-2 border-border mt-1"
                  style={{ backgroundColor: category?.color || '#6B7280' }}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Voltar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome da categoria */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Categoria</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Alimentação, Transporte..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo da categoria */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!!parentId} // Se tem pai, herda o tipo
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INCOME">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">
                          Receita
                        </Badge>
                        <span>Dinheiro que entra</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="EXPENSE">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Despesa
                        </Badge>
                        <span>Dinheiro que sai</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Categoria pai (apenas se não for edição e não tiver pai definido) */}
          {!isEditing && !parentId && (
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria Pai (Opcional)</FormLabel>
                  <FormControl>
                    <CategorySelect
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      type={form.watch('type')}
                      placeholder="Selecione uma categoria pai..."
                      allowClear
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Seleção de ícone */}
          <div className="space-y-3">
            <FormLabel>Ícone</FormLabel>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: selectedColor }}>
                {selectedIcon}
              </div>
              <div className="grid grid-cols-10 gap-2 flex-1">
                {CATEGORY_ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-muted transition-colors ${
                      selectedIcon === icon ? 'bg-primary text-primary-foreground' : 'bg-muted/50'
                    }`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Seleção de cor */}
          <div className="space-y-3">
            <FormLabel>Cor</FormLabel>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full border-2 border-border"
                style={{ backgroundColor: selectedColor }}
              />
              <div className="grid grid-cols-9 gap-2 flex-1">
                {CATEGORY_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      selectedColor === color ? 'border-foreground' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Cor personalizada */}
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor Personalizada (Opcional)</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={selectedColor}
                      onChange={e => setSelectedColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      placeholder="#6B7280"
                      value={selectedColor}
                      onChange={e => setSelectedColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading || isSystemCategory} className="flex-1">
              {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Categoria'}
            </Button>

            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
