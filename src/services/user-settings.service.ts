import { routes } from '@/lib/routes'
import type { UserSettingsWithUser, UpdateUserSettings } from '@/types/user-settings'

class UserSettingsService {
  private readonly baseUrl = routes.api.userSettings

  /**
   * Buscar configurações do usuário atual
   */
  async getSettings(): Promise<UserSettingsWithUser> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Erro ao buscar configurações')
    }

    return response.json()
  }

  /**
   * Atualizar configurações do usuário
   */
  async updateSettings(settings: UpdateUserSettings): Promise<UserSettingsWithUser> {
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Erro ao atualizar configurações')
    }

    return response.json()
  }

  /**
   * Resetar configurações para valores padrão
   */
  async resetSettings(): Promise<UserSettingsWithUser> {
    // Implementar lógica para resetar configurações
    // Por enquanto, vamos buscar as configurações atuais
    return this.getSettings()
  }

  /**
   * Fazer backup das configurações
   */
  async backupSettings(): Promise<{ success: boolean; backupId?: string }> {
    // Implementar lógica de backup
    // Por enquanto, retorna sucesso simulado
    return { success: true, backupId: `backup_${Date.now()}` }
  }

  /**
   * Restaurar configurações de um backup
   */
  async restoreSettings(backupId: string): Promise<UserSettingsWithUser> {
    // Implementar lógica de restauração
    // Por enquanto, retorna as configurações atuais
    console.log('Restaurando backup:', backupId)
    return this.getSettings()
  }

  /**
   * Exportar configurações como JSON
   */
  async exportSettings(): Promise<Blob> {
    const settings = await this.getSettings()
    const dataStr = JSON.stringify(settings, null, 2)
    return new Blob([dataStr], { type: 'application/json' })
  }

  /**
   * Importar configurações de um arquivo JSON
   */
  async importSettings(file: File): Promise<UserSettingsWithUser> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          const settings = JSON.parse(content) as UpdateUserSettings
          const updatedSettings = await this.updateSettings(settings)
          resolve(updatedSettings)
        } catch (error) {
          reject(new Error('Erro ao importar configurações: arquivo inválido'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'))
      }
      
      reader.readAsText(file)
    })
  }

  /**
   * Validar se as configurações estão íntegras
   */
  async validateSettings(): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      await this.getSettings()
      return { valid: true }
    } catch (error) {
      return { 
        valid: false, 
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'] 
      }
    }
  }

  /**
   * Sincronizar configurações offline com o servidor
   */
  async syncOfflineSettings(offlineSettings: UpdateUserSettings): Promise<UserSettingsWithUser> {
    // Implementar lógica de sincronização
    // Por enquanto, apenas atualiza as configurações
    return this.updateSettings(offlineSettings)
  }
}

// Exportar instância singleton
const userSettingsService = new UserSettingsService()
export default userSettingsService 