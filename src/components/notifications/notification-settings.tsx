'use client'

import React, { useState, useEffect } from 'react'
import { Settings, Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/use-notifications'
import type { NotificationSettings } from '@/types/notification'

interface NotificationSettingsProps {
  className?: string
}

const defaultSettings: NotificationSettings = {
  enableBudgetAlerts: true,
  enableRecurringReminders: true,
  enableFinancialGoals: true,
  enableLowBalanceAlerts: true,
  enableMonthlySummary: true,
  enableExpenseLimits: true,
  enableCategoryBudgets: true,
  enableUnusualSpending: false,
  budgetAlertThreshold: 80,
  lowBalanceThreshold: 100,
  unusualSpendingThreshold: 2,
  emailNotifications: false,
  pushNotifications: true,
}

export function NotificationSettings({ className }: NotificationSettingsProps) {
  const { data: settings, isLoading } = useNotificationSettings()
  const updateSettings = useUpdateNotificationSettings()

  const [formData, setFormData] = useState<NotificationSettings>(defaultSettings)

  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings.mutate(formData)
  }

  const handleReset = () => {
    setFormData(defaultSettings)
    updateSettings.mutate(defaultSettings)
  }

  const handleSwitchChange = (field: keyof NotificationSettings, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNumberChange = (field: keyof NotificationSettings, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground">Carregando configurações...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações de Notificações
        </CardTitle>
        <CardDescription>Configure quando e como receber notificações sobre suas finanças</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipos de Notificação */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tipos de Notificação</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Alertas de Orçamento</Label>
                  <p className="text-sm text-muted-foreground">Quando gastos se aproximam do limite</p>
                </div>
                <Switch
                  checked={formData.enableBudgetAlerts}
                  onCheckedChange={value => handleSwitchChange('enableBudgetAlerts', value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Saldo Baixo</Label>
                  <p className="text-sm text-muted-foreground">Quando o saldo de contas fica baixo</p>
                </div>
                <Switch
                  checked={formData.enableLowBalanceAlerts}
                  onCheckedChange={value => handleSwitchChange('enableLowBalanceAlerts', value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Resumo Mensal</Label>
                  <p className="text-sm text-muted-foreground">Relatório automático no final do mês</p>
                </div>
                <Switch
                  checked={formData.enableMonthlySummary}
                  onCheckedChange={value => handleSwitchChange('enableMonthlySummary', value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Gastos Incomuns</Label>
                  <p className="text-sm text-muted-foreground">Detecta padrões de gastos atípicos</p>
                </div>
                <Switch
                  checked={formData.enableUnusualSpending}
                  onCheckedChange={value => handleSwitchChange('enableUnusualSpending', value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Lembretes de Recorrência</Label>
                  <p className="text-sm text-muted-foreground">Para transações recorrentes</p>
                </div>
                <Switch
                  checked={formData.enableRecurringReminders}
                  onCheckedChange={value => handleSwitchChange('enableRecurringReminders', value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Metas Financeiras</Label>
                  <p className="text-sm text-muted-foreground">Progresso e alcance de metas</p>
                </div>
                <Switch
                  checked={formData.enableFinancialGoals}
                  onCheckedChange={value => handleSwitchChange('enableFinancialGoals', value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Limites e Thresholds */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Limites e Alertas</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budgetThreshold">Alerta de Orçamento (%)</Label>
                <Input
                  id="budgetThreshold"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.budgetAlertThreshold}
                  onChange={e => handleNumberChange('budgetAlertThreshold', Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Alertar quando gastos atingirem esta porcentagem do orçamento
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lowBalanceThreshold">Saldo Baixo (R$)</Label>
                <Input
                  id="lowBalanceThreshold"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.lowBalanceThreshold}
                  onChange={e => handleNumberChange('lowBalanceThreshold', Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">Alertar quando saldo da conta for menor que este valor</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unusualSpendingThreshold">Sensibilidade de Gastos Incomuns</Label>
                <Input
                  id="unusualSpendingThreshold"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.unusualSpendingThreshold}
                  onChange={e => handleNumberChange('unusualSpendingThreshold', Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Multiplicador do desvio padrão (1 = mais sensível, 5 = menos sensível)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Canais de Notificação */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Canais de Notificação</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">Notificações no navegador</p>
                </div>
                <Switch
                  checked={formData.pushNotifications}
                  onCheckedChange={value => handleSwitchChange('pushNotifications', value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">Receber por email (em breve)</p>
                </div>
                <Switch
                  checked={formData.emailNotifications}
                  onCheckedChange={value => handleSwitchChange('emailNotifications', value)}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between pt-4">
            <Button type="button" variant="outline" onClick={handleReset} disabled={updateSettings.isPending}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrões
            </Button>

            <Button type="submit" disabled={updateSettings.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
