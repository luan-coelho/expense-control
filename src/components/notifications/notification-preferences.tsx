'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/use-notifications'
import type { NotificationSettings } from '@/types/notification'
import { Calendar, Clock, DollarSign, Mail, RotateCcw, Save, Smartphone, Target, TrendingUp } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface NotificationPreference {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  channels: {
    push: boolean
    email: boolean
    sms?: boolean
  }
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly'
  threshold?: number
  customSettings?: Record<string, any>
}

const defaultPreferences: NotificationPreference[] = [
  {
    id: 'budget_alerts',
    label: 'Alertas de Orçamento',
    description: 'Receba notificações quando se aproximar ou exceder seus limites de orçamento',
    icon: <Target className="h-4 w-4" />,
    enabled: true,
    channels: { push: true, email: true },
    frequency: 'immediate',
    threshold: 80,
    customSettings: {
      warnAt: [50, 80, 90, 100],
      categories: ['all'],
    },
  },
  {
    id: 'low_balance',
    label: 'Saldo Baixo',
    description: 'Alertas quando o saldo de suas contas estiver baixo',
    icon: <DollarSign className="h-4 w-4" />,
    enabled: true,
    channels: { push: true, email: false },
    frequency: 'immediate',
    threshold: 100,
    customSettings: {
      accounts: ['all'],
      minimumAmount: 100,
    },
  },
  {
    id: 'unusual_spending',
    label: 'Gastos Incomuns',
    description: 'Detecte padrões de gastos fora do normal',
    icon: <TrendingUp className="h-4 w-4" />,
    enabled: true,
    channels: { push: true, email: true },
    frequency: 'immediate',
    threshold: 150,
    customSettings: {
      sensitivity: 'medium',
      lookbackDays: 30,
    },
  },
  {
    id: 'monthly_summary',
    label: 'Resumo Mensal',
    description: 'Relatório mensal com resumo de gastos e economias',
    icon: <Calendar className="h-4 w-4" />,
    enabled: true,
    channels: { push: false, email: true },
    frequency: 'monthly',
    customSettings: {
      dayOfMonth: 1,
      includeComparisons: true,
      includeGoals: true,
    },
  },
  {
    id: 'recurring_reminders',
    label: 'Lembretes Recorrentes',
    description: 'Lembretes para contas e pagamentos recorrentes',
    icon: <Clock className="h-4 w-4" />,
    enabled: true,
    channels: { push: true, email: false },
    frequency: 'immediate',
    customSettings: {
      daysBefore: [3, 1],
      includeWeekends: false,
    },
  },
  {
    id: 'financial_goals',
    label: 'Metas Financeiras',
    description: 'Atualizações sobre o progresso de suas metas financeiras',
    icon: <Target className="h-4 w-4" />,
    enabled: true,
    channels: { push: true, email: true },
    frequency: 'weekly',
    customSettings: {
      progressThresholds: [25, 50, 75, 100],
      includeProjections: true,
    },
  },
]

