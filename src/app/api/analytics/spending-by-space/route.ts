import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { transactionsTable, spacesTable } from '@/db/schema'
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm'

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
    const accountId = searchParams.get('accountId')

    // Construir condições da query
    const conditions = [eq(transactionsTable.userId, session.user.id)]

    if (startDate) {
      conditions.push(gte(transactionsTable.date, new Date(startDate)))
    }

    if (endDate) {
      conditions.push(lte(transactionsTable.date, new Date(endDate)))
    }

    if (accountId) {
      conditions.push(eq(transactionsTable.accountId, accountId))
    }

    // Buscar dados agrupados por espaço
    const spendingBySpace = await db
      .select({
        spaceId: transactionsTable.spaceId,
        spaceName: spacesTable.name,
        totalAmount: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'EXPENSE' THEN ${transactionsTable.amount} ELSE 0 END), 0)`,
        transactionCount: sql<number>`COUNT(CASE WHEN ${transactionsTable.type} = 'EXPENSE' THEN 1 END)`,
      })
      .from(transactionsTable)
      .leftJoin(spacesTable, eq(transactionsTable.spaceId, spacesTable.id))
      .where(and(...conditions))
      .groupBy(transactionsTable.spaceId, spacesTable.name)
      .having(sql`SUM(CASE WHEN ${transactionsTable.type} = 'EXPENSE' THEN ${transactionsTable.amount} ELSE 0 END) > 0`)
      .orderBy(desc(sql`SUM(CASE WHEN ${transactionsTable.type} = 'EXPENSE' THEN ${transactionsTable.amount} ELSE 0 END)`))

    // Calcular total geral para percentuais
    const totalSpending = spendingBySpace.reduce((sum, item) => sum + item.totalAmount, 0)

    // Cores para os espaços (baseado no padrão dos gráficos existentes)
    const spaceColors = [
      '#10b981', // green-500
      '#3b82f6', // blue-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#8b5cf6', // violet-500
      '#06b6d4', // cyan-500
      '#f97316', // orange-500
      '#84cc16', // lime-500
      '#ec4899', // pink-500
      '#6b7280', // gray-500
    ]

    // Formatar dados para o gráfico
    const chartData = spendingBySpace.map((item, index) => ({
      spaceId: item.spaceId,
      spaceName: item.spaceName || 'Sem espaço',
      color: spaceColors[index % spaceColors.length],
      amount: item.totalAmount,
      percentage: totalSpending > 0 ? ((item.totalAmount / totalSpending) * 100) : 0,
      transactionCount: item.transactionCount,
      formattedAmount: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(item.totalAmount / 100), // Assumindo que o valor está em centavos
    }))

    return NextResponse.json({
      data: chartData,
      summary: {
        totalSpending,
        totalSpaces: chartData.length,
        formattedTotalSpending: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(totalSpending / 100),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar gastos por espaço:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 