import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { spacesTable, usersTable } from '@/db/schema'
import { eq, and, ilike, desc, count } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import {
  createSpaceSchema,
  spaceQuerySchema,
  sanitizeSpaceName,
  type SpaceWithRelations,
  type PaginatedSpaces,
} from '@/types/space'
import { ZodError } from 'zod'

// GET - Listar espaços com filtros e paginação
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Validar parâmetros de consulta
    const queryValidation = spaceQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
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

    const { page, limit, search } = queryValidation.data
    const offset = (page - 1) * limit

    // Construir condições WHERE
    const conditions = [eq(spacesTable.userId, session.user.id)]

    if (search) {
      conditions.push(ilike(spacesTable.name, `%${search}%`))
    }

    // Buscar espaços com relacionamentos
    const spaces = await db
      .select({
        id: spacesTable.id,
        name: spacesTable.name,
        createdAt: spacesTable.createdAt,
        updatedAt: spacesTable.updatedAt,
        user: {
          id: usersTable.id,
          name: usersTable.name,
        },
      })
      .from(spacesTable)
      .leftJoin(usersTable, eq(spacesTable.userId, usersTable.id))
      .where(and(...conditions))
      .orderBy(spacesTable.name)
      .limit(limit)
      .offset(offset)

    // Contar total de registros
    const [{ total }] = await db
      .select({ total: count() })
      .from(spacesTable)
      .where(and(...conditions))

    // Calcular metadados de paginação
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const response: PaginatedSpaces = {
      spaces: spaces.map(space => ({
        ...space,
        userId: space.user?.id || '',
        user: space.user?.id ? space.user : null,
      })) as SpaceWithRelations[],
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
    console.error('Erro ao buscar espaços:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar novo espaço
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar dados
    const validationResult = createSpaceSchema.safeParse(body)

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
    const sanitizedName = sanitizeSpaceName(validatedData.name)

    // Verificar se já existe um espaço com o mesmo nome para o usuário
    const existingSpace = await db
      .select({ id: spacesTable.id })
      .from(spacesTable)
      .where(and(eq(spacesTable.name, sanitizedName), eq(spacesTable.userId, session.user.id)))
      .limit(1)

    if (existingSpace.length > 0) {
      return NextResponse.json(
        {
          error: 'Já existe um espaço com este nome',
          field: 'name',
        },
        { status: 400 },
      )
    }

    // Criar espaço
    const [newSpace] = await db
      .insert(spacesTable)
      .values({
        userId: session.user.id,
        name: sanitizedName,
      })
      .returning()

    // Buscar espaço criado com relacionamentos
    const spaceWithRelations = await db
      .select({
        id: spacesTable.id,
        name: spacesTable.name,
        createdAt: spacesTable.createdAt,
        updatedAt: spacesTable.updatedAt,
        user: {
          id: usersTable.id,
          name: usersTable.name,
        },
      })
      .from(spacesTable)
      .leftJoin(usersTable, eq(spacesTable.userId, usersTable.id))
      .where(eq(spacesTable.id, newSpace.id))
      .limit(1)

    const result = spaceWithRelations[0]
    return NextResponse.json(
      {
        ...result,
        userId: result.user?.id || '',
        user: result.user?.id ? result.user : null,
      } as SpaceWithRelations,
      { status: 201 },
    )
  } catch (error) {
    console.error('Erro ao criar espaço:', error)

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
