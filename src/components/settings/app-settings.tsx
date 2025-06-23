'use client'

import { SettingsLayout } from './settings-layout'
import { SettingsActions } from './settings-actions'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useSettings } from '@/hooks/use-settings'

export function AppSettings() {
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

  if (isLoading) {
    return (
      <SettingsLayout
        title="Configurações da Aplicação"
        description="Personalize a interface e preferências gerais do sistema"
      >
        <div className="space-y-4">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded" />
        </div>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout
      title="Configurações da Aplicação"
      description="Personalize a interface e preferências gerais do sistema"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Idioma</Label>
            <Select value={settings.language} onValueChange={value => updateSetting('language', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Fuso Horário</Label>
            <Select value={settings.timezone} onValueChange={value => updateSetting('timezone', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fuso horário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Sao_Paulo">Brasília (UTC-3)</SelectItem>
                <SelectItem value="America/New_York">Nova York (UTC-5)</SelectItem>
                <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tóquio (UTC+9)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFormat">Formato de Data</Label>
            <Select value={settings.dateFormat} onValueChange={value => updateSetting('dateFormat', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato de data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="darkMode">Modo Escuro</Label>
              <p className="text-sm text-muted-foreground">
                Ativar tema escuro para a interface
              </p>
            </div>
            <Switch
              id="darkMode"
              checked={settings.darkMode}
              onCheckedChange={value => updateSetting('darkMode', value)}
            />
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