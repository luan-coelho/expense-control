import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { categoriesTable, usersTable, transactionsTable } from '@/db/schema'
import { eq, and, isNull, or, count } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { updateCategorySchema, type CategoryWithRelations } from '@/types/category'

// GET - Buscar categoria por ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const resolvedParams = await params
    const categoryId = resolvedParams.id

    // Buscar categoria com relacionamentos
    // Incluir categorias predefinidas (userId = null) e categorias do usuário
    const category = await db
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
      .where(
        and(
          eq(categoriesTable.id, categoryId),
          or(isNull(categoriesTable.userId), eq(categoriesTable.userId, session.user.id)),
        ),
      )
      .limit(1)

    if (category.length === 0) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    const result = category[0]
    return NextResponse.json({
      ...result,
      user: result.user?.id ? result.user : null,
    } as CategoryWithRelations)
  } catch (error) {
    console.error('Erro ao buscar categoria:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar categoria
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const resolvedParams = await params
    const categoryId = resolvedParams.id
    const body = await request.json()

    // Validar dados
    const validatedData = updateCategorySchema.parse(body)

    // Verificar se a categoria existe e se o usuário pode editá-la
    const existingCategory = await db
      .select({
        id: categoriesTable.id,
        userId: categoriesTable.userId,
        isDefault: categoriesTable.isDefault,
      })
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .limit(1)

    if (existingCategory.length === 0) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    const category = existingCategory[0]

    // Usuários não podem editar categorias predefinidas do sistema
    if (category.isDefault && !category.userId) {
      return NextResponse.json(
        {
          error: 'Não é possível editar categorias predefinidas do sistema',
        },
        { status: 403 },
      )
    }

    // Usuários só podem editar suas próprias categorias
    if (category.userId && category.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: 'Você não tem permissão para editar esta categoria',
        },
        { status: 403 },
      )
    }

    // Verificar se a categoria pai existe (se especificada)
    if (validatedData.parentId) {
      // Não permitir que uma categoria seja pai de si mesma
      if (validatedData.parentId === categoryId) {
        return NextResponse.json(
          {
            error: 'Uma categoria não pode ser pai de si mesma',
          },
          { status: 400 },
        )
      }

      const parentCategory = await db
        .select({ id: categoriesTable.id })
        .from(categoriesTable)
        .where(
          and(
            eq(categoriesTable.id, validatedData.parentId),
            or(isNull(categoriesTable.userId), eq(categoriesTable.userId, session.user.id)),
          ),
        )
        .limit(1)

      if (parentCategory.length === 0) {
        return NextResponse.json({ error: 'Categoria pai não encontrada' }, { status: 400 })
      }
    }

    // Verificar se já existe uma categoria com o mesmo nome (se o nome foi alterado)
    if (validatedData.name) {
      const duplicateCategory = await db
        .select({ id: categoriesTable.id })
        .from(categoriesTable)
        .where(
          and(
            eq(categoriesTable.name, validatedData.name),
            eq(categoriesTable.userId, session.user.id),
            validatedData.type ? eq(categoriesTable.type, validatedData.type) : undefined,
          ),
        )
        .limit(1)

      if (duplicateCategory.length > 0 && duplicateCategory[0].id !== categoryId) {
        return NextResponse.json(
          {
            error: 'Já existe uma categoria com este nome',
          },
          { status: 400 },
        )
      }
    }

    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }
    if (validatedData.type !== undefined) {
      updateData.type = validatedData.type
    }
    if (validatedData.icon !== undefined) {
      updateData.icon = validatedData.icon
    }
    if (validatedData.color !== undefined) {
      updateData.color = validatedData.color
    }
    if (validatedData.parentId !== undefined) {
      updateData.parentId = validatedData.parentId
    }
    if (validatedData.sortOrder !== undefined) {
      updateData.sortOrder = validatedData.sortOrder
    }

    // Atualizar categoria
    await db.update(categoriesTable).set(updateData).where(eq(categoriesTable.id, categoryId))

    // Buscar categoria atualizada com relacionamentos
    const updatedCategory = await db
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
      .where(eq(categoriesTable.id, categoryId))
      .limit(1)

    const result = updatedCategory[0]
    return NextResponse.json({
      ...result,
      user: result.user?.id ? result.user : null,
    } as CategoryWithRelations)
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Excluir categoria
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const resolvedParams = await params
    const categoryId = resolvedParams.id

    // Verificar se a categoria existe e se o usuário pode excluí-la
    const existingCategory = await db
      .select({
        id: categoriesTable.id,
        userId: categoriesTable.userId,
        isDefault: categoriesTable.isDefault,
        name: categoriesTable.name,
      })
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .limit(1)

    if (existingCategory.length === 0) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    const category = existingCategory[0]

    // Usuários não podem excluir categorias predefinidas do sistema
    if (category.isDefault && !category.userId) {
      return NextResponse.json(
        {
          error: 'Não é possível excluir categorias predefinidas do sistema',
        },
        { status: 403 },
      )
    }

    // Usuários só podem excluir suas próprias categorias
    if (category.userId && category.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: 'Você não tem permissão para excluir esta categoria',
        },
        { status: 403 },
      )
    }

    // Verificar se a categoria está sendo usada em transações
    const [{ transactionCount }] = await db
      .select({ transactionCount: count() })
      .from(transactionsTable)
      .where(eq(transactionsTable.categoryId, categoryId))

    if (transactionCount > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir a categoria "${category.name}" pois ela está sendo usada em ${transactionCount} transação(ões)`,
        },
        { status: 400 },
      )
    }

    // Verificar se a categoria tem subcategorias
    const [{ childrenCount }] = await db
      .select({ childrenCount: count() })
      .from(categoriesTable)
      .where(eq(categoriesTable.parentId, categoryId))

    if (childrenCount > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir a categoria "${category.name}" pois ela possui ${childrenCount} subcategoria(s)`,
        },
        { status: 400 },
      )
    }

    // Excluir categoria
    await db.delete(categoriesTable).where(eq(categoriesTable.id, categoryId))

    return NextResponse.json({
      message: 'Categoria excluída com sucesso',
      id: categoryId,
    })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
