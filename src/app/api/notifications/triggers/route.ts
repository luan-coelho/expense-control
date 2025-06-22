import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import notificationTriggersService from '@/services/notification-triggers.service'

// POST - Executar triggers de notificação
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { triggerType, context } = body

    switch (triggerType) {
      case 'budget':
        await notificationTriggersService.checkBudgetAlert(session.user.id, context?.spaceId, context?.categoryId)
        break

      case 'balance':
        await notificationTriggersService.checkLowBalance(session.user.id, context?.accountId)
        break

      case 'unusual':
        if (context?.transactionId) {
          await notificationTriggersService.checkUnusualSpending(session.user.id, context.transactionId)
        }
        break

      case 'monthly':
        await notificationTriggersService.generateMonthlySummary(session.user.id)
        break

      case 'all':
        await notificationTriggersService.processAllTriggers(session.user.id, context)
        break

      default:
        return NextResponse.json({ error: 'Tipo de trigger inválido' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Triggers executados com sucesso',
    })
  } catch (error) {
    console.error('Erro ao executar triggers de notificação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
