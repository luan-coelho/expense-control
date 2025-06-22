import { db } from '@/db'
import { accountsTable, categoriesTable, notificationsTable, transactionsTable } from '@/db/schema'
import type {
  BudgetAlertData,
  CreateNotificationInput,
  LowBalanceData,
  MonthlySummaryData,
  UnusualSpendingData
} from '@/types/notification'
import { and, eq, gte, lte, sql, sum } from 'drizzle-orm'
import notificationService from './notification.service'

class NotificationTriggersService {
  // Verificar limite de orçamento excedido
  async checkBudgetAlert(userId: string, spaceId?: string, categoryId?: string): Promise<void> {
    try {
      // Por enquanto, implementação básica - em produção seria baseado em configurações de orçamento
      const currentMonth = new Date()
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

      // Buscar gastos do mês
      const conditions = [
        eq(transactionsTable.userId, userId),
        eq(transactionsTable.type, 'EXPENSE'),
        gte(transactionsTable.date, startOfMonth),
        lte(transactionsTable.date, endOfMonth),
      ]

      if (spaceId) {
        conditions.push(eq(transactionsTable.spaceId, spaceId))
      }
      if (categoryId) {
        conditions.push(eq(transactionsTable.categoryId, categoryId))
      }

      const [{ totalExpenses }] = await db
        .select({ totalExpenses: sum(transactionsTable.amount) })
        .from(transactionsTable)
        .where(and(...conditions))

      const expenses = Number(totalExpenses) || 0

      // Limite exemplo de R$ 2000 - em produção seria configurável
      const budgetLimit = 2000
      const threshold = 0.8 // 80%

      if (expenses >= budgetLimit * threshold) {
        const percentage = Math.round((expenses / budgetLimit) * 100)

        const data: BudgetAlertData = {
          budgetId: spaceId || 'general',
          budgetName: 'Orçamento Mensal',
          currentAmount: expenses,
          limitAmount: budgetLimit,
          percentage,
        }

        const notification: CreateNotificationInput = {
          type: 'BUDGET_ALERT',
          priority: expenses >= budgetLimit ? 'HIGH' : 'MEDIUM',
          title: `Orçamento ${percentage >= 100 ? 'Excedido' : 'Próximo do Limite'}`,
          message: `Você gastou R$ ${expenses.toFixed(2)} (${percentage}%) do seu orçamento mensal de R$ ${budgetLimit.toFixed(2)}.`,
          data,
          isActionable: true,
          actionUrl: '/analytics',
        }

        // Verificar se já existe notificação similar recente (últimas 24h)
        const recentNotifications = await db
          .select()
          .from(notificationsTable)
          .where(
            and(
              eq(notificationsTable.userId, userId),
              eq(notificationsTable.type, 'BUDGET_ALERT'),
              gte(notificationsTable.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
            ),
          )

        if (recentNotifications.length === 0) {
          await notificationService.create(notification)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar alerta de orçamento:', error)
    }
  }

  // Verificar saldo baixo em contas
  async checkLowBalance(userId: string, accountId?: string): Promise<void> {
    try {
      const conditions = [eq(accountsTable.userId, userId)]
      if (accountId) {
        conditions.push(eq(accountsTable.id, accountId))
      }

      const accounts = await db
        .select()
        .from(accountsTable)
        .where(and(...conditions))

      for (const account of accounts) {
        // Calcular saldo atual da conta baseado nas transações
        const [{ balance }] = await db
          .select({
            balance: sum(
              sql`CASE 
                WHEN ${transactionsTable.type} = 'INCOME' THEN ${transactionsTable.amount}
                ELSE -${transactionsTable.amount}
              END`,
            ),
          })
          .from(transactionsTable)
          .where(eq(transactionsTable.accountId, account.id))

        const currentBalance = Number(balance) || 0
        const lowBalanceThreshold = 100 // Configurável por conta

        if (currentBalance < lowBalanceThreshold) {
          const data: LowBalanceData = {
            accountId: account.id,
            accountName: account.name,
            currentBalance,
            minimumBalance: lowBalanceThreshold,
          }

          const notification: CreateNotificationInput = {
            type: 'LOW_BALANCE',
            priority: currentBalance <= 0 ? 'URGENT' : 'HIGH',
            title: `Saldo Baixo - ${account.name}`,
            message: `Sua conta ${account.name} está com saldo baixo: R$ ${currentBalance.toFixed(2)}`,
            data,
            isActionable: true,
            actionUrl: `/accounts/${account.id}`,
          }

          // Verificar se já existe notificação recente para esta conta
          const recentNotifications = await db
            .select()
            .from(notificationsTable)
            .where(
              and(
                eq(notificationsTable.userId, userId),
                eq(notificationsTable.type, 'LOW_BALANCE'),
                gte(notificationsTable.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
              ),
            )

          const hasRecentForAccount = recentNotifications.some(
            n => n.data && typeof n.data === 'object' && 'accountId' in n.data && n.data.accountId === account.id,
          )

          if (!hasRecentForAccount) {
            await notificationService.create(notification)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar saldo baixo:', error)
    }
  }

  // Verificar gastos incomuns (desvio padrão)
  async checkUnusualSpending(userId: string, transactionId: string): Promise<void> {
    try {
      // Buscar a transação recém-criada
      const [transaction] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, transactionId))

      if (!transaction || transaction.type !== 'EXPENSE') return

      // Buscar gastos dos últimos 3 meses para calcular média e desvio padrão
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      const recentExpenses = await db
        .select({ amount: transactionsTable.amount })
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.userId, userId),
            eq(transactionsTable.type, 'EXPENSE'),
            gte(transactionsTable.date, threeMonthsAgo),
            eq(transactionsTable.categoryId, transaction.categoryId),
          ),
        )

      if (recentExpenses.length < 5) return // Precisa de pelo menos 5 transações para análise

      const amounts = recentExpenses.map(e => Number(e.amount))
      const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
      const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length
      const stdDev = Math.sqrt(variance)

      const currentAmount = Number(transaction.amount)
      const threshold = 2 // 2 desvios padrão

      if (currentAmount > mean + threshold * stdDev) {
        // Buscar informações da categoria
        const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, transaction.categoryId))

        const data: UnusualSpendingData = {
          transactionId: transaction.id,
          amount: currentAmount,
          categoryName: category?.name || 'Categoria',
          averageAmount: mean,
          deviation: (currentAmount - mean) / stdDev,
        }

        const notification: CreateNotificationInput = {
          type: 'UNUSUAL_SPENDING',
          priority: 'MEDIUM',
          title: 'Gasto Incomum Detectado',
          message: `Gasto de R$ ${currentAmount.toFixed(2)} em ${category?.name} está acima do seu padrão usual (média: R$ ${mean.toFixed(2)})`,
          data,
          isActionable: true,
          actionUrl: `/transactions/${transaction.id}`,
        }

        await notificationService.create(notification)
      }
    } catch (error) {
      console.error('Erro ao verificar gastos incomuns:', error)
    }
  }

