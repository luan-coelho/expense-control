import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { notificationsTable } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'

// PATCH - Marcar todas as notificações como lidas
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Atualizar todas as notificações não lidas do usuário
    const result = await db
      .update(notificationsTable)
      .set({
        status: 'READ',
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(notificationsTable.userId, session.user.id), eq(notificationsTable.status, 'UNREAD')))
      .returning({ id: notificationsTable.id })

    return NextResponse.json({
      success: true,
      count: result.length,
      message: `${result.length} notificação(ões) marcada(s) como lida(s)`,
    })
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
