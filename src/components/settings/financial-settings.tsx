'use client'

import { SettingsLayout } from './settings-layout'
import { SettingsActions } from './settings-actions'
import { FormField } from '@/components/ui/form-field'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSettings } from '@/hooks/use-settings'
import { useMemo } from 'react'

export function FinancialSettings() {
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

  // Preview em tempo real dos formatos
  const formatPreview = useMemo(() => {
    const sampleValue = 1234.56
    const formatter = new Intl.NumberFormat(settings.numberFormat, {
      style: 'currency',
      currency: settings.defaultCurrency,
      minimumFractionDigits: settings.showCents ? 2 : 0,
      maximumFractionDigits: settings.showCents ? 2 : 0,
    })
    return formatter.format(sampleValue)
  }, [settings.numberFormat, settings.defaultCurrency, settings.showCents])

  const datePreview = useMemo(() => {
    const sampleDate = new Date(2024, 0, 15) // 15 de janeiro de 2024
    const formatMap = {
      'dd/MM/yyyy': '15/01/2024',
      'MM/dd/yyyy': '01/15/2024',
      'yyyy-MM-dd': '2024-01-15',
    }
    return formatMap[settings.dateFormat as keyof typeof formatMap] || settings.dateFormat
  }, [settings.dateFormat])

  if (isLoading) {
    return (
      <SettingsLayout
        title="Configurações Financeiras"
        description="Configure formatos de moeda, datas e preferências financeiras"
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
      title="Configurações Financeiras"
      description="Configure formatos de moeda, datas e preferências financeiras"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultCurrency">Moeda Padrão</Label>
            <Select 
              value={settings.defaultCurrency} 
              onValueChange={value => updateSetting('defaultCurrency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a moeda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
                <SelectItem value="GBP">Libra Esterlina (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberFormat">Formato de Números</Label>
            <Select 
              value={settings.numberFormat} 
              onValueChange={value => updateSetting('numberFormat', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Brasileiro (1.234,56)</SelectItem>
                <SelectItem value="en-US">Americano (1,234.56)</SelectItem>
                <SelectItem value="de-DE">Alemão (1.234,56)</SelectItem>
                <SelectItem value="fr-FR">Francês (1 234,56)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fiscalYearStart">Início do Ano Fiscal</Label>
            <Select 
              value={settings.fiscalYearStart} 
              onValueChange={value => updateSetting('fiscalYearStart', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="january">Janeiro</SelectItem>
                <SelectItem value="april">Abril</SelectItem>
                <SelectItem value="july">Julho</SelectItem>
                <SelectItem value="october">Outubro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekStartDay">Primeiro Dia da Semana</Label>
            <Select 
              value={settings.weekStartDay} 
              onValueChange={value => updateSetting('weekStartDay', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o dia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunday">Domingo</SelectItem>
                <SelectItem value="monday">Segunda-feira</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FormField
            label="Limite de Orçamento Mensal Padrão"
            value={settings.defaultBudgetLimit}
            onChange={e => updateSetting('defaultBudgetLimit', e.target.value)}
            placeholder="1000"
            error={errors.defaultBudgetLimit}
            description="Valor padrão para novos orçamentos mensais"
            required
          />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showCents">Mostrar Centavos</Label>
              <p className="text-sm text-muted-foreground">
                Exibir valores com duas casas decimais
              </p>
            </div>
            <Switch
              id="showCents"
              checked={settings.showCents}
              onCheckedChange={value => updateSetting('showCents', value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoCategorizationEnabled">Categorização Automática</Label>
              <p className="text-sm text-muted-foreground">
                Sugerir categorias automaticamente para novas transações
              </p>
            </div>
            <Switch
              id="autoCategorizationEnabled"
              checked={settings.autoCategorizationEnabled}
              onCheckedChange={value => updateSetting('autoCategorizationEnabled', value)}
            />
          </div>
        </div>

        {/* Preview dos formatos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preview dos Formatos</CardTitle>
            <CardDescription>Veja como os valores serão exibidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor monetário:</span>
              <span className="font-mono">{formatPreview}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Data:</span>
              <span className="font-mono">{datePreview}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Primeiro dia da semana:</span>
              <span className="capitalize">
                {settings.weekStartDay === 'sunday' ? 'Domingo' : 'Segunda-feira'}
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