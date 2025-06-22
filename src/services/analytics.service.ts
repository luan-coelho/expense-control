export interface SpendingByCategoryData {
  categoryId: string | null
  categoryName: string
  color: string
  icon: string
  amount: number
  percentage: number
  transactionCount: number
  formattedAmount: string
}

export interface SpendingByCategoryResponse {
  data: SpendingByCategoryData[]
  summary: {
    totalSpending: number
    totalCategories: number
    formattedTotalSpending: string
  }
}

export interface SpendingBySpaceData {
  spaceId: string | null
  spaceName: string
  color: string
  amount: number
  percentage: number
  transactionCount: number
  formattedAmount: string
}

export interface SpendingBySpaceResponse {
  data: SpendingBySpaceData[]
  summary: {
    totalSpending: number
    totalSpaces: number
    formattedTotalSpending: string
  }
}

export interface LargestTransaction {
  id: string
  amount: number
  description: string
  categoryName: string | null
  spaceName: string | null
  formattedAmount: string
}

export interface PeriodMetrics {
  totalIncome: number
  totalExpenses: number
  netIncome: number
  transactionCount: number
  expenseCount: number
  incomeCount: number
  largestExpense: LargestTransaction | null
  largestIncome: LargestTransaction | null
  averageExpense: number
  averageIncome: number
  uniqueCategories: number
  uniqueSpaces: number
  formattedTotalIncome: string
  formattedTotalExpenses: string
  formattedNetIncome: string
  formattedAverageExpense: string
  formattedAverageIncome: string
}

export interface PeriodComparison {
  totalIncomeChange: number
  totalExpensesChange: number
  netIncomeChange: number
  transactionCountChange: number
  averageExpenseChange: number
  averageIncomeChange: number
}

export interface SummaryMetricsResponse {
  current: PeriodMetrics
  previous: PeriodMetrics | null
  comparison: PeriodComparison | null
  period: {
    start: string | null
    end: string | null
    hasComparison: boolean
  }
}

export interface MonthlyIncomeExpensesData {
  period: string
  year: number
  month: number
  income: number
  expenses: number
  netBalance: number
  transactionCount: number
  formattedIncome: string
  formattedExpenses: string
  formattedNetBalance: string
}

export interface MonthlyIncomeExpensesResponse {
  data: MonthlyIncomeExpensesData[]
  summary: {
    totalIncome: number
    totalExpenses: number
    totalNetBalance: number
    totalTransactions: number
    periodCount: number
    formattedTotalIncome: string
    formattedTotalExpenses: string
    formattedTotalNetBalance: string
  }
}

export interface BalanceEvolutionData {
  date: string
  balance: number
  cumulativeIncome: number
  cumulativeExpenses: number
  dailyChange: number
  formattedBalance: string
  formattedDailyChange: string
}

export interface BalanceEvolutionResponse {
  data: BalanceEvolutionData[]
  summary: {
    initialBalance: number
    finalBalance: number
    totalChange: number
    maxBalance: number
    minBalance: number
    totalTransactions: number
    periodDays: number
    formattedInitialBalance: string
    formattedFinalBalance: string
    formattedTotalChange: string
    formattedMaxBalance: string
    formattedMinBalance: string
  }
}

export interface AnalyticsFilters {
  startDate?: string
  endDate?: string
  accountId?: string
  spaceId?: string
}

/**
 * Serviço para gerenciar operações de analytics via API
 */
class AnalyticsService {
  /**
   * Buscar dados de gastos por categoria
   */
  async getSpendingByCategory(filters?: AnalyticsFilters): Promise<SpendingByCategoryResponse> {
    const searchParams = new URLSearchParams()

    if (filters?.startDate) searchParams.set('startDate', filters.startDate)
    if (filters?.endDate) searchParams.set('endDate', filters.endDate)
    if (filters?.accountId) searchParams.set('accountId', filters.accountId)
    if (filters?.spaceId) searchParams.set('spaceId', filters.spaceId)

    const url = `/api/analytics/spending-by-category?${searchParams.toString()}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Erro ao buscar dados de gastos por categoria')
    }

    return response.json()
  }

  /**
   * Buscar dados de gastos por espaço
   */
  async getSpendingBySpace(filters?: AnalyticsFilters): Promise<SpendingBySpaceResponse> {
    const searchParams = new URLSearchParams()

    if (filters?.startDate) searchParams.set('startDate', filters.startDate)
    if (filters?.endDate) searchParams.set('endDate', filters.endDate)
    if (filters?.accountId) searchParams.set('accountId', filters.accountId)
    // Nota: não incluímos spaceId aqui pois estamos comparando espaços

    const url = `/api/analytics/spending-by-space?${searchParams.toString()}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Erro ao buscar dados de gastos por espaço')
    }

    return response.json()
  }

  /**
   * Buscar métricas de resumo e comparação de períodos
   */
  async getSummaryMetrics(filters?: AnalyticsFilters): Promise<SummaryMetricsResponse> {
    const searchParams = new URLSearchParams()

    if (filters?.startDate) searchParams.set('startDate', filters.startDate)
    if (filters?.endDate) searchParams.set('endDate', filters.endDate)
    if (filters?.accountId) searchParams.set('accountId', filters.accountId)
    if (filters?.spaceId) searchParams.set('spaceId', filters.spaceId)

    const url = `/api/analytics/summary-metrics?${searchParams.toString()}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Erro ao buscar métricas de resumo')
    }

    return response.json()
  }

  /**
   * Buscar dados mensais de receitas vs despesas
   */
  async getMonthlyIncomeExpenses(filters?: AnalyticsFilters): Promise<MonthlyIncomeExpensesResponse> {
    const searchParams = new URLSearchParams()

    if (filters?.startDate) {
      searchParams.set('startDate', filters.startDate)
    }
    if (filters?.endDate) {
      searchParams.set('endDate', filters.endDate)
    }
    if (filters?.spaceId) {
      searchParams.set('spaceId', filters.spaceId)
    }
    if (filters?.accountId) {
      searchParams.set('accountId', filters.accountId)
    }

    const url = `/api/analytics/monthly-income-expenses${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || `Erro ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Buscar dados de evolução do saldo
   */
  async getBalanceEvolution(filters?: AnalyticsFilters): Promise<BalanceEvolutionResponse> {
    const searchParams = new URLSearchParams()

    if (filters?.startDate) {
      searchParams.set('startDate', filters.startDate)
    }
    if (filters?.endDate) {
      searchParams.set('endDate', filters.endDate)
    }
    if (filters?.spaceId) {
      searchParams.set('spaceId', filters.spaceId)
    }
    if (filters?.accountId) {
      searchParams.set('accountId', filters.accountId)
    }

    const url = `/api/analytics/balance-evolution${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || `Erro ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }
}

// Exportar instância única do serviço
export const analyticsService = new AnalyticsService()
export default analyticsService
