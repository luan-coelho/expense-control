import { z } from 'zod'
import { Account, NewAccount } from '@/db/schema'

// Enum para tipos de conta
export const AccountType = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  CREDIT_CARD: 'CREDIT_CARD',
  INVESTMENT: 'INVESTMENT',
  CASH: 'CASH',
  OTHER: 'OTHER',
} as const

export type AccountTypeEnum = typeof AccountType[keyof typeof AccountType]

// Schema de validação para criação de conta
export const createAccountSchema = z.object({
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
      (val) => /^[a-zA-ZÀ-ÿ0-9\s\-_()\.]+$/.test(val),
      'O nome pode conter apenas letras, números, espaços e os caracteres: - _ ( ) .'
    )
    .refine(
      (val) => !val.startsWith(' ') && !val.endsWith(' '),
      'O nome não pode começar ou terminar com espaços'
    )
    .refine(
      (val) => !/\s{2,}/.test(val),
      'O nome não pode conter espaços consecutivos'
    ),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CASH', 'OTHER'], {
    required_error: 'O tipo da conta é obrigatório',
    invalid_type_error: 'Tipo de conta inválido',
  }).refine(
    (val) => Object.values(AccountType).includes(val as AccountTypeEnum),
    'Tipo de conta não suportado'
  ),
})

// Schema para atualização de conta
export const updateAccountSchema = createAccountSchema.partial()

// Schema para filtros de conta
export const accountFiltersSchema = z.object({
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CASH', 'OTHER'])
    .optional()
    .refine(
      (val) => !val || Object.values(AccountType).includes(val as AccountTypeEnum),
      'Tipo de conta não suportado para filtro'
    ),
  search: z
    .string()
    .max(100, 'O termo de busca deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
})

// Schema para validação de ID de conta
export const accountIdSchema = z.object({
  id: z.string().uuid('ID da conta inválido'),
})

// Schema para validação de parâmetros de consulta
export const accountQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, 'A página deve ser um número positivo'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .refine(
      (val) => val > 0 && val <= 100,
      'O limite deve ser entre 1 e 100'
    ),
  type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'CASH', 'OTHER'])
    .optional()
    .refine(
      (val) => !val || Object.values(AccountType).includes(val as AccountTypeEnum),
      'Tipo de conta não suportado para filtro'
    ),
  search: z
    .string()
    .max(100, 'O termo de busca deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
})

// Tipos derivados dos schemas
export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type AccountFilters = z.infer<typeof accountFiltersSchema>
export type AccountId = z.infer<typeof accountIdSchema>
export type AccountQuery = z.infer<typeof accountQuerySchema>

// Tipo para conta com relacionamentos
export type AccountWithRelations = Account & {
  user: {
    id: string
    name: string | null
  } | null
}

// Tipo para resposta paginada
export type PaginatedAccounts = {
  accounts: AccountWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Utilitário para obter label do tipo de conta
export function getAccountTypeLabel(type: AccountTypeEnum): string {
  const labels = {
    CHECKING: 'Conta Corrente',
    SAVINGS: 'Poupança',
    CREDIT_CARD: 'Cartão de Crédito',
    INVESTMENT: 'Investimento',
    CASH: 'Dinheiro',
    OTHER: 'Outro',
  }
  return labels[type] || type
}

// Utilitários de validação
export function sanitizeAccountName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Substitui múltiplos espaços por um só
    .replace(/[^\w\sÀ-ÿ\-_().]/g, '') // Remove caracteres especiais não permitidos
}

export function validateAccountNameUniqueness(
  name: string,
  existingNames: string[],
  excludeId?: string
): boolean {
  const normalizedName = name.toLowerCase().trim()
  return !existingNames
    .filter((_, index) => excludeId ? index.toString() !== excludeId : true)
    .some((existingName) => existingName.toLowerCase().trim() === normalizedName)
}

export function isValidAccountType(type: string): type is AccountTypeEnum {
  return Object.values(AccountType).includes(type as AccountTypeEnum)
}

export function getAccountTypeIcon(type: AccountTypeEnum): string {
  const icons = {
    CHECKING: '🏦',
    SAVINGS: '💰',
    CREDIT_CARD: '💳',
    INVESTMENT: '📈',
    CASH: '💵',
    OTHER: '📁',
  }
  return icons[type] || '📁'
}

export function getAccountTypesForSelect(): Array<{ value: AccountTypeEnum; label: string; icon: string }> {
  return Object.values(AccountType).map((type) => ({
    value: type,
    label: getAccountTypeLabel(type),
    icon: getAccountTypeIcon(type),
  }))
}

// Constantes de validação
export const ACCOUNT_VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  SEARCH_MAX_LENGTH: 100,
  MAX_LIMIT: 100,
  DEFAULT_LIMIT: 50,
  ALLOWED_NAME_PATTERN: /^[a-zA-ZÀ-ÿ0-9\s\-_()\.]+$/,
  SUPPORTED_TYPES: Object.values(AccountType),
} as const 