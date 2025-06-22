import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { notificationSettingsSchema, type NotificationSettings } from '@/types/notification'

// GET - Obter configurações de notificação do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Por enquanto, retornar configurações padrão
    // Em uma implementação futura, isso seria buscado do banco de dados
    const defaultSettings: NotificationSettings = {
      enableBudgetAlerts: true,
      enableRecurringReminders: true,
      enableFinancialGoals: true,
      enableLowBalanceAlerts: true,
      enableMonthlySummary: true,
      enableExpenseLimits: true,
      enableCategoryBudgets: true,
      enableUnusualSpending: false,
      budgetAlertThreshold: 80,
      lowBalanceThreshold: 100,
      unusualSpendingThreshold: 2,
      emailNotifications: false,
      pushNotifications: true,
    }

    return NextResponse.json(defaultSettings)
  } catch (error) {
    console.error('Erro ao buscar configurações de notificação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar configurações de notificação do usuário
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar dados
    const validatedData = notificationSettingsSchema.parse(body)

    // Por enquanto, apenas retornar os dados validados
    // Em uma implementação futura, isso seria salvo no banco de dados
    // Exemplo: salvar em uma tabela user_notification_settings

    return NextResponse.json(validatedData)
  } catch (error) {
    console.error('Erro ao atualizar configurações de notificação:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
