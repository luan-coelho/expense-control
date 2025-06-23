'use client'

import { SettingsLayout } from './settings-layout'
import { SettingsActions } from './settings-actions'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSettings } from '@/hooks/use-settings'
import { Upload } from 'lucide-react'

export function ProfileSettings() {
  const {
    settings,
    isLoading,
    isSaving,
    hasChanges,
    updateSetting,
    resetSettings,
    saveSettings,
    getValidationErrors,
    isValid,
  } = useSettings()

  const errors = getValidationErrors()

  const handleAvatarChange = () => {
    // TODO: Implementar upload de avatar
    console.log('Alterar avatar')
  }

  if (isLoading) {
    return (
      <SettingsLayout
        title="Configurações de Perfil"
        description="Gerencie suas informações pessoais e foto de perfil"
      >
        <div className="space-y-4">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-16 bg-muted animate-pulse rounded" />
        </div>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout
      title="Configurações de Perfil"
      description="Gerencie suas informações pessoais e foto de perfil"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <FormField
            label="Nome"
            value={settings.name}
            onChange={e => updateSetting('name', e.target.value)}
            placeholder="Seu nome completo"
            error={errors.name}
            required
          />

          <FormField
            label="Email"
            type="email"
            value={settings.email}
            onChange={e => updateSetting('email', e.target.value)}
            placeholder="seu@email.com"
            error={errors.email}
            required
          />

          <div className="space-y-2">
            <Label>Foto de Perfil</Label>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={settings.avatar} alt={settings.name} />
                <AvatarFallback className="text-lg font-semibold">
                  {settings.name.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAvatarChange}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Alterar Foto
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Recomendamos uma foto quadrada de pelo menos 200x200 pixels.
            </p>
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