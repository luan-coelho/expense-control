import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { transactionsTable, accountsTable } from '@/db/schema'
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const spaceId = searchParams.get('spaceId')
    const accountId = searchParams.get('accountId')

    // Construir condições da query
    const conditions = [eq(transactionsTable.userId, session.user.id)]

    if (startDate) {
      conditions.push(gte(transactionsTable.date, new Date(startDate)))
    }

    if (endDate) {
      conditions.push(lte(transactionsTable.date, new Date(endDate)))
    }

    if (spaceId) {
      conditions.push(eq(transactionsTable.spaceId, spaceId))
    }

    if (accountId) {
      conditions.push(eq(transactionsTable.accountId, accountId))
    }

    // Buscar todas as transações ordenadas por data
    const transactions = await db
      .select({
        id: transactionsTable.id,
        date: transactionsTable.date,
        amount: transactionsTable.amount,
        type: transactionsTable.type,
        accountId: transactionsTable.accountId,
      })
      .from(transactionsTable)
      .where(and(...conditions))
      .orderBy(transactionsTable.date, transactionsTable.id)

    // Calcular evolução do saldo
    const balanceEvolution: Array<{
      date: string
      balance: number
      cumulativeIncome: number
      cumulativeExpenses: number
      dailyChange: number
      formattedBalance: string
      formattedDailyChange: string
    }> = []

    let runningBalance = 0
    let cumulativeIncome = 0
    let cumulativeExpenses = 0

    // Agrupar transações por data
    const transactionsByDate = transactions.reduce(
      (acc, transaction) => {
        const dateKey = transaction.date.toISOString().split('T')[0]
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(transaction)
        return acc
      },
      {} as Record<string, typeof transactions>,
    )

    // Processar cada data
    const sortedDates = Object.keys(transactionsByDate).sort()

    for (const dateKey of sortedDates) {
      const dayTransactions = transactionsByDate[dateKey]
      let dailyChange = 0

      for (const transaction of dayTransactions) {
        const amount = Number(transaction.amount)

        if (transaction.type === 'INCOME') {
          runningBalance += amount
          cumulativeIncome += amount
          dailyChange += amount
        } else if (transaction.type === 'EXPENSE') {
          runningBalance -= amount
          cumulativeExpenses += amount
          dailyChange -= amount
        }
      }

      balanceEvolution.push({
        date: dateKey,
        balance: runningBalance,
        cumulativeIncome,
        cumulativeExpenses,
        dailyChange,
        formattedBalance: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(runningBalance / 100),
        formattedDailyChange: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(dailyChange / 100),
      })
    }

    // Se não há transações, adicionar ponto inicial com saldo inicial
    if (balanceEvolution.length === 0 && runningBalance > 0) {
      const today = new Date().toISOString().split('T')[0]
      balanceEvolution.push({
        date: today,
        balance: runningBalance,
        cumulativeIncome: 0,
        cumulativeExpenses: 0,
        dailyChange: 0,
        formattedBalance: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(runningBalance / 100),
        formattedDailyChange: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(0),
      })
    }

    // Calcular estatísticas
    const finalBalance =
      balanceEvolution.length > 0 ? balanceEvolution[balanceEvolution.length - 1].balance : runningBalance
    const initialBalance =
      balanceEvolution.length > 0 ? balanceEvolution[0].balance - balanceEvolution[0].dailyChange : runningBalance
    const totalChange = finalBalance - initialBalance
    const maxBalance = Math.max(...balanceEvolution.map(item => item.balance), initialBalance)
    const minBalance = Math.min(...balanceEvolution.map(item => item.balance), initialBalance)

    return NextResponse.json({
      data: balanceEvolution,
      summary: {
        initialBalance,
        finalBalance,
        totalChange,
        maxBalance,
        minBalance,
        totalTransactions: transactions.length,
        periodDays: balanceEvolution.length,
        formattedInitialBalance: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(initialBalance / 100),
        formattedFinalBalance: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(finalBalance / 100),
        formattedTotalChange: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(totalChange / 100),
        formattedMaxBalance: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(maxBalance / 100),
        formattedMinBalance: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(minBalance / 100),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar evolução do saldo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