export function NotificationPreferences() {
  const { data: settings, isLoading } = useNotificationSettings()
  const updateSettings = useUpdateNotificationSettings()

  const [preferences, setPreferences] = useState<NotificationPreference[]>(defaultPreferences)
  const [globalSettings, setGlobalSettings] = useState({
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    maxDailyNotifications: 10,
    batchNotifications: true,
    smartFiltering: true,
  })

  // Carregar configurações salvas
  useEffect(() => {
    if (settings) {
      // Mapear configurações salvas para preferências
      // Esta lógica dependeria da estrutura real dos dados do backend
    }
  }, [settings])

  const handlePreferenceChange = (id: string, field: keyof NotificationPreference, value: any) => {
    setPreferences(prev => prev.map(pref => (pref.id === id ? { ...pref, [field]: value } : pref)))
  }

  const handleChannelChange = (id: string, channel: keyof NotificationPreference['channels'], enabled: boolean) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.id === id
          ? {
              ...pref,
              channels: { ...pref.channels, [channel]: enabled },
            }
          : pref,
      ),
    )
  }

  const handleCustomSettingChange = (id: string, setting: string, value: any) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.id === id
          ? {
              ...pref,
              customSettings: { ...pref.customSettings, [setting]: value },
            }
          : pref,
      ),
    )
  }

  const handleSave = async () => {
    try {
      // Converter preferências para formato do backend
      const settingsToSave: Partial<NotificationSettings> = {
        // Mapear as preferências para os campos do NotificationSettings
        enableBudgetAlerts: preferences.find(p => p.id === 'budget_alerts')?.enabled ?? true,
        enableRecurringReminders: preferences.find(p => p.id === 'recurring_reminders')?.enabled ?? true,
        enableFinancialGoals: preferences.find(p => p.id === 'financial_goals')?.enabled ?? true,
        enableLowBalanceAlerts: preferences.find(p => p.id === 'low_balance')?.enabled ?? true,
        enableMonthlySummary: preferences.find(p => p.id === 'monthly_summary')?.enabled ?? true,
        enableExpenseLimits: preferences.find(p => p.id === 'expense_limits')?.enabled ?? true,
        enableCategoryBudgets: preferences.find(p => p.id === 'category_budgets')?.enabled ?? true,
        enableUnusualSpending: preferences.find(p => p.id === 'unusual_spending')?.enabled ?? false,

        // Mapear thresholds
        budgetAlertThreshold: preferences.find(p => p.id === 'budget_alerts')?.threshold ?? 80,
        lowBalanceThreshold: preferences.find(p => p.id === 'low_balance')?.threshold ?? 100,
        unusualSpendingThreshold: preferences.find(p => p.id === 'unusual_spending')?.threshold ?? 2,

        // Mapear canais de notificação (usando a primeira preferência como referência)
        emailNotifications: preferences[0]?.channels?.email ?? false,
        pushNotifications: preferences[0]?.channels?.push ?? true,
      }

      await updateSettings.mutateAsync(settingsToSave)
    } catch (error) {
      console.error('Erro ao salvar preferências:', error)
    }
  }

  const handleReset = () => {
    setPreferences(defaultPreferences)
    setGlobalSettings({
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
      maxDailyNotifications: 10,
      batchNotifications: true,
      smartFiltering: true,
    })
    toast.success('Preferências restauradas para os padrões')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Preferências Avançadas</h2>
          <p className="text-muted-foreground">Configure notificações detalhadas para cada tipo de alerta</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrões
          </Button>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {preferences.map(preference => (
          <Card key={preference.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">{preference.icon}</div>
                  <div>
                    <CardTitle className="text-base">{preference.label}</CardTitle>
                    <CardDescription className="text-sm">{preference.description}</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={preference.enabled}
                  onCheckedChange={enabled => handlePreferenceChange(preference.id, 'enabled', enabled)}
                />
              </div>
            </CardHeader>

            {preference.enabled && (
              <CardContent className="space-y-4">
                {/* Canais */}
                <div>
                  <Label className="text-sm font-medium">Canais de Notificação</Label>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`${preference.id}-push`}
                        checked={preference.channels.push}
                        onCheckedChange={enabled => handleChannelChange(preference.id, 'push', enabled)}
                      />
                      <Label htmlFor={`${preference.id}-push`} className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Push
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`${preference.id}-email`}
                        checked={preference.channels.email}
                        onCheckedChange={enabled => handleChannelChange(preference.id, 'email', enabled)}
                      />
                      <Label htmlFor={`${preference.id}-email`} className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Frequência */}
                <div>
                  <Label className="text-sm font-medium">Frequência</Label>
                  <Select
                    value={preference.frequency}
                    onValueChange={value => handlePreferenceChange(preference.id, 'frequency', value)}>
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Imediato</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Threshold */}
                {preference.threshold !== undefined && (
                  <div>
                    <Label className="text-sm font-medium">
                      Limite: {preference.threshold}
                      {preference.id === 'budget_alerts' && '%'}
                      {preference.id === 'low_balance' && ' R$'}
                      {preference.id === 'unusual_spending' && '%'}
                    </Label>
                    <Slider
                      value={[preference.threshold]}
                      onValueChange={([value]) => handlePreferenceChange(preference.id, 'threshold', value)}
                      max={preference.id === 'low_balance' ? 1000 : 200}
                      min={preference.id === 'low_balance' ? 10 : 10}
                      step={preference.id === 'low_balance' ? 10 : 5}
                      className="mt-2"
                    />
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
