import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { accountsTable, usersTable, transactionsTable } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { 
  updateAccountSchema,
  accountIdSchema,
  sanitizeAccountName,
  isValidAccountType,
  type AccountWithRelations
} from '@/types/account'
import { ZodError } from 'zod'

// GET - Buscar conta por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const resolvedParams = await params

    // Validar ID da conta
    const idValidation = accountIdSchema.safeParse({ id: resolvedParams.id })
    
    if (!idValidation.success) {
      return NextResponse.json({ 
        error: 'ID da conta inválido',
        details: idValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 })
    }

    const accountId = idValidation.data.id

    // Buscar conta com relacionamentos
    const account = await db
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
      .where(
        and(
          eq(accountsTable.id, accountId),
          eq(accountsTable.userId, session.user.id)
        )
      )
      .limit(1)

    if (account.length === 0) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
    }

    const result = account[0]
    return NextResponse.json({
      ...result,
      userId: result.user?.id || '',
      user: result.user?.id ? result.user : null,
    } as AccountWithRelations)
  } catch (error) {
    console.error('Erro ao buscar conta:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar conta
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const resolvedParams = await params

    // Validar ID da conta
    const idValidation = accountIdSchema.safeParse({ id: resolvedParams.id })
    
    if (!idValidation.success) {
      return NextResponse.json({ 
        error: 'ID da conta inválido',
        details: idValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 })
    }

    const accountId = idValidation.data.id
    const body = await request.json()

    // Validar dados
    const validationResult = updateAccountSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 })
    }

    const validatedData = validationResult.data

    // Verificar se a conta existe e se o usuário pode editá-la
    const existingAccount = await db
      .select({ 
        id: accountsTable.id, 
        userId: accountsTable.userId,
        name: accountsTable.name,
        type: accountsTable.type
      })
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .limit(1)

    if (existingAccount.length === 0) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
    }

    const account = existingAccount[0]

    // Usuários só podem editar suas próprias contas
    if (account.userId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Você não tem permissão para editar esta conta' 
      }, { status: 403 })
    }

    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: new Date(),
    }

    // Validar e sanitizar nome se fornecido
    if (validatedData.name !== undefined) {
      const sanitizedName = sanitizeAccountName(validatedData.name)
      
      // Verificar se já existe uma conta com o mesmo nome (se o nome foi alterado)
      const duplicateAccount = await db
        .select({ id: accountsTable.id })
        .from(accountsTable)
        .where(
          and(
            eq(accountsTable.name, sanitizedName),
            eq(accountsTable.userId, session.user.id)
          )
        )
        .limit(1)

      if (duplicateAccount.length > 0 && duplicateAccount[0].id !== accountId) {
        return NextResponse.json({ 
          error: 'Já existe uma conta com este nome',
          field: 'name'
        }, { status: 400 })
      }

      updateData.name = sanitizedName
    }

    // Validar tipo de conta se fornecido
    if (validatedData.type !== undefined) {
      if (!isValidAccountType(validatedData.type)) {
        return NextResponse.json({ 
          error: 'Tipo de conta inválido',
          field: 'type'
        }, { status: 400 })
      }
      updateData.type = validatedData.type
    }

    // Atualizar conta
    await db
      .update(accountsTable)
      .set(updateData)
      .where(eq(accountsTable.id, accountId))

    // Buscar conta atualizada com relacionamentos
    const updatedAccount = await db
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
      .where(eq(accountsTable.id, accountId))
      .limit(1)

    const result = updatedAccount[0]
    return NextResponse.json({
      ...result,
      userId: result.user?.id || '',
      user: result.user?.id ? result.user : null,
    } as AccountWithRelations)
  } catch (error) {
    console.error('Erro ao atualizar conta:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Excluir conta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const resolvedParams = await params

    // Validar ID da conta
    const idValidation = accountIdSchema.safeParse({ id: resolvedParams.id })
    
    if (!idValidation.success) {
      return NextResponse.json({ 
        error: 'ID da conta inválido',
        details: idValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 })
    }

    const accountId = idValidation.data.id

    // Verificar se a conta existe e se o usuário pode excluí-la
    const existingAccount = await db
      .select({ 
        id: accountsTable.id, 
        userId: accountsTable.userId,
        name: accountsTable.name,
        type: accountsTable.type
      })
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .limit(1)

    if (existingAccount.length === 0) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
    }

    const account = existingAccount[0]

    // Usuários só podem excluir suas próprias contas
    if (account.userId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Você não tem permissão para excluir esta conta' 
      }, { status: 403 })
    }

    // Verificar se existem transações vinculadas a esta conta
    const [{ transactionCount }] = await db
      .select({ transactionCount: count() })
      .from(transactionsTable)
      .where(eq(transactionsTable.accountId, accountId))

    if (transactionCount > 0) {
      return NextResponse.json({ 
        error: `Não é possível excluir esta conta pois existem ${transactionCount} transação(ões) vinculada(s) a ela`,
        relatedCount: transactionCount
      }, { status: 400 })
    }

    // Excluir conta
    await db
      .delete(accountsTable)
      .where(eq(accountsTable.id, accountId))

    return NextResponse.json({ 
      message: 'Conta excluída com sucesso',
      deletedAccount: {
        id: account.id,
        name: account.name,
        type: account.type
      }
    })
  } catch (error) {
    console.error('Erro ao excluir conta:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 