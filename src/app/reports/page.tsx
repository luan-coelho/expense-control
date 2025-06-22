'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  SpendingByCategoryChart,
  SpendingBySpaceChart,
  TopSpendingCategoriesTable,
  SummaryMetricsCards,
  MonthlyIncomeExpensesChart,
  BalanceEvolutionChart,
  ExportButtons,
} from '@/components/charts'
import { useActiveSpaceId, useActiveSpaceName } from '@/components/providers/space-provider'
import { useBreakpoint } from '@/hooks/use-mobile'
import { type AnalyticsFilters } from '@/services/analytics.service'
import { CalendarDays, Filter, RotateCcw, BarChart3 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function ReportsPage() {
  const activeSpaceId = useActiveSpaceId()
  const activeSpaceName = useActiveSpaceName()
  const breakpoint = useBreakpoint()

  // Estado dos filtros com datas como objetos Date
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()

  // Filtros finais aplicados, sempre incluindo o spaceId do contexto
  const filters = useMemo<AnalyticsFilters>(
    () => ({
      spaceId: activeSpaceId,
      startDate: startDate?.toISOString().split('T')[0],
      endDate: endDate?.toISOString().split('T')[0],
    }),
    [activeSpaceId, startDate, endDate],
  )

  // Aplicar filtros (força re-render dos componentes)
  const handleApplyFilters = () => {
    // Os filtros já são aplicados automaticamente através do useMemo
    // Esta função pode ser usada para feedback visual ou outras ações
  }

  // Limpar filtros
  const handleClearFilters = () => {
    setStartDate(undefined)
    setEndDate(undefined)
  }

  // Verificar se há filtros aplicados
  const hasActiveFilters = startDate !== undefined || endDate !== undefined

  // Altura responsiva do gráfico
  const getChartHeight = () => {
    switch (breakpoint) {
      case 'mobile':
        return 300
      case 'tablet':
        return 350
      default:
        return 400
    }
  }

  // Se não há espaço ativo, mostrar mensagem
  if (!activeSpaceId) {
    return (
      <main className="container mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Selecione um espaço no cabeçalho para visualizar os relatórios.</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6" role="main" aria-labelledby="reports-title">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 id="reports-title" className="text-2xl sm:text-3xl font-bold tracking-tight">
            Relatórios Financeiros
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground" id="reports-description">
            Análise detalhada dos seus gastos e receitas{activeSpaceName ? ` em ${activeSpaceName}` : ''}
          </p>
        </div>
        <div
          className="flex items-center gap-3 self-start sm:self-auto"
          role="toolbar"
          aria-label="Ações de exportação e visualização">
          <ExportButtons filters={filters} className="flex-shrink-0" variant="outline" size="default" />
          <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" aria-hidden="true" />
        </div>
      </header>

      <Separator />

      {/* Filtros */}
      <section aria-labelledby="filters-title" aria-describedby="filters-description">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle id="filters-title" className="flex items-center gap-2 text-lg sm:text-xl">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              Filtros de Análise
            </CardTitle>
            <CardDescription id="filters-description" className="text-sm">
              Configure os filtros para personalizar a análise dos dados financeiros
              {activeSpaceName ? ` de ${activeSpaceName}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Grid de filtros responsivo - Removido filtro de espaço */}
            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <legend className="sr-only">Opções de filtro para relatórios</legend>

              {/* Filtro de Data Inicial */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4" />
                  Data Inicial
                </Label>
                <DatePicker
                  id="startDate"
                  date={startDate}
                  onSelect={setStartDate}
                  placeholder="Selecione a data inicial"
                  className="w-full h-10"
                />
              </div>

              {/* Filtro de Data Final */}
              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4" />
                  Data Final
                </Label>
                <DatePicker
                  id="endDate"
                  date={endDate}
                  onSelect={setEndDate}
                  placeholder="Selecione a data final"
                  className="w-full h-10"
                />
              </div>
            </fieldset>

            {/* Botões de Ação - Layout responsivo */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <Button
                  onClick={handleApplyFilters}
                  className="flex items-center justify-center gap-2 h-10 min-w-0 flex-1 sm:flex-initial"
                  aria-describedby="filters-description"
                  type="button">
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  <span className="truncate">Aplicar Filtros</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex items-center justify-center gap-2 h-10 min-w-0 flex-1 sm:flex-initial"
                  aria-label="Limpar todos os filtros aplicados"
                  type="button">
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span className="truncate">Limpar Filtros</span>
                </Button>
              </div>
              {hasActiveFilters && (
                <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left sm:ml-2 mt-1 sm:mt-0">
                  Filtros ativos aplicados
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Métricas de Resumo */}
      <SummaryMetricsCards filters={filters} />

      {/* Gráficos e Relatórios */}
      <section aria-labelledby="charts-title" className="grid grid-cols-1 gap-4 sm:gap-6">
        <h2 id="charts-title" className="sr-only">
          Gráficos e Análises Financeiras
        </h2>

        {/* Layout responsivo para gráfico de categorias e tabela */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Gráfico de Gastos por Categoria */}
          <section className="lg:col-span-2" aria-labelledby="category-chart-title">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle id="category-chart-title" className="text-lg sm:text-xl">
                  Análise de Gastos por Categoria
                </CardTitle>
                <CardDescription className="text-sm">
                  Visualização da distribuição dos seus gastos organizados por categoria
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <SpendingByCategoryChart filters={filters} height={getChartHeight()} className="w-full" />
              </CardContent>
            </Card>
          </section>

          {/* Tabela de Top Categorias */}
          <div className="lg:col-span-1">
            <TopSpendingCategoriesTable filters={filters} limit={5} className="h-fit" />
          </div>
        </div>

        {/* Gráfico de Gastos por Espaço */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Distribuição de Gastos por Espaço</CardTitle>
            <CardDescription className="text-sm">
              Compare os gastos entre diferentes espaços (casa, trabalho, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <SpendingBySpaceChart filters={filters} height={getChartHeight()} className="w-full" />
          </CardContent>
        </Card>

        {/* Gráfico de Receitas vs Despesas Mensais */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Receitas vs Despesas Mensais</CardTitle>
            <CardDescription className="text-sm">
              Análise da evolução mensal das suas receitas e despesas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <MonthlyIncomeExpensesChart filters={filters} height={getChartHeight()} className="w-full" />
          </CardContent>
        </Card>

        {/* Gráfico de Evolução do Saldo */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Evolução do Saldo</CardTitle>
            <CardDescription className="text-sm">Acompanhe como seu saldo evoluiu ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <BalanceEvolutionChart filters={filters} height={getChartHeight()} className="w-full" />
          </CardContent>
        </Card>

        {/* Espaço para futuros gráficos */}
        <Card className="border-dashed">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl text-muted-foreground">Próximos Relatórios</CardTitle>
            <CardDescription className="text-sm">Mais gráficos e análises serão adicionados em breve</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-center h-24 sm:h-32 text-muted-foreground">
              <div className="text-center space-y-2">
                <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto opacity-50" />
                <p className="text-xs sm:text-sm max-w-xs">
                  Tendências mensais, comparativos e mais análises em desenvolvimento
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
