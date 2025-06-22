import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { notificationsTable } from '@/db/schema'
import { eq, and, gte, lte, ilike, desc, count, isNull, isNotNull } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import {
  createNotificationSchema,
  notificationFiltersSchema,
  type NotificationWithRelations,
  type PaginatedNotifications,
} from '@/types/notification'

// GET - Listar notificações com filtros e paginação
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Parâmetros de paginação
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Validar parâmetros de filtro
    const filterValidation = notificationFiltersSchema.safeParse({
      type: searchParams.get('type'),
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      isActionable:
        searchParams.get('isActionable') === 'true'
          ? true
          : searchParams.get('isActionable') === 'false'
            ? false
            : undefined,
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      search: searchParams.get('search'),
    })

    if (!filterValidation.success) {
      return NextResponse.json(
        {
          error: 'Parâmetros de filtro inválidos',
          details: filterValidation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      )
    }

    const { type, status, priority, isActionable, dateFrom, dateTo, search } = filterValidation.data
    const offset = (page - 1) * limit

    // Construir condições WHERE
    const conditions = [eq(notificationsTable.userId, session.user.id)]

    if (type) {
      conditions.push(eq(notificationsTable.type, type))
    }
    if (status) {
      conditions.push(eq(notificationsTable.status, status))
    }
    if (priority) {
      conditions.push(eq(notificationsTable.priority, priority))
    }
    if (isActionable !== undefined) {
      conditions.push(eq(notificationsTable.isActionable, isActionable))
    }
    if (dateFrom) {
      conditions.push(gte(notificationsTable.createdAt, new Date(dateFrom)))
    }
    if (dateTo) {
      conditions.push(lte(notificationsTable.createdAt, new Date(dateTo)))
    }
    if (search) {
      conditions.push(ilike(notificationsTable.title, `%${search}%`))
    }

    // Filtrar notificações não expiradas por padrão
    conditions.push(isNull(notificationsTable.expiresAt))

    // Buscar notificações
    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(and(...conditions))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(limit)
      .offset(offset)

    // Contar total de registros
    const [{ total }] = await db
      .select({ total: count() })
      .from(notificationsTable)
      .where(and(...conditions))

    // Calcular metadados de paginação
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const response: PaginatedNotifications = {
      data: notifications as NotificationWithRelations[],
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar nova notificação
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar dados
    const validatedData = createNotificationSchema.parse(body)

    // Criar notificação
    const [newNotification] = await db
      .insert(notificationsTable)
      .values({
        userId: session.user.id,
        type: validatedData.type,
        status: 'UNREAD',
        priority: validatedData.priority,
        title: validatedData.title,
        message: validatedData.message,
        data: validatedData.data,
        isActionable: validatedData.isActionable,
        actionUrl: validatedData.actionUrl,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      })
      .returning()

    return NextResponse.json(newNotification, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar notificação:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
