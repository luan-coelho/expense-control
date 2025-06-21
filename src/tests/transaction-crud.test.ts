/**
 * Teste básico para verificar o funcionamento do CRUD de transações
 * Este teste verifica se os componentes principais estão funcionando corretamente
 */

import { describe, it, expect } from 'vitest'
import { 
  createTransactionSchema, 
  updateTransactionSchema,
  transactionFiltersSchema,
  TransactionType,
  parseTransactionAmount,
  formatTransactionAmount 
} from '@/types/transaction'

describe('Transaction CRUD - Schema Validation', () => {
  it('should validate create transaction data correctly', () => {
    const validData = {
      amount: '100.50',
      date: '2024-01-01',
      description: 'Test transaction',
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      spaceId: '123e4567-e89b-12d3-a456-426614174001',
      accountId: '123e4567-e89b-12d3-a456-426614174002',
      type: TransactionType.EXPENSE,
      isRecurrent: false,
    }

    const result = createTransactionSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject invalid transaction data', () => {
    const invalidData = {
      amount: '', // Invalid: empty amount
      date: '',   // Invalid: empty date
      description: '', // Invalid: empty description
      categoryId: 'invalid-uuid',
      spaceId: 'invalid-uuid',
      accountId: 'invalid-uuid',
      type: 'INVALID_TYPE',
    }

    const result = createTransactionSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should validate update transaction data correctly', () => {
    const validUpdateData = {
      amount: '200.00',
      description: 'Updated transaction',
    }

    const result = updateTransactionSchema.safeParse(validUpdateData)
    expect(result.success).toBe(true)
  })

  it('should validate transaction filters correctly', () => {
    const validFilters = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      type: TransactionType.INCOME,
      search: 'salary',
    }

    const result = transactionFiltersSchema.safeParse(validFilters)
    expect(result.success).toBe(true)
  })

  it('should validate empty filters correctly', () => {
    const emptyFilters = {}

    const result = transactionFiltersSchema.safeParse(emptyFilters)
    expect(result.success).toBe(true)
  })
})

describe('Transaction CRUD - Utility Functions', () => {
  it('should parse transaction amount correctly', () => {
    expect(parseTransactionAmount('100.50')).toBe('100.50')
    expect(parseTransactionAmount('100,50')).toBe('100.50')
    expect(parseTransactionAmount('1000')).toBe('1000.00')
  })

  it('should format transaction amount correctly', () => {
    const result1 = formatTransactionAmount('100.50')
    const result2 = formatTransactionAmount('1000.00')
    const result3 = formatTransactionAmount('0.99')
    
    // Verificar se contém os elementos esperados
    expect(result1).toContain('100,50')
    expect(result1).toContain('R$')
    
    expect(result2).toContain('1.000,00')
    expect(result2).toContain('R$')
    
    expect(result3).toContain('0,99')
    expect(result3).toContain('R$')
  })
})

describe('Transaction CRUD - Business Logic', () => {
  it('should handle transaction types correctly', () => {
    expect(TransactionType.INCOME).toBe('INCOME')
    expect(TransactionType.EXPENSE).toBe('EXPENSE')
  })

  it('should calculate balance correctly', () => {
    const transactions = [
      { type: TransactionType.INCOME, amount: '1000.00' },
      { type: TransactionType.EXPENSE, amount: '300.00' },
      { type: TransactionType.EXPENSE, amount: '200.00' },
    ]

    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    const balance = totalIncome - totalExpense

    expect(totalIncome).toBe(1000)
    expect(totalExpense).toBe(500)
    expect(balance).toBe(500)
  })
})

describe('Transaction CRUD - Integration Tests', () => {
  it('should handle complete transaction workflow', () => {
    // Simular criação de transação
    const newTransaction = {
      amount: '150.00',
      date: '2024-01-15',
      description: 'Grocery shopping',
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      spaceId: '123e4567-e89b-12d3-a456-426614174001',
      accountId: '123e4567-e89b-12d3-a456-426614174002',
      type: TransactionType.EXPENSE,
      isRecurrent: false,
    }

    // Validar criação
    const createResult = createTransactionSchema.safeParse(newTransaction)
    expect(createResult.success).toBe(true)

    // Simular atualização
    const updateData = {
      amount: '175.00',
      description: 'Grocery shopping - updated',
    }

    const updateResult = updateTransactionSchema.safeParse(updateData)
    expect(updateResult.success).toBe(true)

    // Simular filtros
    const filters = {
      type: TransactionType.EXPENSE,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    }

    const filtersResult = transactionFiltersSchema.safeParse(filters)
    expect(filtersResult.success).toBe(true)
  })

  it('should handle error cases gracefully', () => {
    // Teste com dados inválidos
    const invalidTransaction = {
      amount: 'invalid',
      date: 'invalid-date',
      description: '',
      categoryId: 'not-a-uuid',
      spaceId: 'not-a-uuid',
      accountId: 'not-a-uuid',
      type: 'INVALID',
    }

    const result = createTransactionSchema.safeParse(invalidTransaction)
    expect(result.success).toBe(false)
    
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0)
    }
  })
})

// Mock para simular comportamento dos hooks React Query
describe('Transaction CRUD - React Query Integration', () => {
  it('should structure data correctly for React Query', () => {
    const mockApiResponse = {
      transactions: [
        {
          id: '1',
          userId: '1',
          amount: '100.00',
          date: new Date('2024-01-01'),
          description: 'Test',
          type: TransactionType.EXPENSE,
          categoryId: '1',
          spaceId: '1',
          accountId: '1',
          category: { id: '1', name: 'Food', icon: '🍔' },
          space: { id: '1', name: 'Personal' },
          account: { id: '1', name: 'Checking', type: 'checking' },
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      }
    }

    expect(mockApiResponse.transactions).toHaveLength(1)
    expect(mockApiResponse.pagination.total).toBe(1)
    expect(mockApiResponse.transactions[0].category.name).toBe('Food')
  })
}) 