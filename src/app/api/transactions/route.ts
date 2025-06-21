import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { transactionsTable, categoriesTable, spacesTable, accountsTable } from '@/db/schema'
import { eq, and, gte, lte, ilike, desc, count } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { 
  createTransactionSchema, 
  transactionQuerySchema,
  parseTransactionAmount,
  type TransactionWithRelations,
  type PaginatedTransactions
} from '@/types/transaction'

// GET - Listar transações com filtros e paginação
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Validar parâmetros de consulta
    const queryValidation = transactionQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      categoryId: searchParams.get('categoryId'),
      spaceId: searchParams.get('spaceId'),
      accountId: searchParams.get('accountId'),
      type: searchParams.get('type'),
      minAmount: searchParams.get('minAmount'),
      maxAmount: searchParams.get('maxAmount'),
      search: searchParams.get('search'),
    })

    if (!queryValidation.success) {
      return NextResponse.json({ 
        error: 'Parâmetros de consulta inválidos',
        details: queryValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 })
    }

    const { 
      page, 
      limit, 
      startDate, 
      endDate, 
      categoryId, 
      spaceId, 
      accountId, 
      type, 
      minAmount, 
      maxAmount, 
      search 
    } = queryValidation.data
    const offset = (page - 1) * limit

    // Construir condições WHERE
    const conditions = [eq(transactionsTable.userId, session.user.id)]

    if (startDate) {
      conditions.push(gte(transactionsTable.date, new Date(startDate)))
    }
    if (endDate) {
      conditions.push(lte(transactionsTable.date, new Date(endDate)))
    }
    if (categoryId) {
      conditions.push(eq(transactionsTable.categoryId, categoryId))
    }
    if (spaceId) {
      conditions.push(eq(transactionsTable.spaceId, spaceId))
    }
    if (accountId) {
      conditions.push(eq(transactionsTable.accountId, accountId))
    }
    if (type) {
      conditions.push(eq(transactionsTable.type, type))
    }
    if (minAmount) {
      conditions.push(gte(transactionsTable.amount, minAmount))
    }
    if (maxAmount) {
      conditions.push(lte(transactionsTable.amount, maxAmount))
    }
    if (search) {
      conditions.push(ilike(transactionsTable.description, `%${search}%`))
    }

    // Buscar transações com relacionamentos
    const transactions = await db
      .select({
        id: transactionsTable.id,
        amount: transactionsTable.amount,
        date: transactionsTable.date,
        description: transactionsTable.description,
        type: transactionsTable.type,
        isRecurrent: transactionsTable.isRecurrent,
        recurrencePattern: transactionsTable.recurrencePattern,
        createdAt: transactionsTable.createdAt,
        updatedAt: transactionsTable.updatedAt,
        category: {
          id: categoriesTable.id,
          name: categoriesTable.name,
          icon: categoriesTable.icon,
        },
        space: {
          id: spacesTable.id,
          name: spacesTable.name,
        },
        account: {
          id: accountsTable.id,
          name: accountsTable.name,
          type: accountsTable.type,
        },
      })
      .from(transactionsTable)
      .innerJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
      .innerJoin(spacesTable, eq(transactionsTable.spaceId, spacesTable.id))
      .innerJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
      .where(and(...conditions))
      .orderBy(desc(transactionsTable.date))
      .limit(limit)
      .offset(offset)

    // Contar total de registros
    const [{ total }] = await db
      .select({ total: count() })
      .from(transactionsTable)
      .where(and(...conditions))

    // Calcular metadados de paginação
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const response: PaginatedTransactions = {
      transactions: transactions as TransactionWithRelations[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar nova transação
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validar dados
    const validatedData = createTransactionSchema.parse(body)

    // Converter amount para decimal
    const amount = parseTransactionAmount(validatedData.amount)

    // Criar transação
    const [newTransaction] = await db
      .insert(transactionsTable)
      .values({
        userId: session.user.id,
        amount,
        date: new Date(validatedData.date),
        description: validatedData.description,
        categoryId: validatedData.categoryId,
        spaceId: validatedData.spaceId,
        accountId: validatedData.accountId,
        type: validatedData.type,
        isRecurrent: validatedData.isRecurrent,
        recurrencePattern: validatedData.recurrencePattern,
      })
      .returning()

    // Buscar transação criada com relacionamentos
    const transactionWithRelations = await db
      .select({
        id: transactionsTable.id,
        amount: transactionsTable.amount,
        date: transactionsTable.date,
        description: transactionsTable.description,
        type: transactionsTable.type,
        isRecurrent: transactionsTable.isRecurrent,
        recurrencePattern: transactionsTable.recurrencePattern,
        createdAt: transactionsTable.createdAt,
        updatedAt: transactionsTable.updatedAt,
        category: {
          id: categoriesTable.id,
          name: categoriesTable.name,
          icon: categoriesTable.icon,
        },
        space: {
          id: spacesTable.id,
          name: spacesTable.name,
        },
        account: {
          id: accountsTable.id,
          name: accountsTable.name,
          type: accountsTable.type,
        },
      })
      .from(transactionsTable)
      .innerJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
      .innerJoin(spacesTable, eq(transactionsTable.spaceId, spacesTable.id))
      .innerJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
      .where(eq(transactionsTable.id, newTransaction.id))
      .limit(1)

    return NextResponse.json(transactionWithRelations[0], { status: 201 })
  } catch (error) {
    console.error('Erro ao criar transação:', error)
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 