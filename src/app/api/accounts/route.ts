import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { accountsTable, usersTable } from '@/db/schema'
import { eq, and, ilike, desc, count } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import {
  createAccountSchema,
  accountQuerySchema,
  sanitizeAccountName,
  isValidAccountType,
  type AccountWithRelations,
  type PaginatedAccounts,
} from '@/types/account'
import { ZodError } from 'zod'

// GET - Listar contas com filtros e paginação
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Validar parâmetros de consulta
    const queryValidation = accountQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      type: searchParams.get('type'),
      search: searchParams.get('search'),
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: 'Parâmetros de consulta inválidos',
          details: queryValidation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    const { page, limit, type, search } = queryValidation.data
    const offset = (page - 1) * limit

    // Construir condições WHERE
    const conditions = [eq(accountsTable.userId, session.user.id)]

    if (type) {
      conditions.push(eq(accountsTable.type, type))
    }

    if (search) {
      conditions.push(ilike(accountsTable.name, `%${search}%`))
    }

    // Buscar contas com relacionamentos
    const accounts = await db
      .select({
        id: accountsTable.id,
        name: accountsTable.name,
        type: accountsTable.type,
        createdAt: accountsTable.createdAt,
        updatedAt: accountsTable.updatedAt,
        user: {
          id: usersTable.id,
          name: usersTable.name,
        },
      })
      .from(accountsTable)
      .leftJoin(usersTable, eq(accountsTable.userId, usersTable.id))
      .where(and(...conditions))
      .orderBy(accountsTable.name)
      .limit(limit)
      .offset(offset)

    // Contar total de registros
    const [{ total }] = await db
      .select({ total: count() })
      .from(accountsTable)
      .where(and(...conditions))

    // Calcular metadados de paginação
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const response: PaginatedAccounts = {
      accounts: accounts.map(account => ({
        ...account,
        userId: account.user?.id || '',
        user: account.user?.id ? account.user : null,
      })) as AccountWithRelations[],
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
    console.error('Erro ao buscar contas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar nova conta
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar dados
    const validationResult = createAccountSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    const validatedData = validationResult.data

    // Sanitizar nome
    const sanitizedName = sanitizeAccountName(validatedData.name)

    // Validar tipo de conta
    if (!isValidAccountType(validatedData.type)) {
      return NextResponse.json(
        {
          error: 'Tipo de conta inválido',
          field: 'type',
        },
        { status: 400 },
      )
    }

    // Verificar se já existe uma conta com o mesmo nome para o usuário
    const existingAccount = await db
      .select({ id: accountsTable.id })
      .from(accountsTable)
      .where(and(eq(accountsTable.name, sanitizedName), eq(accountsTable.userId, session.user.id)))
      .limit(1)

    if (existingAccount.length > 0) {
      return NextResponse.json(
        {
          error: 'Já existe uma conta com este nome',
          field: 'name',
        },
        { status: 400 },
      )
    }

    // Criar conta
    const [newAccount] = await db
      .insert(accountsTable)
      .values({
        userId: session.user.id,
        name: sanitizedName,
        type: validatedData.type,
      })
      .returning()

    // Buscar conta criada com relacionamentos
    const accountWithRelations = await db
      .select({
        id: accountsTable.id,
        name: accountsTable.name,
        type: accountsTable.type,
        createdAt: accountsTable.createdAt,
        updatedAt: accountsTable.updatedAt,
        user: {
          id: usersTable.id,
          name: usersTable.name,
        },
      })
      .from(accountsTable)
      .leftJoin(usersTable, eq(accountsTable.userId, usersTable.id))
      .where(eq(accountsTable.id, newAccount.id))
      .limit(1)

    const result = accountWithRelations[0]
    return NextResponse.json(
      {
        ...result,
        userId: result.user?.id || '',
        user: result.user?.id ? result.user : null,
      } as AccountWithRelations,
      { status: 201 },
    )
  } catch (error) {
    console.error('Erro ao criar conta:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
