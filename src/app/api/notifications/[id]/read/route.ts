import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { notificationsTable } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { type NotificationWithRelations } from '@/types/notification'

// PATCH - Marcar notificação como lida
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: notificationId } = await params

    // Verificar se a notificação existe e pertence ao usuário
    const existingNotification = await db
      .select({ id: notificationsTable.id, status: notificationsTable.status })
      .from(notificationsTable)
      .where(and(eq(notificationsTable.id, notificationId), eq(notificationsTable.userId, session.user.id)))
      .limit(1)

    if (existingNotification.length === 0) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    // Atualizar status para READ e definir readAt
    const [updatedNotification] = await db
      .update(notificationsTable)
      .set({
        status: 'READ',
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notificationsTable.id, notificationId))
      .returning()

    return NextResponse.json(updatedNotification as NotificationWithRelations)
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
