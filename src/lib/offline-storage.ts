import type { UpdateUserSettings } from '@/types/user-settings'

const STORAGE_KEY = 'expense-control-user-settings'
const OFFLINE_CHANGES_KEY = 'expense-control-offline-changes'

/**
 * Utilitário para gerenciamento de configurações offline
 */
export class OfflineStorage {
  /**
   * Salvar configurações no localStorage
   */
  static saveSettings(settings: UpdateUserSettings): void {
    try {
      const settingsWithTimestamp = {
        ...settings,
        _lastModified: new Date().toISOString(),
        _isOffline: true,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsWithTimestamp))
    } catch (error) {
      console.error('Erro ao salvar configurações offline:', error)
    }
  }

  /**
   * Carregar configurações do localStorage
   */
  static loadSettings(): (UpdateUserSettings & { _lastModified?: string; _isOffline?: boolean }) | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null
      
      return JSON.parse(stored)
    } catch (error) {
      console.error('Erro ao carregar configurações offline:', error)
      return null
    }
  }

  /**
   * Remover configurações do localStorage
   */
  static clearSettings(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Erro ao limpar configurações offline:', error)
    }
  }

  /**
   * Verificar se existem configurações offline
   */
  static hasOfflineSettings(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false
      
      const settings = JSON.parse(stored)
      return settings._isOffline === true
    } catch (error) {
      console.error('Erro ao verificar configurações offline:', error)
      return false
    }
  }

  /**
   * Salvar mudanças pendentes para sincronização
   */
  static saveOfflineChanges(changes: UpdateUserSettings): void {
    try {
      const existingChanges = this.loadOfflineChanges()
      const mergedChanges = {
        ...existingChanges,
        ...changes,
        _lastModified: new Date().toISOString(),
      }
      localStorage.setItem(OFFLINE_CHANGES_KEY, JSON.stringify(mergedChanges))
    } catch (error) {
      console.error('Erro ao salvar mudanças offline:', error)
    }
  }

  /**
   * Carregar mudanças pendentes para sincronização
   */
  static loadOfflineChanges(): UpdateUserSettings {
    try {
      const stored = localStorage.getItem(OFFLINE_CHANGES_KEY)
      if (!stored) return {}
      
      return JSON.parse(stored)
    } catch (error) {
      console.error('Erro ao carregar mudanças offline:', error)
      return {}
    }
  }

  /**
   * Limpar mudanças pendentes após sincronização
   */
  static clearOfflineChanges(): void {
    try {
      localStorage.removeItem(OFFLINE_CHANGES_KEY)
    } catch (error) {
      console.error('Erro ao limpar mudanças offline:', error)
    }
  }

  /**
   * Verificar se existem mudanças pendentes
   */
  static hasPendingChanges(): boolean {
    try {
      const stored = localStorage.getItem(OFFLINE_CHANGES_KEY)
      if (!stored) return false
      
      const changes = JSON.parse(stored)
      return Object.keys(changes).length > 1 // > 1 porque sempre tem _lastModified
    } catch (error) {
      console.error('Erro ao verificar mudanças pendentes:', error)
      return false
    }
  }

  /**
   * Obter timestamp da última modificação offline
   */
  static getLastModified(): string | null {
    try {
      const settings = this.loadSettings()
      return settings?._lastModified || null
    } catch (error) {
      console.error('Erro ao obter timestamp de modificação:', error)
      return null
    }
  }

  /**
   * Fazer backup das configurações atuais
   */
  static createBackup(settings: UpdateUserSettings): string {
    try {
      const backupId = `backup_${Date.now()}`
      const backup = {
        id: backupId,
        settings,
        timestamp: new Date().toISOString(),
      }
      
      const existingBackups = this.loadBackups()
      existingBackups.push(backup)
      
      // Manter apenas os últimos 5 backups
      const recentBackups = existingBackups.slice(-5)
      localStorage.setItem('expense-control-backups', JSON.stringify(recentBackups))
      
      return backupId
    } catch (error) {
      console.error('Erro ao criar backup:', error)
      throw new Error('Erro ao criar backup')
    }
  }

  /**
   * Carregar lista de backups
   */
  static loadBackups(): Array<{ id: string; settings: UpdateUserSettings; timestamp: string }> {
    try {
      const stored = localStorage.getItem('expense-control-backups')
      if (!stored) return []
      
      return JSON.parse(stored)
    } catch (error) {
      console.error('Erro ao carregar backups:', error)
      return []
    }
  }

  /**
   * Restaurar configurações de um backup
   */
  static restoreBackup(backupId: string): UpdateUserSettings | null {
    try {
      const backups = this.loadBackups()
      const backup = backups.find(b => b.id === backupId)
      
      if (!backup) {
        throw new Error('Backup não encontrado')
      }
      
      return backup.settings
    } catch (error) {
      console.error('Erro ao restaurar backup:', error)
      return null
    }
  }

  /**
   * Exportar configurações como JSON
   */
  static exportSettings(settings: UpdateUserSettings): Blob {
    try {
      const exportData = {
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      }
      
      const dataStr = JSON.stringify(exportData, null, 2)
      return new Blob([dataStr], { type: 'application/json' })
    } catch (error) {
      console.error('Erro ao exportar configurações:', error)
      throw new Error('Erro ao exportar configurações')
    }
  }

  /**
   * Importar configurações de um arquivo JSON
   */
  static async importSettings(file: File): Promise<UpdateUserSettings> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const importData = JSON.parse(content)
          
          // Validar estrutura do arquivo
          if (!importData.settings || !importData.version) {
            throw new Error('Formato de arquivo inválido')
          }
          
          resolve(importData.settings)
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
   * Verificar se o usuário está online
   */
  static isOnline(): boolean {
    return navigator.onLine
  }

  /**
   * Configurar listener para mudanças de status online/offline
   */
  static setupOnlineStatusListener(
    onOnline: () => void,
    onOffline: () => void
  ): () => void {
    const handleOnline = () => onOnline()
    const handleOffline = () => onOffline()
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Retornar função de cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
} 