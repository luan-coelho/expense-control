import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userSettingsService } from '@/services'
import { queryKeys } from '@/lib/routes'
import type { UpdateUserSettings, UserSettingsWithUser } from '@/types/user-settings'
import { toast } from 'sonner'

/**
 * Hook para buscar configurações do usuário atual
 */
export function useUserSettings() {
  return useQuery({
    queryKey: queryKeys.userSettings.current(),
    queryFn: () => userSettingsService.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}

/**
 * Hook para atualizar configurações do usuário
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: UpdateUserSettings) => userSettingsService.updateSettings(settings),
    onSuccess: (updatedSettings: UserSettingsWithUser) => {
      // Atualizar cache
      queryClient.setQueryData(queryKeys.userSettings.current(), updatedSettings)
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.userSettings.all })
      
      toast.success('Configurações salvas com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar configurações: ${error.message}`)
    },
  })
}

/**
 * Hook para resetar configurações do usuário
 */
export function useResetUserSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => userSettingsService.resetSettings(),
    onSuccess: (resetSettings: UserSettingsWithUser) => {
      // Atualizar cache
      queryClient.setQueryData(queryKeys.userSettings.current(), resetSettings)
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.userSettings.all })
      
      toast.success('Configurações resetadas para os valores padrão!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao resetar configurações: ${error.message}`)
    },
  })
}

/**
 * Hook para fazer backup das configurações
 */
export function useBackupUserSettings() {
  return useMutation({
    mutationFn: () => userSettingsService.backupSettings(),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Backup criado com sucesso!')
      } else {
        toast.error('Erro ao criar backup')
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar backup: ${error.message}`)
    },
  })
}

/**
 * Hook para restaurar configurações de um backup
 */
export function useRestoreUserSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (backupId: string) => userSettingsService.restoreSettings(backupId),
    onSuccess: (restoredSettings: UserSettingsWithUser) => {
      // Atualizar cache
      queryClient.setQueryData(queryKeys.userSettings.current(), restoredSettings)
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.userSettings.all })
      
      toast.success('Configurações restauradas com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao restaurar configurações: ${error.message}`)
    },
  })
}

/**
 * Hook para exportar configurações
 */
export function useExportUserSettings() {
  return useMutation({
    mutationFn: () => userSettingsService.exportSettings(),
    onSuccess: (blob: Blob) => {
      // Criar link de download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `configuracoes-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Configurações exportadas com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao exportar configurações: ${error.message}`)
    },
  })
}

/**
 * Hook para importar configurações
 */
export function useImportUserSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => userSettingsService.importSettings(file),
    onSuccess: (importedSettings: UserSettingsWithUser) => {
      // Atualizar cache
      queryClient.setQueryData(queryKeys.userSettings.current(), importedSettings)
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.userSettings.all })
      
      toast.success('Configurações importadas com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao importar configurações: ${error.message}`)
    },
  })
}

/**
 * Hook para validar configurações
 */
export function useValidateUserSettings() {
  return useMutation({
    mutationFn: () => userSettingsService.validateSettings(),
    onSuccess: (result) => {
      if (result.valid) {
        toast.success('Configurações estão íntegras!')
      } else {
        toast.error(`Configurações inválidas: ${result.errors?.join(', ')}`)
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao validar configurações: ${error.message}`)
    },
  })
}

/**
 * Hook para sincronizar configurações offline
 */
export function useSyncUserSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (offlineSettings: UpdateUserSettings) => 
      userSettingsService.syncOfflineSettings(offlineSettings),
    onSuccess: (syncedSettings: UserSettingsWithUser) => {
      // Atualizar cache
      queryClient.setQueryData(queryKeys.userSettings.current(), syncedSettings)
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.userSettings.all })
      
      toast.success('Configurações sincronizadas com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao sincronizar configurações: ${error.message}`)
    },
  })
} 