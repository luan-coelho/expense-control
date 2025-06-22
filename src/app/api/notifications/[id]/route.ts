import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { notificationsTable } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { updateNotificationSchema, type NotificationWithRelations } from '@/types/notification'

// GET - Buscar notificação por ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: notificationId } = await params

    // Buscar notificação
    const notification = await db
      .select()
      .from(notificationsTable)
      .where(and(eq(notificationsTable.id, notificationId), eq(notificationsTable.userId, session.user.id)))
      .limit(1)

    if (notification.length === 0) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    return NextResponse.json(notification[0] as NotificationWithRelations)
  } catch (error) {
    console.error('Erro ao buscar notificação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar notificação
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: notificationId } = await params
    const body = await request.json()

    // Validar dados
    const validatedData = updateNotificationSchema.parse(body)

    // Verificar se a notificação existe e pertence ao usuário
    const existingNotification = await db
      .select({ id: notificationsTable.id })
      .from(notificationsTable)
      .where(and(eq(notificationsTable.id, notificationId), eq(notificationsTable.userId, session.user.id)))
      .limit(1)

    if (existingNotification.length === 0) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
    }
    if (validatedData.readAt !== undefined) {
      updateData.readAt = validatedData.readAt ? new Date(validatedData.readAt) : null
    }
    if (validatedData.archivedAt !== undefined) {
      updateData.archivedAt = validatedData.archivedAt ? new Date(validatedData.archivedAt) : null
    }

    // Atualizar notificação
    const [updatedNotification] = await db
      .update(notificationsTable)
      .set(updateData)
      .where(eq(notificationsTable.id, notificationId))
      .returning()

    return NextResponse.json(updatedNotification as NotificationWithRelations)
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Excluir notificação
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: notificationId } = await params

    // Verificar se a notificação existe e pertence ao usuário
    const existingNotification = await db
      .select({ id: notificationsTable.id })
      .from(notificationsTable)
      .where(and(eq(notificationsTable.id, notificationId), eq(notificationsTable.userId, session.user.id)))
      .limit(1)

    if (existingNotification.length === 0) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    // Excluir notificação
    await db.delete(notificationsTable).where(eq(notificationsTable.id, notificationId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir notificação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
