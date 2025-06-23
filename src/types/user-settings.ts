import { z } from 'zod'
import type { UserSettings as DBUserSettings } from '@/db/schema'

// Schema de validação para criação de configurações
export const createUserSettingsSchema = z.object({
  language: z.string().min(1, 'Idioma é obrigatório'),
  timezone: z.string().min(1, 'Fuso horário é obrigatório'),
  dateFormat: z.string().min(1, 'Formato de data é obrigatório'),
  darkMode: z.boolean(),
  
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  budgetAlerts: z.boolean(),
  lowBalanceAlerts: z.boolean(),
  monthlyReports: z.boolean(),
  notificationTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
  
  dataCollection: z.boolean(),
  analytics: z.boolean(),
  dataSharing: z.boolean(),
  twoFactorAuth: z.boolean(),
  
  autoBackup: z.boolean(),
  cloudSync: z.boolean(),
  localBackup: z.boolean(),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
  
  defaultCurrency: z.string().min(3, 'Moeda deve ter 3 caracteres').max(3),
  numberFormat: z.string().min(1, 'Formato de número é obrigatório'),
  fiscalYearStart: z.enum(['january', 'april', 'july', 'october']),
  weekStartDay: z.enum(['sunday', 'monday']),
  defaultBudgetLimit: z.string().min(1, 'Limite de orçamento é obrigatório'),
  showCents: z.boolean(),
  autoCategorizationEnabled: z.boolean(),
})

// Schema de validação para atualização de configurações
export const updateUserSettingsSchema = createUserSettingsSchema.partial()

// Tipos TypeScript derivados dos schemas
export type CreateUserSettings = z.infer<typeof createUserSettingsSchema>
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>

// Tipo para configurações com informações do usuário
export interface UserSettingsWithUser extends DBUserSettings {
  user?: {
    id: string
    name: string | null
    email: string | null
  } | null
}

// Configurações padrão
export const DEFAULT_USER_SETTINGS: CreateUserSettings = {
  language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  dateFormat: 'dd/MM/yyyy',
  darkMode: false,
  emailNotifications: true,
  pushNotifications: true,
  budgetAlerts: true,
  lowBalanceAlerts: true,
  monthlyReports: true,
  notificationTime: '09:00',
  dataCollection: true,
  analytics: false,
  dataSharing: false,
  twoFactorAuth: false,
  autoBackup: true,
  cloudSync: false,
  localBackup: true,
  backupFrequency: 'weekly',
  defaultCurrency: 'BRL',
  numberFormat: 'pt-BR',
  fiscalYearStart: 'january',
  weekStartDay: 'monday',
  defaultBudgetLimit: '1000',
  showCents: true,
  autoCategorizationEnabled: true,
}

// Utilitários para validação
export function validateUserSettings(data: unknown): CreateUserSettings | null {
  const result = createUserSettingsSchema.safeParse(data)
  return result.success ? result.data : null
}

export function validateUserSettingsUpdate(data: unknown): UpdateUserSettings | null {
  const result = updateUserSettingsSchema.safeParse(data)
  return result.success ? result.data : null
} 