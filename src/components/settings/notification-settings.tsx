'use client'

import { SettingsLayout } from './settings-layout'
import { SettingsActions } from './settings-actions'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useSettings } from '@/hooks/use-settings'

export function NotificationSettings() {
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
        title="Configurações de Notificações"
        description="Gerencie como e quando você recebe notificações"
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
      title="Configurações de Notificações"
      description="Gerencie como e quando você recebe notificações"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações importantes por email
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={value => updateSetting('emailNotifications', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifications">Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações push no navegador
              </p>
            </div>
            <Switch
              id="pushNotifications"
              checked={settings.pushNotifications}
              onCheckedChange={value => updateSetting('pushNotifications', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="budgetAlerts">Alertas de Orçamento</Label>
              <p className="text-sm text-muted-foreground">
                Ser notificado quando o orçamento estiver próximo do limite
              </p>
            </div>
            <Switch
              id="budgetAlerts"
              checked={settings.budgetAlerts}
              onCheckedChange={value => updateSetting('budgetAlerts', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="lowBalanceAlerts">Alertas de Saldo Baixo</Label>
              <p className="text-sm text-muted-foreground">
                Ser notificado quando o saldo das contas estiver baixo
              </p>
            </div>
            <Switch
              id="lowBalanceAlerts"
              checked={settings.lowBalanceAlerts}
              onCheckedChange={value => updateSetting('lowBalanceAlerts', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="monthlyReports">Relatórios Mensais</Label>
              <p className="text-sm text-muted-foreground">
                Receber relatório mensal por email
              </p>
            </div>
            <Switch
              id="monthlyReports"
              checked={settings.monthlyReports}
              onCheckedChange={value => updateSetting('monthlyReports', value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notificationTime">Horário das Notificações</Label>
            <Select 
              value={settings.notificationTime} 
              onValueChange={value => updateSetting('notificationTime', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o horário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="08:00">08:00</SelectItem>
                <SelectItem value="09:00">09:00</SelectItem>
                <SelectItem value="10:00">10:00</SelectItem>
                <SelectItem value="11:00">11:00</SelectItem>
                <SelectItem value="12:00">12:00</SelectItem>
                <SelectItem value="13:00">13:00</SelectItem>
                <SelectItem value="14:00">14:00</SelectItem>
                <SelectItem value="15:00">15:00</SelectItem>
                <SelectItem value="16:00">16:00</SelectItem>
                <SelectItem value="17:00">17:00</SelectItem>
                <SelectItem value="18:00">18:00</SelectItem>
                <SelectItem value="19:00">19:00</SelectItem>
                <SelectItem value="20:00">20:00</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Horário preferido para receber notificações diárias
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