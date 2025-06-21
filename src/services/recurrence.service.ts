import { 
  RecurrenceData, 
  RecurrencePattern,
  type CreateTransactionInput 
} from '@/types/transaction'

/**
 * Serviço para gerenciamento de transações recorrentes
 */

export interface RecurringTransactionInstance {
  id: string
  originalTransactionId: string
  scheduledDate: Date
  amount: number
  description: string
  type: 'INCOME' | 'EXPENSE'
  categoryId: string
  spaceId: string
  accountId: string
  isGenerated: boolean
  recurrenceId: string
}

export interface RecurrenceSchedule {
  id: string
  transactionTemplate: CreateTransactionInput
  recurrenceData: RecurrenceData
  startDate: Date
  nextScheduledDate: Date
  isActive: boolean
  createdAt: Date
  lastGeneratedDate?: Date
}

/**
 * Calcula a próxima data de recorrência baseada no padrão especificado
 */
export function calculateNextDate(
  currentDate: Date, 
  recurrence: RecurrenceData
): Date | null {
  const nextDate = new Date(currentDate)
  
  try {
    switch (recurrence.pattern) {
      case RecurrencePattern.DAILY:
        nextDate.setDate(nextDate.getDate() + recurrence.interval)
        break
        
      case RecurrencePattern.WEEKLY:
        nextDate.setDate(nextDate.getDate() + (7 * recurrence.interval))
        break
        
      case RecurrencePattern.MONTHLY:
        // Lidar com casos especiais como 31 de janeiro -> fevereiro
        const originalDay = currentDate.getUTCDate()
        let targetMonth = currentDate.getUTCMonth() + recurrence.interval
        let targetYear = currentDate.getUTCFullYear()
        
        // Ajustar ano se o mês ultrapassar 11 (dezembro)
        while (targetMonth > 11) {
          targetMonth -= 12
          targetYear += 1
        }
        while (targetMonth < 0) {
          targetMonth += 12
          targetYear -= 1
        }
        
        // Obter o último dia do mês alvo
        const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
        
        // Usar o dia original ou o último dia do mês se o dia original não existir
        const targetDay = Math.min(originalDay, lastDayOfTargetMonth)
        
        // Definir a nova data
        nextDate.setUTCFullYear(targetYear, targetMonth, targetDay)
        break
        
      case RecurrencePattern.YEARLY:
        const originalMonth = currentDate.getUTCMonth()
        const originalDayOfYear = currentDate.getUTCDate()
        const newYear = currentDate.getUTCFullYear() + recurrence.interval
        
        // Lidar com anos bissextos (29 de fevereiro)
        if (originalMonth === 1 && originalDayOfYear === 29) {
          // Se não é ano bissexto, usar 28 de fevereiro
          if (!isLeapYear(newYear)) {
            nextDate.setUTCFullYear(newYear, 1, 28)
          } else {
            nextDate.setUTCFullYear(newYear, 1, 29)
          }
        } else {
          nextDate.setUTCFullYear(newYear, originalMonth, originalDayOfYear)
        }
        break
        
      default:
        throw new Error(`Padrão de recorrência não suportado: ${recurrence.pattern}`)
    }
    
    // Verificar se passou da data limite
    if (recurrence.endDate && nextDate > new Date(recurrence.endDate)) {
      return null
    }
    
    return nextDate
  } catch (error) {
    console.error('Erro ao calcular próxima data:', error)
    return null
  }
}

/**
 * Gera uma lista de datas futuras para a recorrência
 */
export function generateScheduledDates(
  startDate: Date,
  recurrence: RecurrenceData,
  maxDates: number = 12
): Date[] {
  const dates: Date[] = []
  let currentDate = new Date(startDate)
  let occurrenceCount = 0
  
  while (dates.length < maxDates) {
    const nextDate = calculateNextDate(currentDate, recurrence)
    
    if (!nextDate) {
      break // Chegou ao fim da recorrência
    }
    
    // Verificar limite de ocorrências
    if (recurrence.maxOccurrences && occurrenceCount >= recurrence.maxOccurrences) {
      break
    }
    
    dates.push(nextDate)
    currentDate = nextDate
    occurrenceCount++
  }
  
  return dates
}

/**
 * Cria instâncias de transações recorrentes
 */
