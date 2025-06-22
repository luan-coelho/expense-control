'use client'

import React, { useState } from 'react'
import { CalendarIcon, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  NotificationTypeLabels,
  NotificationStatusLabels,
  NotificationPriorityLabels,
  type NotificationFilters,
  type NotificationTypeEnum,
  type NotificationStatusEnum,
  type NotificationPriorityEnum,
} from '@/types/notification'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface NotificationFiltersProps {
  filters: NotificationFilters
  onFiltersChange: (filters: NotificationFilters) => void
  className?: string
}

export function NotificationFilters({ filters, onFiltersChange, className }: NotificationFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(filters.dateFrom ? new Date(filters.dateFrom) : undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(filters.dateTo ? new Date(filters.dateTo) : undefined)

  const handleFilterChange = (key: keyof NotificationFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date)
    handleFilterChange('dateFrom', date?.toISOString())
  }

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date)
    handleFilterChange('dateTo', date?.toISOString())
  }

  const clearFilters = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    onFiltersChange({})
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '')

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== '').length
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Campo de busca */}
      <div className="flex-1 max-w-sm">
        <Input
          placeholder="Buscar notificações..."
          value={filters.search || ''}
          onChange={e => handleFilterChange('search', e.target.value)}
        />
      </div>

      {/* Filtros avançados */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filtros Avançados</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            <Separator />

            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filters.type || ''} onValueChange={value => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  {Object.entries(NotificationTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status || ''} onValueChange={value => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  {Object.entries(NotificationStatusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={filters.priority || ''} onValueChange={value => handleFilterChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as prioridades</SelectItem>
                  {Object.entries(NotificationPriorityLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Acionável */}
            <div className="space-y-2">
              <Label>Acionável</Label>
              <Select
                value={filters.isActionable?.toString() || ''}
                onValueChange={value =>
                  handleFilterChange('isActionable', value === '' ? undefined : value === 'true')
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="true">Apenas acionáveis</SelectItem>
                  <SelectItem value="false">Apenas informativas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Data de início */}
            <div className="space-y-2">
              <Label>Data de início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !dateFrom && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'PPP', { locale: ptBR }) : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={handleDateFromChange} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data de fim */}
            <div className="space-y-2">
              <Label>Data de fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !dateTo && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'PPP', { locale: ptBR }) : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={handleDateToChange} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Badges de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1 flex-wrap">
          {filters.type && (
            <Badge variant="secondary" className="text-xs">
              {NotificationTypeLabels[filters.type as NotificationTypeEnum]}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => handleFilterChange('type', undefined)}>
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="text-xs">
              {NotificationStatusLabels[filters.status as NotificationStatusEnum]}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => handleFilterChange('status', undefined)}>
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.priority && (
            <Badge variant="secondary" className="text-xs">
              {NotificationPriorityLabels[filters.priority as NotificationPriorityEnum]}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => handleFilterChange('priority', undefined)}>
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.isActionable !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {filters.isActionable ? 'Acionáveis' : 'Informativas'}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => handleFilterChange('isActionable', undefined)}>
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
