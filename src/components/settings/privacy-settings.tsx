'use client'

import { SettingsLayout } from './settings-layout'
import { SettingsActions } from './settings-actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useSettings } from '@/hooks/use-settings'
import { AlertTriangle, Download, Trash2 } from 'lucide-react'

export function PrivacySettings() {
  const {
    settings,
    isLoading,
    isSaving,
    hasChanges,
    updateSetting,
    resetSettings,
    saveSettings,
    isValid,
  } = useSettings()

  const handleExportData = () => {
    // TODO: Implementar exportação de dados
    console.log('Exportar dados do usuário')
  }

  const handleDeleteAccount = () => {
    // TODO: Implementar exclusão de conta
    console.log('Excluir conta do usuário')
  }

  if (isLoading) {
    return (
      <SettingsLayout
        title="Configurações de Privacidade"
        description="Gerencie suas configurações de privacidade e dados pessoais"
      >
        <div className="space-y-4">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded" />
        </div>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout
      title="Configurações de Privacidade"
      description="Gerencie suas configurações de privacidade e dados pessoais"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dataCollection">Coleta de Dados</Label>
              <p className="text-sm text-muted-foreground">
                Permitir coleta de dados para melhorar a experiência
              </p>
            </div>
            <Switch
              id="dataCollection"
              checked={settings.dataCollection}
              onCheckedChange={value => updateSetting('dataCollection', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics">Analytics</Label>
              <p className="text-sm text-muted-foreground">
                Permitir coleta de dados de uso para analytics
              </p>
            </div>
            <Switch
              id="analytics"
              checked={settings.analytics}
              onCheckedChange={value => updateSetting('analytics', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dataSharing">Compartilhamento de Dados</Label>
              <p className="text-sm text-muted-foreground">
                Permitir compartilhamento de dados anônimos com parceiros
              </p>
            </div>
            <Switch
              id="dataSharing"
              checked={settings.dataSharing}
              onCheckedChange={value => updateSetting('dataSharing', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="twoFactorAuth">Autenticação de Dois Fatores</Label>
              <p className="text-sm text-muted-foreground">
                Adicionar uma camada extra de segurança à sua conta
              </p>
            </div>
            <Switch
              id="twoFactorAuth"
              checked={settings.twoFactorAuth}
              onCheckedChange={value => updateSetting('twoFactorAuth', value)}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Gerenciamento de Dados</h3>
            <p className="text-sm text-muted-foreground">
              Controle seus dados pessoais e da conta
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <div className="font-medium">Exportar Dados</div>
                <p className="text-sm text-muted-foreground">
                  Baixe uma cópia de todos os seus dados
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleExportData}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/10 dark:border-red-800">
              <div className="space-y-0.5">
                <div className="font-medium text-red-900 dark:text-red-100 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Excluir Conta
                </div>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Excluir permanentemente sua conta e todos os dados associados
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
          </div>
        </div>

        <SettingsActions
          onSave={saveSettings}
          onReset={resetSettings}
          isSaving={isSaving}
          hasChanges={hasChanges}
          isValid={isValid()}
        />
      </div>
    </SettingsLayout>
  )
} 