export function generateRecurringTransactionInstances(
  transactionTemplate: CreateTransactionInput,
  recurrence: RecurrenceData,
  recurrenceId: string,
  maxInstances: number = 6
): RecurringTransactionInstance[] {
  const startDate = new Date(transactionTemplate.date)
  const scheduledDates = generateScheduledDates(startDate, recurrence, maxInstances)
  
  return scheduledDates.map((date, index) => ({
    id: `${recurrenceId}-${index + 1}`,
    originalTransactionId: recurrenceId,
    scheduledDate: date,
    amount: parseFloat(transactionTemplate.amount.replace(',', '.')),
    description: `${transactionTemplate.description} (Recorrente)`,
    type: transactionTemplate.type,
    categoryId: transactionTemplate.categoryId,
    spaceId: transactionTemplate.spaceId,
    accountId: transactionTemplate.accountId,
    isGenerated: true,
    recurrenceId
  }))
}

/**
 * Valida se uma configuração de recorrência é válida
 */
export function validateRecurrenceConfig(recurrence: RecurrenceData): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Validar intervalo
  if (recurrence.interval < 1) {
    errors.push('Intervalo deve ser maior que 0')
  }
  
  if (recurrence.interval > 365) {
    errors.push('Intervalo não pode ser maior que 365')
  }
  
  // Validar data de fim
  if (recurrence.endDate) {
    const endDate = new Date(recurrence.endDate)
    const now = new Date()
    
    if (endDate <= now) {
      errors.push('Data de fim deve ser no futuro')
    }
  }
  
  // Validar máximo de ocorrências
  if (recurrence.maxOccurrences !== undefined) {
    if (recurrence.maxOccurrences < 1) {
      errors.push('Número máximo de ocorrências deve ser maior que 0')
    }
    
    if (recurrence.maxOccurrences > 1000) {
      errors.push('Número máximo de ocorrências não pode ser maior que 1000')
    }
  }
  
  // Não pode ter ambos endDate e maxOccurrences
  if (recurrence.endDate && recurrence.maxOccurrences) {
    errors.push('Não é possível definir data de fim e número máximo de ocorrências simultaneamente')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Calcula a próxima data de execução para uma recorrência ativa
 */
export function getNextExecutionDate(schedule: RecurrenceSchedule): Date | null {
  const lastDate = schedule.lastGeneratedDate || schedule.startDate
  return calculateNextDate(lastDate, schedule.recurrenceData)
}

/**
 * Determina se uma recorrência deve ser executada hoje
 */
export function shouldExecuteToday(schedule: RecurrenceSchedule): boolean {
  if (!schedule.isActive) {
    return false
  }
  
  const today = new Date()
  const nextDate = getNextExecutionDate(schedule)
  
  if (!nextDate) {
    return false
  }
  
  // Verificar se a data é hoje (ignorando horário)
  return (
    nextDate.getFullYear() === today.getFullYear() &&
    nextDate.getMonth() === today.getMonth() &&
    nextDate.getDate() === today.getDate()
  )
}

/**
 * Utilitário para verificar se um ano é bissexto
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

/**
 * Formata a descrição de uma recorrência para exibição
 */
export function formatRecurrenceDescription(recurrence: RecurrenceData): string {
  const patterns = {
    [RecurrencePattern.DAILY]: 'dia(s)',
    [RecurrencePattern.WEEKLY]: 'semana(s)',
    [RecurrencePattern.MONTHLY]: 'mês(es)',
    [RecurrencePattern.YEARLY]: 'ano(s)'
  }
  
  let description = `A cada ${recurrence.interval} ${patterns[recurrence.pattern]}`
  
  if (recurrence.endDate) {
    const endDate = new Date(recurrence.endDate)
    description += ` até ${endDate.toLocaleDateString('pt-BR')}`
  } else if (recurrence.maxOccurrences) {
    description += ` por ${recurrence.maxOccurrences} vezes`
  }
  
  return description
}

const recurrenceService = {
  calculateNextDate,
  generateScheduledDates,
  generateRecurringTransactionInstances,
  validateRecurrenceConfig,
  getNextExecutionDate,
  shouldExecuteToday,
  formatRecurrenceDescription
}

export default recurrenceService 