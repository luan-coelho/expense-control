import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { userSettingsTable, usersTable } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import {
  updateUserSettingsSchema,
  DEFAULT_USER_SETTINGS,
  type UserSettingsWithUser,
} from '@/types/user-settings'
import { ZodError } from 'zod'

// GET - Buscar configurações do usuário
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar configurações do usuário
    const userSettings = await db
      .select({
        id: userSettingsTable.id,
        userId: userSettingsTable.userId,
        language: userSettingsTable.language,
        timezone: userSettingsTable.timezone,
        dateFormat: userSettingsTable.dateFormat,
        darkMode: userSettingsTable.darkMode,
        emailNotifications: userSettingsTable.emailNotifications,
        pushNotifications: userSettingsTable.pushNotifications,
        budgetAlerts: userSettingsTable.budgetAlerts,
        lowBalanceAlerts: userSettingsTable.lowBalanceAlerts,
        monthlyReports: userSettingsTable.monthlyReports,
        notificationTime: userSettingsTable.notificationTime,
        dataCollection: userSettingsTable.dataCollection,
        analytics: userSettingsTable.analytics,
        dataSharing: userSettingsTable.dataSharing,
        twoFactorAuth: userSettingsTable.twoFactorAuth,
        autoBackup: userSettingsTable.autoBackup,
        cloudSync: userSettingsTable.cloudSync,
        localBackup: userSettingsTable.localBackup,
        backupFrequency: userSettingsTable.backupFrequency,
        lastBackup: userSettingsTable.lastBackup,
        backupSize: userSettingsTable.backupSize,
        defaultCurrency: userSettingsTable.defaultCurrency,
        numberFormat: userSettingsTable.numberFormat,
        fiscalYearStart: userSettingsTable.fiscalYearStart,
        weekStartDay: userSettingsTable.weekStartDay,
        defaultBudgetLimit: userSettingsTable.defaultBudgetLimit,
        showCents: userSettingsTable.showCents,
        autoCategorizationEnabled: userSettingsTable.autoCategorizationEnabled,
        createdAt: userSettingsTable.createdAt,
        updatedAt: userSettingsTable.updatedAt,
        user: {
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        },
      })
      .from(userSettingsTable)
      .leftJoin(usersTable, eq(userSettingsTable.userId, usersTable.id))
      .where(eq(userSettingsTable.userId, session.user.id))
      .limit(1)

    // Se não existir configurações, criar com valores padrão
    if (userSettings.length === 0) {
      const [newSettings] = await db
        .insert(userSettingsTable)
        .values({
          userId: session.user.id,
          ...DEFAULT_USER_SETTINGS,
        })
        .returning()

      // Buscar configurações criadas com informações do usuário
      const settingsWithUser = await db
        .select({
          id: userSettingsTable.id,
          userId: userSettingsTable.userId,
          language: userSettingsTable.language,
          timezone: userSettingsTable.timezone,
          dateFormat: userSettingsTable.dateFormat,
          darkMode: userSettingsTable.darkMode,
          emailNotifications: userSettingsTable.emailNotifications,
          pushNotifications: userSettingsTable.pushNotifications,
          budgetAlerts: userSettingsTable.budgetAlerts,
          lowBalanceAlerts: userSettingsTable.lowBalanceAlerts,
          monthlyReports: userSettingsTable.monthlyReports,
          notificationTime: userSettingsTable.notificationTime,
          dataCollection: userSettingsTable.dataCollection,
          analytics: userSettingsTable.analytics,
          dataSharing: userSettingsTable.dataSharing,
          twoFactorAuth: userSettingsTable.twoFactorAuth,
          autoBackup: userSettingsTable.autoBackup,
          cloudSync: userSettingsTable.cloudSync,
          localBackup: userSettingsTable.localBackup,
          backupFrequency: userSettingsTable.backupFrequency,
          lastBackup: userSettingsTable.lastBackup,
          backupSize: userSettingsTable.backupSize,
          defaultCurrency: userSettingsTable.defaultCurrency,
          numberFormat: userSettingsTable.numberFormat,
          fiscalYearStart: userSettingsTable.fiscalYearStart,
          weekStartDay: userSettingsTable.weekStartDay,
          defaultBudgetLimit: userSettingsTable.defaultBudgetLimit,
          showCents: userSettingsTable.showCents,
          autoCategorizationEnabled: userSettingsTable.autoCategorizationEnabled,
          createdAt: userSettingsTable.createdAt,
          updatedAt: userSettingsTable.updatedAt,
          user: {
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
          },
        })
        .from(userSettingsTable)
        .leftJoin(usersTable, eq(userSettingsTable.userId, usersTable.id))
        .where(eq(userSettingsTable.id, newSettings.id))
        .limit(1)

      return NextResponse.json(settingsWithUser[0] as UserSettingsWithUser)
    }

    return NextResponse.json(userSettings[0] as UserSettingsWithUser)
  } catch (error) {
    console.error('Erro ao buscar configurações do usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar configurações do usuário
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar dados
    const validationResult = updateUserSettingsSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    const validatedData = validationResult.data

    // Verificar se existem configurações para o usuário
    const existingSettings = await db
      .select({ id: userSettingsTable.id })
      .from(userSettingsTable)
      .where(eq(userSettingsTable.userId, session.user.id))
      .limit(1)

    let updatedSettings

    if (existingSettings.length === 0) {
      // Criar configurações se não existirem
      [updatedSettings] = await db
        .insert(userSettingsTable)
        .values({
          userId: session.user.id,
          ...DEFAULT_USER_SETTINGS,
          ...validatedData,
        })
        .returning()
    } else {
      // Atualizar configurações existentes
      [updatedSettings] = await db
        .update(userSettingsTable)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(userSettingsTable.userId, session.user.id))
        .returning()
    }

    // Buscar configurações atualizadas com informações do usuário
    const settingsWithUser = await db
      .select({
        id: userSettingsTable.id,
        userId: userSettingsTable.userId,
        language: userSettingsTable.language,
        timezone: userSettingsTable.timezone,
        dateFormat: userSettingsTable.dateFormat,
        darkMode: userSettingsTable.darkMode,
        emailNotifications: userSettingsTable.emailNotifications,
        pushNotifications: userSettingsTable.pushNotifications,
        budgetAlerts: userSettingsTable.budgetAlerts,
        lowBalanceAlerts: userSettingsTable.lowBalanceAlerts,
        monthlyReports: userSettingsTable.monthlyReports,
        notificationTime: userSettingsTable.notificationTime,
        dataCollection: userSettingsTable.dataCollection,
        analytics: userSettingsTable.analytics,
        dataSharing: userSettingsTable.dataSharing,
        twoFactorAuth: userSettingsTable.twoFactorAuth,
        autoBackup: userSettingsTable.autoBackup,
        cloudSync: userSettingsTable.cloudSync,
        localBackup: userSettingsTable.localBackup,
        backupFrequency: userSettingsTable.backupFrequency,
        lastBackup: userSettingsTable.lastBackup,
        backupSize: userSettingsTable.backupSize,
        defaultCurrency: userSettingsTable.defaultCurrency,
        numberFormat: userSettingsTable.numberFormat,
        fiscalYearStart: userSettingsTable.fiscalYearStart,
        weekStartDay: userSettingsTable.weekStartDay,
        defaultBudgetLimit: userSettingsTable.defaultBudgetLimit,
        showCents: userSettingsTable.showCents,
        autoCategorizationEnabled: userSettingsTable.autoCategorizationEnabled,
        createdAt: userSettingsTable.createdAt,
        updatedAt: userSettingsTable.updatedAt,
        user: {
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        },
      })
      .from(userSettingsTable)
      .leftJoin(usersTable, eq(userSettingsTable.userId, usersTable.id))
      .where(eq(userSettingsTable.id, updatedSettings.id))
      .limit(1)

    return NextResponse.json(settingsWithUser[0] as UserSettingsWithUser)
  } catch (error) {
    console.error('Erro ao atualizar configurações do usuário:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 