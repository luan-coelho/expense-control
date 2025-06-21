import { NextRequest, NextResponse } from 'next/server'

// GET: Listar próximas transações recorrentes (mock para desenvolvimento)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    // Mock data para desenvolvimento
    const mockInstances = [
      {
        id: 'inst-1',
        originalTransactionId: 'trans-1',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
        amount: 5000,
        description: 'Salário (Recorrente)',
        type: 'INCOME',
        category: { id: 'cat-1', name: 'Salário', icon: '💼' },
        space: { id: 'space-1', name: 'Pessoal' },
        account: { id: 'acc-1', name: 'Conta Corrente', type: 'checking' },
        isGenerated: true,
        originalTransaction: {
          id: 'trans-1',
          createdAt: new Date(),
          isRecurrent: true,
          recurrencePattern: 'MONTHLY|1'
        }
      },
      {
        id: 'inst-2',
        originalTransactionId: 'trans-2',
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Em 3 dias
        amount: 1200,
        description: 'Aluguel (Recorrente)',
        type: 'EXPENSE',
        category: { id: 'cat-2', name: 'Moradia', icon: '🏠' },
        space: { id: 'space-1', name: 'Pessoal' },
        account: { id: 'acc-1', name: 'Conta Corrente', type: 'checking' },
        isGenerated: true,
        originalTransaction: {
          id: 'trans-2',
          createdAt: new Date(),
          isRecurrent: true,
          recurrencePattern: 'MONTHLY|1'
        }
      },
      {
        id: 'inst-3',
        originalTransactionId: 'trans-3',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Em 1 semana
        amount: 300,
        description: 'Supermercado (Recorrente)',
        type: 'EXPENSE',
        category: { id: 'cat-3', name: 'Alimentação', icon: '🛒' },
        space: { id: 'space-1', name: 'Pessoal' },
        account: { id: 'acc-1', name: 'Conta Corrente', type: 'checking' },
        isGenerated: true,
        originalTransaction: {
          id: 'trans-3',
          createdAt: new Date(),
          isRecurrent: true,
          recurrencePattern: 'WEEKLY|1'
        }
      }
    ]

    // Filtrar por dias se especificado
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + days)
    
    const filteredInstances = mockInstances.filter(
      instance => instance.scheduledDate <= cutoffDate
    )

    return NextResponse.json({
      instances: filteredInstances,
      total: filteredInstances.length,
      hasMore: false
    })

  } catch (error) {
    console.error('Erro ao buscar transações recorrentes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST: Criar nova transação recorrente (mock para desenvolvimento)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Mock response
    const mockTransaction = {
      id: 'trans-new',
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user-1'
    }

    return NextResponse.json(mockTransaction, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar transação recorrente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 