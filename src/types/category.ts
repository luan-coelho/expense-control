import { Category } from '@/db/schema'
import { z } from 'zod'

// Enum para tipos de categoria
export const CategoryType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const

export type CategoryTypeEnum = (typeof CategoryType)[keyof typeof CategoryType]

// Schema de validação para criação de categoria
export const createCategorySchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório').max(100, 'O nome deve ter no máximo 100 caracteres'),
  type: z.enum(['INCOME', 'EXPENSE'], {
    required_error: 'O tipo da categoria é obrigatório',
  }),
  icon: z.string().max(50, 'O ícone deve ter no máximo 50 caracteres').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'A cor deve estar no formato hexadecimal (#RRGGBB)')
    .optional(),
  parentId: z.string().uuid('Categoria pai inválida').optional().nullable(),
  sortOrder: z.string().max(10, 'A ordem deve ter no máximo 10 caracteres').optional(),
})

// Schema para atualização de categoria
export const updateCategorySchema = createCategorySchema.partial()

// Schema para filtros de categoria
export const categoryFiltersSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  isDefault: z.boolean().optional(),
  parentId: z.string().uuid().optional().nullable(),
  search: z.string().optional(),
})

// Schema para validação de parâmetros de consulta
export const categoryQuerySchema = z.object({
  page: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1))
    .refine(val => val > 0, 'A página deve ser um número positivo'),
  limit: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 50))
    .refine(val => val > 0 && val <= 100, 'O limite deve ser entre 1 e 100'),
  type: z.enum(['INCOME', 'EXPENSE']).nullable().optional(),
  isDefault: z
    .string()
    .nullable()
    .optional()
    .transform(val => {
      if (!val) return undefined
      return val.toLowerCase() === 'true'
    }),
  parentId: z
    .string()
    .nullable()
    .optional()
    .refine(val => !val || z.string().uuid().safeParse(val).success, 'ID da categoria pai inválido'),
  search: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val ? val.trim() : undefined))
    .refine(val => !val || val.length <= 100, 'O termo de busca deve ter no máximo 100 caracteres'),
})

// Tipos derivados dos schemas
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CategoryFilters = z.infer<typeof categoryFiltersSchema>
export type CategoryQuery = z.infer<typeof categoryQuerySchema>

// Tipo para categoria com relacionamentos
export type CategoryWithRelations = Category & {
  user?: {
    id: string
    name: string | null
  } | null
  parent?: {
    id: string
    name: string
    icon?: string | null
  } | null
  children?: {
    id: string
    name: string
    icon?: string | null
    color?: string | null
  }[]
}

// Tipo para categoria hierárquica (com filhos aninhados)
export type CategoryWithChildren = Category & {
  children?: CategoryWithChildren[]
}

// Tipo para resposta paginada
export type PaginatedCategories = {
  categories: CategoryWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Utilitário para organizar categorias em hierarquia
export function organizeCategoriesHierarchy(categories: Category[]): CategoryWithChildren[] {
  const categoryMap = new Map<string, CategoryWithChildren>()
  const rootCategories: CategoryWithChildren[] = []

  // Criar mapa de categorias
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] })
  })

  // Organizar hierarquia
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)!

    if (category.parentId) {
      const parent = categoryMap.get(category.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(categoryWithChildren)
      } else {
        // Se o pai não existe, adiciona como raiz
        rootCategories.push(categoryWithChildren)
      }
    } else {
      rootCategories.push(categoryWithChildren)
    }
  })

  return rootCategories
}

// Utilitário para filtrar categorias por tipo
export function filterCategoriesByType(categories: Category[], type: CategoryTypeEnum): Category[] {
  return categories.filter(category => category.type === type)
}

// Utilitário para obter categorias disponíveis para um usuário
export function getAvailableCategories(categories: Category[], userId?: string): Category[] {
  return categories.filter(category => category.isDefault || category.userId === userId)
}
