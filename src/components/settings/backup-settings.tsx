'use client'

import { SettingsLayout } from './settings-layout'
import { SettingsActions } from './settings-actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useSettings } from '@/hooks/use-settings'
import { Cloud, Download, HardDrive, Upload } from 'lucide-react'

export function BackupSettings() {
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

  const handleManualBackup = () => {
    // TODO: Implementar backup manual
    console.log('Iniciando backup manual')
  }

  const handleRestore = () => {
    // TODO: Implementar restauração
    console.log('Iniciando restauração')
  }

  if (isLoading) {
    return (
      <SettingsLayout
        title="Configurações de Backup"
        description="Gerencie backups automáticos e sincronização de dados"
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
      title="Configurações de Backup"
      description="Gerencie backups automáticos e sincronização de dados"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoBackup" className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Backup Automático
              </Label>
              <p className="text-sm text-muted-foreground">
                Fazer backup automático dos seus dados regularmente
              </p>
            </div>
            <Switch
              id="autoBackup"
              checked={settings.autoBackup}
              onCheckedChange={value => updateSetting('autoBackup', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="cloudSync" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Sincronização na Nuvem
              </Label>
              <p className="text-sm text-muted-foreground">
                Sincronizar dados automaticamente com a nuvem
              </p>
            </div>
            <Switch
              id="cloudSync"
              checked={settings.cloudSync}
              onCheckedChange={value => updateSetting('cloudSync', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="localBackup">Backup Local</Label>
              <p className="text-sm text-muted-foreground">
                Manter cópias locais dos backups
              </p>
            </div>
            <Switch
              id="localBackup"
              checked={settings.localBackup}
              onCheckedChange={value => updateSetting('localBackup', value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="backupFrequency">Frequência do Backup</Label>
            <Select 
              value={settings.backupFrequency} 
              onValueChange={value => updateSetting('backupFrequency', value)}
              disabled={!settings.autoBackup}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {!settings.autoBackup && 'Ative o backup automático para configurar a frequência'}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Ações Manuais</h3>
            <p className="text-sm text-muted-foreground">
              Execute backups ou restaurações manualmente
            </p>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <div className="font-medium">Fazer Backup Agora</div>
                <p className="text-sm text-muted-foreground">
                  Criar um backup manual de todos os seus dados
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleManualBackup}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Backup
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <div className="font-medium">Restaurar Backup</div>
                <p className="text-sm text-muted-foreground">
                  Restaurar dados de um backup anterior
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleRestore}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Restaurar
              </Button>
            </div>
          </div>
        </div>

        {/* Status do último backup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status do Backup</CardTitle>
            <CardDescription>Informações sobre o último backup realizado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Último backup:</span>
              <span className="font-mono">
                {settings.lastBackup || 'Nunca'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tamanho:</span>
              <span className="font-mono">
                {settings.backupSize || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-green-600 dark:text-green-400">
                {settings.autoBackup ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </CardContent>
        </Card>

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