import { describe, it, expect } from 'vitest'
import {
  calculateNextDate,
  generateScheduledDates,
  validateRecurrenceConfig,
  generateRecurringTransactionInstances,
} from '@/services/recurrence.service'
import { RecurrencePattern, type RecurrenceData } from '@/types/transaction'

describe('Recurring Transactions Service', () => {
  describe('calculateNextDate', () => {
    it('should calculate next daily date correctly', () => {
      const startDate = new Date('2024-01-01')
      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.DAILY,
        interval: 1,
      }

      const nextDate = calculateNextDate(startDate, recurrence)
      expect(nextDate).toEqual(new Date('2024-01-02'))
    })

    it('should calculate next weekly date correctly', () => {
      const startDate = new Date('2024-01-01') // Monday
      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.WEEKLY,
        interval: 1,
      }

      const nextDate = calculateNextDate(startDate, recurrence)
      expect(nextDate).toEqual(new Date('2024-01-08'))
    })

    it('should calculate next monthly date correctly', () => {
      const startDate = new Date('2024-01-15')
      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.MONTHLY,
        interval: 1,
      }

      const nextDate = calculateNextDate(startDate, recurrence)
      expect(nextDate).toEqual(new Date('2024-02-15'))
    })

    it('should handle end of month edge case (31st)', () => {
      const startDate = new Date('2024-01-31T12:00:00.000Z')
      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.MONTHLY,
        interval: 1,
      }

      const nextDate = calculateNextDate(startDate, recurrence)
      // February doesn't have 31st, should default to last day of month
      expect(nextDate).toEqual(new Date('2024-02-29T12:00:00.000Z')) // 2024 is leap year
    })

    it('should calculate next yearly date correctly', () => {
      const startDate = new Date('2024-01-15')
      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.YEARLY,
        interval: 1,
      }

      const nextDate = calculateNextDate(startDate, recurrence)
      expect(nextDate).toEqual(new Date('2025-01-15'))
    })

    it('should handle leap year edge case', () => {
      const startDate = new Date('2024-02-29T12:00:00.000Z') // Leap year
      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.YEARLY,
        interval: 1,
      }

      const nextDate = calculateNextDate(startDate, recurrence)
      // 2025 is not a leap year, should default to Feb 28
      expect(nextDate).toEqual(new Date('2025-02-28T12:00:00.000Z'))
    })

    it('should handle custom intervals', () => {
      const startDate = new Date('2024-01-01')
      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.WEEKLY,
        interval: 2, // Every 2 weeks
      }

      const nextDate = calculateNextDate(startDate, recurrence)
      expect(nextDate).toEqual(new Date('2024-01-15'))
    })
  })

  describe('generateScheduledDates', () => {
    it('should generate correct number of dates', () => {
      const startDate = new Date('2024-01-01')
      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.WEEKLY,
        interval: 1,
      }

      const dates = generateScheduledDates(startDate, recurrence, 4)
      expect(dates).toHaveLength(4)
      expect(dates[0]).toEqual(new Date('2024-01-08'))
      expect(dates[1]).toEqual(new Date('2024-01-15'))
      expect(dates[2]).toEqual(new Date('2024-01-22'))
      expect(dates[3]).toEqual(new Date('2024-01-29'))
    })

    it('should respect end date limit', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-20')
      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.WEEKLY,
        interval: 1,
        endDate: endDate.toISOString(),
      }

      const dates = generateScheduledDates(startDate, recurrence, 10)
      expect(dates).toHaveLength(2) // Only 2 dates before end date
      expect(dates[0]).toEqual(new Date('2024-01-08'))
      expect(dates[1]).toEqual(new Date('2024-01-15'))
    })

    it('should respect max occurrences limit', () => {
      const startDate = new Date('2024-01-01')
      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.DAILY,
        interval: 1,
        maxOccurrences: 3,
      }

      const dates = generateScheduledDates(startDate, recurrence, 10)
      expect(dates).toHaveLength(3) // Limited by maxOccurrences
    })
  })

  describe('validateRecurrenceConfig', () => {
    it('should validate correct configuration', () => {
      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.MONTHLY,
        interval: 1,
      }

      const result = validateRecurrenceConfig(recurrence)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid interval', () => {
      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.DAILY,
        interval: 0,
      }

      const result = validateRecurrenceConfig(recurrence)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Intervalo deve ser maior que 0')
    })

    it('should reject end date in the past', () => {
      const pastDate = new Date('2020-01-01')
      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.WEEKLY,
        interval: 1,
        endDate: pastDate.toISOString(),
      }

      const result = validateRecurrenceConfig(recurrence)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Data de fim deve ser no futuro')
    })

    it('should reject invalid max occurrences', () => {
      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.MONTHLY,
        interval: 1,
        maxOccurrences: 0,
      }

      const result = validateRecurrenceConfig(recurrence)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Número máximo de ocorrências deve ser maior que 0')
    })
  })

  describe('generateRecurringTransactionInstances', () => {
    it('should generate transaction instances correctly', () => {
      const transactionData = {
        amount: '100.00',
        description: 'Salário',
        type: 'INCOME' as const,
        date: '2024-01-01T12:00:00.000Z',
        categoryId: 'cat-1',
        spaceId: 'space-1',
        accountId: 'acc-1',
        isRecurrent: true,
        recurrencePattern: '',
      }

      const recurrence: RecurrenceData = {
        pattern: RecurrencePattern.MONTHLY,
        interval: 1,
      }

      const instances = generateRecurringTransactionInstances(
        transactionData,
        recurrence,
        'trans-1',
        3
      )

      expect(instances).toHaveLength(3)
      expect(instances[0]).toMatchObject({
        amount: 100,
        description: 'Salário (Recorrente)',
        type: 'INCOME',
        originalTransactionId: 'trans-1',
      })
      expect(instances[0].scheduledDate).toEqual(new Date('2024-02-01T12:00:00.000Z'))
      expect(instances[1].scheduledDate).toEqual(new Date('2024-03-01T12:00:00.000Z'))
      expect(instances[2].scheduledDate).toEqual(new Date('2024-04-01T12:00:00.000Z'))
    })
  })
}) 