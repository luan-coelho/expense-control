import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { transactionsTable } from '@/db/schema'
import { eq, and, sql, gte, lte } from 'drizzle-orm'

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

    // Buscar dados agrupados por mês e tipo
    const monthlyData = await db
      .select({
        year: sql<number>`EXTRACT(YEAR FROM ${transactionsTable.date})`,
        month: sql<number>`EXTRACT(MONTH FROM ${transactionsTable.date})`,
        totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'INCOME' THEN ${transactionsTable.amount} ELSE 0 END), 0)`,
        totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'EXPENSE' THEN ${transactionsTable.amount} ELSE 0 END), 0)`,
        transactionCount: sql<number>`COUNT(*)`,
      })
      .from(transactionsTable)
      .where(and(...conditions))
      .groupBy(
        sql`EXTRACT(YEAR FROM ${transactionsTable.date})`,
        sql`EXTRACT(MONTH FROM ${transactionsTable.date})`
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${transactionsTable.date})`,
        sql`EXTRACT(MONTH FROM ${transactionsTable.date})`
      )

    // Formatar dados para o gráfico
    const chartData = monthlyData.map((item) => {
      const monthNames = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ]
      
      const monthLabel = `${monthNames[item.month - 1]} ${item.year}`
      const netBalance = item.totalIncome - item.totalExpenses
      
      return {
        period: monthLabel,
        year: item.year,
        month: item.month,
        income: item.totalIncome,
        expenses: item.totalExpenses,
        netBalance,
        transactionCount: item.transactionCount,
        formattedIncome: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(item.totalIncome / 100),
        formattedExpenses: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(item.totalExpenses / 100),
        formattedNetBalance: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(netBalance / 100),
      }
    })

    // Calcular resumo
    const totalIncome = monthlyData.reduce((sum, item) => sum + item.totalIncome, 0)
    const totalExpenses = monthlyData.reduce((sum, item) => sum + item.totalExpenses, 0)
    const totalNetBalance = totalIncome - totalExpenses
    const totalTransactions = monthlyData.reduce((sum, item) => sum + item.transactionCount, 0)

    return NextResponse.json({
      data: chartData,
      summary: {
        totalIncome,
        totalExpenses,
        totalNetBalance,
        totalTransactions,
        periodCount: chartData.length,
        formattedTotalIncome: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(totalIncome / 100),
        formattedTotalExpenses: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(totalExpenses / 100),
        formattedTotalNetBalance: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(totalNetBalance / 100),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar dados mensais de receitas vs despesas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 