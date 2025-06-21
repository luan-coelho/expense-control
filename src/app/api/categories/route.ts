import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { categoriesTable, usersTable } from '@/db/schema'
import { eq, and, ilike, desc, count, isNull, or } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { 
  createCategorySchema, 
  categoryFiltersSchema,
  type CategoryWithRelations,
  type PaginatedCategories
} from '@/types/category'

// GET - Listar categorias com filtros e paginação
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parâmetros de paginação
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Preparar filtros (remover valores null)
    const rawFilters = {
      type: searchParams.get('type'),
      isDefault: searchParams.get('isDefault'),
      parentId: searchParams.get('parentId'),
      search: searchParams.get('search'),
    }

    // Filtrar apenas valores não nulos
    const cleanFilters = Object.fromEntries(
      Object.entries(rawFilters).filter(([_, value]) => value !== null)
    )

    // Validar filtros
    const filters = categoryFiltersSchema.parse(cleanFilters)

    // Construir condições WHERE
    // Incluir categorias predefinidas (userId = null) e categorias do usuário
    const conditions = [
      or(
        isNull(categoriesTable.userId),
        eq(categoriesTable.userId, session.user.id)
      )
    ]

    if (filters.type) {
      conditions.push(eq(categoriesTable.type, filters.type))
    }
    if (filters.isDefault !== undefined) {
      conditions.push(eq(categoriesTable.isDefault, filters.isDefault))
    }
    if (filters.parentId !== undefined) {
      if (filters.parentId === null) {
        conditions.push(isNull(categoriesTable.parentId))
      } else {
        conditions.push(eq(categoriesTable.parentId, filters.parentId))
      }
    }
    if (filters.search) {
      conditions.push(ilike(categoriesTable.name, `%${filters.search}%`))
    }

    // Buscar categorias com relacionamentos
    const categories = await db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        type: categoriesTable.type,
        icon: categoriesTable.icon,
        color: categoriesTable.color,
        parentId: categoriesTable.parentId,
        sortOrder: categoriesTable.sortOrder,
        isDefault: categoriesTable.isDefault,
        createdAt: categoriesTable.createdAt,
        updatedAt: categoriesTable.updatedAt,
        user: {
          id: usersTable.id,
          name: usersTable.name,
        },
      })
      .from(categoriesTable)
      .leftJoin(usersTable, eq(categoriesTable.userId, usersTable.id))
      .where(and(...conditions))
      .orderBy(categoriesTable.sortOrder, categoriesTable.name)
      .limit(limit)
      .offset(offset)

    // Contar total de registros
    const [{ total }] = await db
      .select({ total: count() })
      .from(categoriesTable)
      .where(and(...conditions))

    // Calcular metadados de paginação
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const response: PaginatedCategories = {
      categories: categories.map(category => ({
        ...category,
        user: category.user?.id ? category.user : null,
      })) as CategoryWithRelations[],
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
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar nova categoria
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validar dados
    const validatedData = createCategorySchema.parse(body)

    // Verificar se a categoria pai existe (se especificada)
    if (validatedData.parentId) {
      const parentCategory = await db
        .select({ id: categoriesTable.id })
        .from(categoriesTable)
        .where(
          and(
            eq(categoriesTable.id, validatedData.parentId),
            or(
              isNull(categoriesTable.userId),
              eq(categoriesTable.userId, session.user.id)
            )
          )
        )
        .limit(1)

      if (parentCategory.length === 0) {
        return NextResponse.json({ error: 'Categoria pai não encontrada' }, { status: 400 })
      }
    }

    // Verificar se já existe uma categoria com o mesmo nome para o usuário
    const existingCategory = await db
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(
        and(
          eq(categoriesTable.name, validatedData.name),
          eq(categoriesTable.userId, session.user.id),
          eq(categoriesTable.type, validatedData.type)
        )
      )
      .limit(1)

    if (existingCategory.length > 0) {
      return NextResponse.json({ 
        error: 'Já existe uma categoria com este nome' 
      }, { status: 400 })
    }

    // Gerar sortOrder se não fornecido
    const sortOrder = validatedData.sortOrder || 
      new Date().getTime().toString().slice(-6)

    // Criar categoria
    const [newCategory] = await db
      .insert(categoriesTable)
      .values({
        userId: session.user.id,
        name: validatedData.name,
        type: validatedData.type,
        icon: validatedData.icon,
        color: validatedData.color,
        parentId: validatedData.parentId,
        sortOrder,
        isDefault: false, // Categorias criadas por usuários nunca são padrão
      })
      .returning()

    // Buscar categoria criada com relacionamentos
    const categoryWithRelations = await db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        type: categoriesTable.type,
        icon: categoriesTable.icon,
        color: categoriesTable.color,
        parentId: categoriesTable.parentId,
        sortOrder: categoriesTable.sortOrder,
        isDefault: categoriesTable.isDefault,
        createdAt: categoriesTable.createdAt,
        updatedAt: categoriesTable.updatedAt,
        user: {
          id: usersTable.id,
          name: usersTable.name,
        },
      })
      .from(categoriesTable)
      .leftJoin(usersTable, eq(categoriesTable.userId, usersTable.id))
      .where(eq(categoriesTable.id, newCategory.id))
      .limit(1)

    const result = categoryWithRelations[0]
    return NextResponse.json({
      ...result,
      user: result.user?.id ? result.user : null,
    } as CategoryWithRelations, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 