import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { transactionsTable, categoriesTable, spacesTable } from '@/db/schema'
import { eq, and, sql, desc, gte, lte, asc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = session.user.id as string
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const accountId = searchParams.get('accountId')
    const spaceId = searchParams.get('spaceId')

    // Função para calcular métricas de um período
    const calculatePeriodMetrics = async (start?: string, end?: string) => {
      const conditions = [eq(transactionsTable.userId, userId)]

      if (start) {
        conditions.push(gte(transactionsTable.date, new Date(start)))
      }
      if (end) {
        conditions.push(lte(transactionsTable.date, new Date(end)))
      }
      if (accountId) {
        conditions.push(eq(transactionsTable.accountId, accountId))
      }
      if (spaceId) {
        conditions.push(eq(transactionsTable.spaceId, spaceId))
      }

      // Buscar todas as transações do período
      const transactions = await db
        .select({
          id: transactionsTable.id,
          type: transactionsTable.type,
          amount: transactionsTable.amount,
          date: transactionsTable.date,
          description: transactionsTable.description,
          categoryName: categoriesTable.name,
          spaceName: spacesTable.name,
        })
        .from(transactionsTable)
        .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
        .leftJoin(spacesTable, eq(transactionsTable.spaceId, spacesTable.id))
        .where(and(...conditions))
        .orderBy(desc(transactionsTable.amount))

      // Calcular métricas
      const totalIncome = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)

      const totalExpenses = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)

      const netIncome = totalIncome - totalExpenses
      const transactionCount = transactions.length
      const expenseCount = transactions.filter(t => t.type === 'EXPENSE').length
      const incomeCount = transactions.filter(t => t.type === 'INCOME').length

      // Maior despesa
      const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE')
      const largestExpense = expenseTransactions.length > 0 
        ? expenseTransactions.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))[0] 
        : null

      // Maior receita
      const incomeTransactions = transactions.filter(t => t.type === 'INCOME')
      const largestIncome = incomeTransactions.length > 0
        ? incomeTransactions.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))[0]
        : null

      // Despesa média
      const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0

      // Receita média
      const averageIncome = incomeCount > 0 ? totalIncome / incomeCount : 0

      // Categorias únicas
      const uniqueCategories = new Set(
        transactions
          .filter(t => t.categoryName)
          .map(t => t.categoryName)
      ).size

      // Espaços únicos
      const uniqueSpaces = new Set(
        transactions
          .filter(t => t.spaceName)
          .map(t => t.spaceName)
      ).size

      return {
        totalIncome,
        totalExpenses,
        netIncome,
        transactionCount,
        expenseCount,
        incomeCount,
        largestExpense: largestExpense ? {
          id: largestExpense.id,
          amount: parseFloat(largestExpense.amount),
          description: largestExpense.description,
          categoryName: largestExpense.categoryName,
          spaceName: largestExpense.spaceName,
          formattedAmount: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(parseFloat(largestExpense.amount)),
        } : null,
        largestIncome: largestIncome ? {
          id: largestIncome.id,
          amount: parseFloat(largestIncome.amount),
          description: largestIncome.description,
          categoryName: largestIncome.categoryName,
          spaceName: largestIncome.spaceName,
          formattedAmount: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(parseFloat(largestIncome.amount)),
        } : null,
        averageExpense,
        averageIncome,
        uniqueCategories,
        uniqueSpaces,
        formattedTotalIncome: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(totalIncome),
        formattedTotalExpenses: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(totalExpenses),
        formattedNetIncome: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(netIncome),
        formattedAverageExpense: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(averageExpense),
        formattedAverageIncome: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(averageIncome),
      }
    }

    // Calcular período de comparação (período anterior de mesma duração)
    const calculatePreviousPeriod = (start?: string, end?: string) => {
      if (!start || !end) return { previousStart: undefined, previousEnd: undefined }

      const startDateObj = new Date(start)
      const endDateObj = new Date(end)
      const periodDuration = endDateObj.getTime() - startDateObj.getTime()

      const previousEndDate = new Date(startDateObj.getTime() - 1) // 1 dia antes do início
      const previousStartDate = new Date(previousEndDate.getTime() - periodDuration)

      return {
        previousStart: previousStartDate.toISOString().split('T')[0],
        previousEnd: previousEndDate.toISOString().split('T')[0],
      }
    }

    // Calcular métricas do período atual
    const currentMetrics = await calculatePeriodMetrics(startDate || undefined, endDate || undefined)

    // Calcular métricas do período anterior (apenas se houver datas definidas)
    let previousMetrics = null
    let comparison = null

    if (startDate && endDate) {
      const { previousStart, previousEnd } = calculatePreviousPeriod(startDate, endDate)
      if (previousStart && previousEnd) {
        previousMetrics = await calculatePeriodMetrics(previousStart, previousEnd)

        // Calcular comparações percentuais
        const calculatePercentageChange = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0
          return ((current - previous) / previous) * 100
        }

        comparison = {
          totalIncomeChange: calculatePercentageChange(currentMetrics.totalIncome, previousMetrics.totalIncome),
          totalExpensesChange: calculatePercentageChange(currentMetrics.totalExpenses, previousMetrics.totalExpenses),
          netIncomeChange: calculatePercentageChange(currentMetrics.netIncome, previousMetrics.netIncome),
          transactionCountChange: calculatePercentageChange(currentMetrics.transactionCount, previousMetrics.transactionCount),
          averageExpenseChange: calculatePercentageChange(currentMetrics.averageExpense, previousMetrics.averageExpense),
          averageIncomeChange: calculatePercentageChange(currentMetrics.averageIncome, previousMetrics.averageIncome),
        }
      }
    }

    return NextResponse.json({
      current: currentMetrics,
      previous: previousMetrics,
      comparison,
      period: {
        start: startDate,
        end: endDate,
        hasComparison: !!comparison,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar métricas de resumo:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar métricas de resumo' },
      { status: 500 }
    )
  }
} 