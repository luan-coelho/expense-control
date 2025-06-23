import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { usersTable } from './user-schema'

// Tabela de configurações do usuário
export const userSettingsTable = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  
  // Configurações de aplicação
  language: text('language').notNull().default('pt-BR'),
  timezone: text('timezone').notNull().default('America/Sao_Paulo'),
  dateFormat: text('dateFormat').notNull().default('dd/MM/yyyy'),
  darkMode: boolean('darkMode').notNull().default(false),

  // Configurações de notificações
  emailNotifications: boolean('emailNotifications').notNull().default(true),
  pushNotifications: boolean('pushNotifications').notNull().default(true),
  budgetAlerts: boolean('budgetAlerts').notNull().default(true),
  lowBalanceAlerts: boolean('lowBalanceAlerts').notNull().default(true),
  monthlyReports: boolean('monthlyReports').notNull().default(true),
  notificationTime: text('notificationTime').notNull().default('09:00'),

  // Configurações de privacidade
  dataCollection: boolean('dataCollection').notNull().default(true),
  analytics: boolean('analytics').notNull().default(false),
  dataSharing: boolean('dataSharing').notNull().default(false),
  twoFactorAuth: boolean('twoFactorAuth').notNull().default(false),

  // Configurações de backup
  autoBackup: boolean('autoBackup').notNull().default(true),
  cloudSync: boolean('cloudSync').notNull().default(false),
  localBackup: boolean('localBackup').notNull().default(true),
  backupFrequency: text('backupFrequency').notNull().default('weekly'),
  lastBackup: timestamp('lastBackup'),
  backupSize: text('backupSize'),

  // Configurações financeiras
  defaultCurrency: text('defaultCurrency').notNull().default('BRL'),
  numberFormat: text('numberFormat').notNull().default('pt-BR'),
  fiscalYearStart: text('fiscalYearStart').notNull().default('january'),
  weekStartDay: text('weekStartDay').notNull().default('monday'),
  defaultBudgetLimit: text('defaultBudgetLimit').notNull().default('1000'),
  showCents: boolean('showCents').notNull().default(true),
  autoCategorizationEnabled: boolean('autoCategorizationEnabled').notNull().default(true),

  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt'),
})

// Tipos TypeScript para a tabela de configurações
export type UserSettings = typeof userSettingsTable.$inferSelect
export type NewUserSettings = typeof userSettingsTable.$inferInsert
export type UpdateUserSettings = Partial<Omit<NewUserSettings, 'id' | 'userId' | 'createdAt'>> 