  // Gerar resumo mensal
  async generateMonthlySummary(userId: string): Promise<void> {
    try {
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
      const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)

      // Calcular totais do mês anterior
      const [expenses] = await db
        .select({ total: sum(transactionsTable.amount) })
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.userId, userId),
            eq(transactionsTable.type, 'EXPENSE'),
            gte(transactionsTable.date, startOfLastMonth),
            lte(transactionsTable.date, endOfLastMonth),
          ),
        )

      const [income] = await db
        .select({ total: sum(transactionsTable.amount) })
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.userId, userId),
            eq(transactionsTable.type, 'INCOME'),
            gte(transactionsTable.date, startOfLastMonth),
            lte(transactionsTable.date, endOfLastMonth),
          ),
        )

      const totalExpenses = Number(expenses.total) || 0
      const totalIncome = Number(income.total) || 0
      const balance = totalIncome - totalExpenses

      const data: MonthlySummaryData = {
        month: (lastMonth.getMonth() + 1).toString().padStart(2, '0'),
        year: lastMonth.getFullYear(),
        totalIncome,
        totalExpenses,
        balance,
        topCategories: [], // Por enquanto vazio, seria calculado separadamente
      }

      const monthName = lastMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      const balanceText = balance >= 0 ? `sobrou R$ ${balance.toFixed(2)}` : `faltou R$ ${Math.abs(balance).toFixed(2)}`

      const notification: CreateNotificationInput = {
        type: 'MONTHLY_SUMMARY',
        priority: 'LOW',
        title: `Resumo de ${monthName}`,
        message: `Receitas: R$ ${totalIncome.toFixed(2)} | Gastos: R$ ${totalExpenses.toFixed(2)} | ${balanceText}`,
        data,
        isActionable: true,
        actionUrl: '/analytics',
      }

      await notificationService.create(notification)
    } catch (error) {
      console.error('Erro ao gerar resumo mensal:', error)
    }
  }

  // Método principal para processar todos os triggers
  async processAllTriggers(
    userId: string,
    context?: {
      transactionId?: string
      accountId?: string
      spaceId?: string
      categoryId?: string
    },
  ): Promise<void> {
    try {
      // Verificar alertas de orçamento
      await this.checkBudgetAlert(userId, context?.spaceId, context?.categoryId)

      // Verificar saldo baixo
      await this.checkLowBalance(userId, context?.accountId)

      // Verificar gastos incomuns (apenas se há uma transação específica)
      if (context?.transactionId) {
        await this.checkUnusualSpending(userId, context.transactionId)
      }
    } catch (error) {
      console.error('Erro ao processar triggers de notificação:', error)
    }
  }

  // Método para ser chamado em jobs/cron para resumos mensais
  async processScheduledTriggers(): Promise<void> {
    try {
      // Este método seria chamado por um job/cron no primeiro dia do mês
      // Por enquanto, apenas um placeholder - implementação completa requereria
      // um sistema de jobs como node-cron ou similar
      console.log('Processando triggers agendados...')
    } catch (error) {
      console.error('Erro ao processar triggers agendados:', error)
    }
  }
}

const notificationTriggersService = new NotificationTriggersService()
export default notificationTriggersService
