import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { transactionsTable, categoriesTable, spacesTable, accountsTable } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { updateTransactionSchema, parseTransactionAmount, type TransactionWithRelations } from '@/types/transaction'

// GET - Buscar transação por ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: transactionId } = await params

    // Buscar transação com relacionamentos
    const transaction = await db
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
      .where(and(eq(transactionsTable.id, transactionId), eq(transactionsTable.userId, session.user.id)))
      .limit(1)

    if (transaction.length === 0) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    return NextResponse.json(transaction[0] as TransactionWithRelations)
  } catch (error) {
    console.error('Erro ao buscar transação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar transação
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: transactionId } = await params
    const body = await request.json()

    // Validar dados
    const validatedData = updateTransactionSchema.parse(body)

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await db
      .select({ id: transactionsTable.id })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.id, transactionId), eq(transactionsTable.userId, session.user.id)))
      .limit(1)

    if (existingTransaction.length === 0) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validatedData.amount !== undefined) {
      updateData.amount = parseTransactionAmount(validatedData.amount)
    }
    if (validatedData.date !== undefined) {
      updateData.date = new Date(validatedData.date)
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description
    }
    if (validatedData.categoryId !== undefined) {
      updateData.categoryId = validatedData.categoryId
    }
    if (validatedData.spaceId !== undefined) {
      updateData.spaceId = validatedData.spaceId
    }
    if (validatedData.accountId !== undefined) {
      updateData.accountId = validatedData.accountId
    }
    if (validatedData.type !== undefined) {
      updateData.type = validatedData.type
    }
    if (validatedData.isRecurrent !== undefined) {
      updateData.isRecurrent = validatedData.isRecurrent
    }
    if (validatedData.recurrencePattern !== undefined) {
      updateData.recurrencePattern = validatedData.recurrencePattern
    }

    // Atualizar transação
    await db.update(transactionsTable).set(updateData).where(eq(transactionsTable.id, transactionId))

    // Buscar transação atualizada com relacionamentos
    const updatedTransaction = await db
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
      .where(eq(transactionsTable.id, transactionId))
      .limit(1)

    return NextResponse.json(updatedTransaction[0] as TransactionWithRelations)
  } catch (error) {
    console.error('Erro ao atualizar transação:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Excluir transação
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: transactionId } = await params

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await db
      .select({ id: transactionsTable.id })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.id, transactionId), eq(transactionsTable.userId, session.user.id)))
      .limit(1)

    if (existingTransaction.length === 0) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    // Excluir transação
    await db.delete(transactionsTable).where(eq(transactionsTable.id, transactionId))

    return NextResponse.json({ success: true, message: 'Transação excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir transação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
