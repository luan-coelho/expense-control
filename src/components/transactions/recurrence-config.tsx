'use client'

import { useState, useEffect } from 'react'
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { CalendarDays, Repeat, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

import {
  RecurrencePattern,
  RecurrencePatternLabels,
  type RecurrenceData,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  parseRecurrencePattern,
  stringifyRecurrencePattern,
  getRecurrenceDescription,
} from '@/types/transaction'

type TransactionFormData = CreateTransactionInput | UpdateTransactionInput

interface RecurrenceConfigProps {
  control: Control<TransactionFormData>
  setValue: UseFormSetValue<TransactionFormData>
  watch: UseFormWatch<TransactionFormData>
}

export function RecurrenceConfig({ control, setValue, watch }: RecurrenceConfigProps) {
  const isRecurrent = watch('isRecurrent')
  const recurrencePattern = watch('recurrencePattern')
  const watchedDate = watch('date')
  
  const [recurrenceData, setRecurrenceData] = useState<RecurrenceData>({
    pattern: RecurrencePattern.MONTHLY,
    interval: 1,
  })

  // Sincronizar dados de recorrência com o formulário
  useEffect(() => {
    if (isRecurrent) {
      setValue('recurrencePattern', stringifyRecurrencePattern(recurrenceData))
    } else {
      setValue('recurrencePattern', undefined)
    }
  }, [isRecurrent, recurrenceData, setValue])

  // Carregar dados de recorrência existentes (para edição)
  useEffect(() => {
    if (recurrencePattern) {
      const parsed = parseRecurrencePattern(recurrencePattern)
      if (parsed) {
        setRecurrenceData(parsed)
      }
    }
  }, [recurrencePattern])

  const updateRecurrenceData = (updates: Partial<RecurrenceData>) => {
    setRecurrenceData(prev => ({ ...prev, ...updates }))
  }

  const handleToggleRecurrence = (enabled: boolean) => {
    setValue('isRecurrent', enabled)
    if (!enabled) {
      setValue('recurrencePattern', undefined)
    }
  }

  const formatDateForInput = (date?: string): string => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  const formatDateFromInput = (value: string): string => {
    return new Date(value).toISOString()
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Recorrência
          </CardTitle>
          <FormField
            control={control}
            name="isRecurrent"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked: boolean) => {
                      field.onChange(checked)
                      handleToggleRecurrence(checked)
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        {isRecurrent && (
          <div className="text-sm text-muted-foreground">
            {getRecurrenceDescription(recurrencePattern || null)}
          </div>
        )}
      </CardHeader>

      {isRecurrent && (
        <CardContent className="space-y-4">
          {/* Padrão de recorrência */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Repetir</label>
              <Select
                value={recurrenceData.pattern}
                onValueChange={(value: keyof typeof RecurrencePattern) =>
                  updateRecurrenceData({ pattern: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RecurrencePatternLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">A cada</label>
              <Input
                type="number"
                min="1"
                max="365"
                value={recurrenceData.interval}
                onChange={(e) =>
                  updateRecurrenceData({ interval: parseInt(e.target.value) || 1 })
                }
                placeholder="1"
              />
            </div>
          </div>

          {/* Opções de fim */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Fim da recorrência (opcional)</label>
            
            <div className="grid grid-cols-1 gap-3">
              {/* Data de fim */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <label className="text-sm">Até uma data específica</label>
                  {recurrenceData.endDate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => updateRecurrenceData({ endDate: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Input
                  type="date"
                  value={formatDateForInput(recurrenceData.endDate)}
                  onChange={(e) =>
                    updateRecurrenceData({
                      endDate: e.target.value ? formatDateFromInput(e.target.value) : undefined,
                      maxOccurrences: undefined, // Limpar a outra opção
                    })
                  }
                />
              </div>

              {/* Máximo de ocorrências */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Ou após</span>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={recurrenceData.maxOccurrences || ''}
                    onChange={(e) =>
                      updateRecurrenceData({
                        maxOccurrences: e.target.value ? parseInt(e.target.value) : undefined,
                        endDate: undefined, // Limpar a outra opção
                      })
                    }
                    placeholder="Número"
                    className="w-20"
                  />
                  <span className="text-sm">ocorrências</span>
                  {recurrenceData.maxOccurrences && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => updateRecurrenceData({ maxOccurrences: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview das próximas ocorrências */}
          {watchedDate && (
            <div className="pt-3 border-t">
              <div className="text-sm font-medium mb-2">Próximas ocorrências:</div>
              <div className="flex flex-wrap gap-1">
                {generatePreviewDates(recurrenceData, watchedDate).map((date, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {date.toLocaleDateString('pt-BR')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// Função auxiliar para gerar datas de preview
function generatePreviewDates(recurrence: RecurrenceData, startDate: string): Date[] {
  if (!startDate) return []

  const dates: Date[] = []
  const start = new Date(startDate)
  const current = new Date(start)
  
  // Gerar até 5 próximas ocorrências para preview
  for (let i = 0; i < 5; i++) {
    switch (recurrence.pattern) {
      case RecurrencePattern.DAILY:
        current.setDate(current.getDate() + recurrence.interval)
        break
      case RecurrencePattern.WEEKLY:
        current.setDate(current.getDate() + (7 * recurrence.interval))
        break
      case RecurrencePattern.MONTHLY:
        current.setMonth(current.getMonth() + recurrence.interval)
        break
      case RecurrencePattern.YEARLY:
        current.setFullYear(current.getFullYear() + recurrence.interval)
        break
    }
    
    // Verificar se passou da data limite
    if (recurrence.endDate && current > new Date(recurrence.endDate)) {
      break
    }
    
    // Verificar se passou do máximo de ocorrências
    if (recurrence.maxOccurrences && i >= recurrence.maxOccurrences - 1) {
      break
    }
    
    dates.push(new Date(current))
  }
  
  return dates
} 