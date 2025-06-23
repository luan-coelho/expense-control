import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useUserSettings, useUpdateUserSettings } from './use-user-settings'
import type { UpdateUserSettings } from '@/types/user-settings'

export interface UserSettings {
  // Perfil
  name: string
  email: string
  avatar?: string

  // Aplicação
  language: string
  timezone: string
  dateFormat: string
  darkMode: boolean

  // Notificações
  emailNotifications: boolean
  pushNotifications: boolean
  budgetAlerts: boolean
  lowBalanceAlerts: boolean
  monthlyReports: boolean
  notificationTime: string

  // Privacidade
  dataCollection: boolean
  analytics: boolean
  dataSharing: boolean
  twoFactorAuth: boolean

  // Backup
  autoBackup: boolean
  cloudSync: boolean
  localBackup: boolean
  backupFrequency: string
  lastBackup?: string
  backupSize?: string

  // Financeiro
  defaultCurrency: string
  numberFormat: string
  fiscalYearStart: string
  weekStartDay: string
  defaultBudgetLimit: string
  showCents: boolean
  autoCategorizationEnabled: boolean
}

const DEFAULT_SETTINGS: UserSettings = {
  name: '',
  email: '',
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

export function useSettings() {
  const { data: session } = useSession()
  const { data: apiSettings, isLoading: isLoadingApi } = useUserSettings()
  const updateSettingsMutation = useUpdateUserSettings()
  
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<UserSettings>(DEFAULT_SETTINGS)

  // Carregar configurações do usuário (API + Session)
  useEffect(() => {
    if (session?.user && apiSettings) {
      const userSettings = {
        ...DEFAULT_SETTINGS,
        name: session.user.name || '',
        email: session.user.email || '',
        // Sobrescrever com configurações da API
        language: apiSettings.language,
        timezone: apiSettings.timezone,
        dateFormat: apiSettings.dateFormat,
        darkMode: apiSettings.darkMode,
        emailNotifications: apiSettings.emailNotifications,
        pushNotifications: apiSettings.pushNotifications,
        budgetAlerts: apiSettings.budgetAlerts,
        lowBalanceAlerts: apiSettings.lowBalanceAlerts,
        monthlyReports: apiSettings.monthlyReports,
        notificationTime: apiSettings.notificationTime,
        dataCollection: apiSettings.dataCollection,
        analytics: apiSettings.analytics,
        dataSharing: apiSettings.dataSharing,
        twoFactorAuth: apiSettings.twoFactorAuth,
        autoBackup: apiSettings.autoBackup,
        cloudSync: apiSettings.cloudSync,
        localBackup: apiSettings.localBackup,
        backupFrequency: apiSettings.backupFrequency,
        lastBackup: apiSettings.lastBackup?.toISOString().split('T')[0],
        backupSize: apiSettings.backupSize || undefined,
        defaultCurrency: apiSettings.defaultCurrency,
        numberFormat: apiSettings.numberFormat,
        fiscalYearStart: apiSettings.fiscalYearStart,
        weekStartDay: apiSettings.weekStartDay,
        defaultBudgetLimit: apiSettings.defaultBudgetLimit,
        showCents: apiSettings.showCents,
        autoCategorizationEnabled: apiSettings.autoCategorizationEnabled,
      }
      setSettings(userSettings)
      setOriginalSettings(userSettings)
      setIsLoading(false)
    } else if (session?.user && !isLoadingApi) {
      // Fallback para configurações padrão se não houver API
      const userSettings = {
        ...DEFAULT_SETTINGS,
        name: session.user.name || '',
        email: session.user.email || '',
      }
      setSettings(userSettings)
      setOriginalSettings(userSettings)
      setIsLoading(false)
    }
  }, [session, apiSettings, isLoadingApi])

  // Detectar mudanças
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings)
    setHasChanges(changed)
  }, [settings, originalSettings])

  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(originalSettings)
    setHasChanges(false)
  }, [originalSettings])

  const saveSettings = useCallback(async () => {
    if (!hasChanges) return

    try {
      // Preparar dados para API (excluir campos que não devem ser enviados)
      const { name, email, avatar, lastBackup, backupSize, ...apiSettings } = settings
      
      // Usar mutation para salvar configurações
      await updateSettingsMutation.mutateAsync(apiSettings as UpdateUserSettings)
      
      setOriginalSettings(settings)
      setHasChanges(false)
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      // O toast de erro já é exibido pela mutation
    }
  }, [settings, hasChanges, updateSettingsMutation])

  const validateEmail = useCallback((email: string): string | null => {
    if (!email) return 'Email é obrigatório'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Email inválido'
    return null
  }, [])

  const validateName = useCallback((name: string): string | null => {
    if (!name) return 'Nome é obrigatório'
    if (name.length < 2) return 'Nome deve ter pelo menos 2 caracteres'
    if (name.length > 100) return 'Nome deve ter no máximo 100 caracteres'
    return null
  }, [])

  const validateBudgetLimit = useCallback((limit: string): string | null => {
    if (!limit) return 'Limite de orçamento é obrigatório'
    const numValue = parseFloat(limit.replace(',', '.'))
    if (isNaN(numValue) || numValue <= 0) return 'Valor deve ser maior que zero'
    if (numValue > 1000000) return 'Valor muito alto'
    return null
  }, [])

  const getValidationErrors = useCallback(() => {
    const errors: Record<string, string> = {}
    
    const nameError = validateName(settings.name)
    if (nameError) errors.name = nameError

    const emailError = validateEmail(settings.email)
    if (emailError) errors.email = emailError

    const budgetError = validateBudgetLimit(settings.defaultBudgetLimit)
    if (budgetError) errors.defaultBudgetLimit = budgetError

    return errors
  }, [settings, validateName, validateEmail, validateBudgetLimit])

  const isValid = useCallback(() => {
    const errors = getValidationErrors()
    return Object.keys(errors).length === 0
  }, [getValidationErrors])

  return {
    settings,
    isLoading: isLoading || isLoadingApi,
    isSaving: updateSettingsMutation.isPending,
    hasChanges,
    updateSetting,
    updateSettings,
    resetSettings,
    saveSettings,
    getValidationErrors,
    isValid,
    validateEmail,
    validateName,
    validateBudgetLimit,
  }
} 