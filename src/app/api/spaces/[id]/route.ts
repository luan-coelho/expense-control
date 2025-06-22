import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { spacesTable, usersTable, transactionsTable } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { updateSpaceSchema, spaceIdSchema, sanitizeSpaceName, type SpaceWithRelations } from '@/types/space'
import { ZodError } from 'zod'

// GET - Buscar espaço por ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Validar ID do espaço
    const resolvedParams = await params
    const idValidation = spaceIdSchema.safeParse({ id: resolvedParams.id })

    if (!idValidation.success) {
      return NextResponse.json(
        {
          error: 'ID do espaço inválido',
          details: idValidation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    const spaceId = idValidation.data.id

    // Buscar espaço com relacionamentos
    const space = await db
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
      .where(and(eq(spacesTable.id, spaceId), eq(spacesTable.userId, session.user.id)))
      .limit(1)

    if (space.length === 0) {
      return NextResponse.json({ error: 'Espaço não encontrado' }, { status: 404 })
    }

    const result = space[0]
    return NextResponse.json({
      ...result,
      userId: result.user?.id || '',
      user: result.user?.id ? result.user : null,
    } as SpaceWithRelations)
  } catch (error) {
    console.error('Erro ao buscar espaço:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar espaço
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const resolvedParams = await params

    // Validar ID do espaço
    const idValidation = spaceIdSchema.safeParse({ id: resolvedParams.id })

    if (!idValidation.success) {
      return NextResponse.json(
        {
          error: 'ID do espaço inválido',
          details: idValidation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    const spaceId = idValidation.data.id
    const body = await request.json()

    // Validar dados
    const validationResult = updateSpaceSchema.safeParse(body)

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

    // Verificar se o espaço existe e se o usuário pode editá-lo
    const existingSpace = await db
      .select({
        id: spacesTable.id,
        userId: spacesTable.userId,
      })
      .from(spacesTable)
      .where(eq(spacesTable.id, spaceId))
      .limit(1)

    if (existingSpace.length === 0) {
      return NextResponse.json({ error: 'Espaço não encontrado' }, { status: 404 })
    }

    const space = existingSpace[0]

    // Usuários só podem editar seus próprios espaços
    if (space.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: 'Você não tem permissão para editar este espaço',
        },
        { status: 403 },
      )
    }

    // Verificar se já existe um espaço com o mesmo nome (se o nome foi alterado)
    if (validatedData.name) {
      const sanitizedName = sanitizeSpaceName(validatedData.name)

      const duplicateSpace = await db
        .select({ id: spacesTable.id })
        .from(spacesTable)
        .where(and(eq(spacesTable.name, sanitizedName), eq(spacesTable.userId, session.user.id)))
        .limit(1)

      if (duplicateSpace.length > 0 && duplicateSpace[0].id !== spaceId) {
        return NextResponse.json(
          {
            error: 'Já existe um espaço com este nome',
            field: 'name',
          },
          { status: 400 },
        )
      }

      // Preparar dados para atualização
      const updateData: any = {
        updatedAt: new Date(),
        name: sanitizedName,
      }

      // Atualizar espaço
      await db.update(spacesTable).set(updateData).where(eq(spacesTable.id, spaceId))
    }

    // Buscar espaço atualizado com relacionamentos
    const updatedSpace = await db
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
      .where(eq(spacesTable.id, spaceId))
      .limit(1)

    const result = updatedSpace[0]
    return NextResponse.json({
      ...result,
      userId: result.user?.id || '',
      user: result.user?.id ? result.user : null,
    } as SpaceWithRelations)
  } catch (error) {
    console.error('Erro ao atualizar espaço:', error)

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

// DELETE - Excluir espaço
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const resolvedParams = await params

    // Validar ID do espaço
    const idValidation = spaceIdSchema.safeParse({ id: resolvedParams.id })

    if (!idValidation.success) {
      return NextResponse.json(
        {
          error: 'ID do espaço inválido',
          details: idValidation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    const spaceId = idValidation.data.id

    // Verificar se o espaço existe e se o usuário pode excluí-lo
    const existingSpace = await db
      .select({
        id: spacesTable.id,
        userId: spacesTable.userId,
        name: spacesTable.name,
      })
      .from(spacesTable)
      .where(eq(spacesTable.id, spaceId))
      .limit(1)

    if (existingSpace.length === 0) {
      return NextResponse.json({ error: 'Espaço não encontrado' }, { status: 404 })
    }

    const space = existingSpace[0]

    // Usuários só podem excluir seus próprios espaços
    if (space.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: 'Você não tem permissão para excluir este espaço',
        },
        { status: 403 },
      )
    }

    // Verificar se existem transações vinculadas a este espaço
    const [{ transactionCount }] = await db
      .select({ transactionCount: count() })
      .from(transactionsTable)
      .where(eq(transactionsTable.spaceId, spaceId))

    if (transactionCount > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir este espaço pois existem ${transactionCount} transação(ões) vinculada(s) a ele`,
          relatedCount: transactionCount,
        },
        { status: 400 },
      )
    }

    // Excluir espaço
    await db.delete(spacesTable).where(eq(spacesTable.id, spaceId))

    return NextResponse.json({
      message: 'Espaço excluído com sucesso',
      deletedSpace: {
        id: space.id,
        name: space.name,
      },
    })
  } catch (error) {
    console.error('Erro ao excluir espaço:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
