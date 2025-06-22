import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { transactionsTable, categoriesTable } from '@/db/schema'
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
    const spaceId = searchParams.get('spaceId')

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

    // Buscar dados agrupados por categoria
    const spendingByCategory = await db
      .select({
        categoryId: transactionsTable.categoryId,
        categoryName: categoriesTable.name,
        categoryColor: categoriesTable.color,
        categoryIcon: categoriesTable.icon,
        totalAmount: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'EXPENSE' THEN ${transactionsTable.amount} ELSE 0 END), 0)`,
        transactionCount: sql<number>`COUNT(CASE WHEN ${transactionsTable.type} = 'EXPENSE' THEN 1 END)`,
      })
      .from(transactionsTable)
      .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
      .where(and(...conditions))
      .groupBy(transactionsTable.categoryId, categoriesTable.name, categoriesTable.color, categoriesTable.icon)
      .having(sql`SUM(CASE WHEN ${transactionsTable.type} = 'EXPENSE' THEN ${transactionsTable.amount} ELSE 0 END) > 0`)
      .orderBy(
        desc(sql`SUM(CASE WHEN ${transactionsTable.type} = 'EXPENSE' THEN ${transactionsTable.amount} ELSE 0 END)`),
      )

    // Calcular total geral para percentuais
    const totalSpending = spendingByCategory.reduce((sum, item) => sum + item.totalAmount, 0)

    // Formatar dados para o gráfico
    const chartData = spendingByCategory.map(item => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName || 'Sem categoria',
      color: item.categoryColor || '#6b7280',
      icon: item.categoryIcon || 'Tag',
      amount: item.totalAmount,
      percentage: totalSpending > 0 ? (item.totalAmount / totalSpending) * 100 : 0,
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
        totalCategories: chartData.length,
        formattedTotalSpending: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(totalSpending / 100),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar gastos por categoria:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
