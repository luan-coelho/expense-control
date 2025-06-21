import { z } from 'zod'
import { Space, NewSpace } from '@/db/schema'

// Schema de validação para criação de espaço
export const createSpaceSchema = z.object({
  name: z
    .string()
    .min(1, 'O nome é obrigatório')
    .max(100, 'O nome deve ter no máximo 100 caracteres')
    .trim()
    .refine(
      (val) => val.length >= 2,
      'O nome deve ter pelo menos 2 caracteres'
    )
    .refine(
      (val) => /^[a-zA-ZÀ-ÿ0-9\s\-_()]+$/.test(val),
      'O nome pode conter apenas letras, números, espaços e os caracteres: - _ ( )'
    )
    .refine(
      (val) => !val.startsWith(' ') && !val.endsWith(' '),
      'O nome não pode começar ou terminar com espaços'
    )
    .refine(
      (val) => !/\s{2,}/.test(val),
      'O nome não pode conter espaços consecutivos'
    ),
})

// Schema para atualização de espaço
export const updateSpaceSchema = createSpaceSchema.partial()

// Schema para filtros de espaço
export const spaceFiltersSchema = z.object({
  search: z
    .string()
    .max(100, 'O termo de busca deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
})

// Schema para validação de ID de espaço
export const spaceIdSchema = z.object({
  id: z.string().uuid('ID do espaço inválido'),
})

// Schema para validação de parâmetros de consulta
export const spaceQuerySchema = z.object({
  page: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 1)
    .refine((val) => val > 0, 'A página deve ser um número positivo'),
  limit: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 50)
    .refine(
      (val) => val > 0 && val <= 100,
      'O limite deve ser entre 1 e 100'
    ),
  search: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ? val.trim() : undefined)
    .refine(
      (val) => !val || val.length <= 100,
      'O termo de busca deve ter no máximo 100 caracteres'
    ),
})

// Tipos derivados dos schemas
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>
export type SpaceFilters = z.infer<typeof spaceFiltersSchema>
export type SpaceId = z.infer<typeof spaceIdSchema>
export type SpaceQuery = z.infer<typeof spaceQuerySchema>

// Tipo para espaço com relacionamentos
export type SpaceWithRelations = Space & {
  user: {
    id: string
    name: string | null
  } | null
}

// Tipo para resposta paginada
export type PaginatedSpaces = {
  spaces: SpaceWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Utilitários de validação
export function sanitizeSpaceName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Substitui múltiplos espaços por um só
    .replace(/[^\w\sÀ-ÿ\-_()]/g, '') // Remove caracteres especiais não permitidos
}

export function validateSpaceNameUniqueness(
  name: string,
  existingNames: string[],
  excludeId?: string
): boolean {
  const normalizedName = name.toLowerCase().trim()
  return !existingNames
    .filter((_, index) => excludeId ? index.toString() !== excludeId : true)
    .some((existingName) => existingName.toLowerCase().trim() === normalizedName)
}

// Constantes de validação
export const SPACE_VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  SEARCH_MAX_LENGTH: 100,
  MAX_LIMIT: 100,
  DEFAULT_LIMIT: 50,
  ALLOWED_NAME_PATTERN: /^[a-zA-ZÀ-ÿ0-9\s\-_()]+$/,
} as const 