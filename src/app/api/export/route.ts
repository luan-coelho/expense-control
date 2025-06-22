import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { transactionsTable, categoriesTable, accountsTable, spacesTable } from '@/db/schema'
import { eq, and, gte, lte, inArray, desc } from 'drizzle-orm'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { format, type, filters = {} } = body

    // Validar formato
    if (!['csv', 'excel', 'pdf', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Formato não suportado' }, { status: 400 })
    }

    // Validar tipo de exportação
    if (!['transactions', 'full-backup', 'report'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de exportação não suportado' }, { status: 400 })
    }

    let data: any = {}

    if (type === 'transactions') {
      data = await exportTransactions(session.user.id, filters)
    } else if (type === 'full-backup') {
      data = await exportFullBackup(session.user.id, filters)
    } else if (type === 'report') {
      data = await exportReport(session.user.id, filters)
    }

    // Gerar arquivo baseado no formato
    let fileBuffer: Buffer
    let filename: string
    let contentType: string

    switch (format) {
      case 'csv':
        fileBuffer = generateCSV(data, type)
        filename = `${type}-${new Date().toISOString().split('T')[0]}.csv`
        contentType = 'text/csv'
        break
      case 'excel':
        fileBuffer = generateExcel(data, type)
        filename = `${type}-${new Date().toISOString().split('T')[0]}.xlsx`
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break
      case 'pdf':
        fileBuffer = generatePDF(data, type)
        filename = `${type}-${new Date().toISOString().split('T')[0]}.pdf`
        contentType = 'application/pdf'
        break
      case 'json':
        fileBuffer = Buffer.from(JSON.stringify(data, null, 2))
        filename = `${type}-${new Date().toISOString().split('T')[0]}.json`
        contentType = 'application/json'
        break
      default:
        return NextResponse.json({ error: 'Formato não suportado' }, { status: 400 })
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Erro na exportação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

async function exportTransactions(userId: string, filters: any) {
  // Aplicar filtros
  const conditions = [eq(transactionsTable.userId, userId)]

  if (filters.startDate) {
    conditions.push(gte(transactionsTable.date, new Date(filters.startDate)))
  }
  if (filters.endDate) {
    conditions.push(lte(transactionsTable.date, new Date(filters.endDate)))
  }
  if (filters.categoryIds?.length) {
    conditions.push(inArray(transactionsTable.categoryId, filters.categoryIds))
  }
  if (filters.accountIds?.length) {
    conditions.push(inArray(transactionsTable.accountId, filters.accountIds))
  }
  if (filters.spaceIds?.length) {
    conditions.push(inArray(transactionsTable.spaceId, filters.spaceIds))
  }
  if (filters.type && filters.type !== 'all') {
    conditions.push(eq(transactionsTable.type, filters.type))
  }

  const query = db
    .select({
      id: transactionsTable.id,
      description: transactionsTable.description,
      amount: transactionsTable.amount,
      type: transactionsTable.type,
      date: transactionsTable.date,
      categoryName: categoriesTable.name,
      accountName: accountsTable.name,
      spaceName: spacesTable.name,
      createdAt: transactionsTable.createdAt,
    })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .leftJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
    .leftJoin(spacesTable, eq(transactionsTable.spaceId, spacesTable.id))
    .where(conditions.length > 1 ? and(...conditions) : conditions[0])
    .orderBy(desc(transactionsTable.date))

  return await query
}

async function exportFullBackup(userId: string, filters: any) {
  const [transactionData, categoriesData, accountsData, spacesData] = await Promise.all([
    exportTransactions(userId, filters),
    db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId)),
    db.select().from(accountsTable).where(eq(accountsTable.userId, userId)),
    db.select().from(spacesTable).where(eq(spacesTable.userId, userId)),
  ])

  return {
    exportDate: new Date().toISOString(),
    transactions: transactionData,
    categories: categoriesData,
    accounts: accountsData,
    spaces: spacesData,
    metadata: {
      totalTransactions: transactionData.length,
      totalCategories: categoriesData.length,
      totalAccounts: accountsData.length,
      totalSpaces: spacesData.length,
      filters,
    },
  }
}

async function exportReport(userId: string, filters: any) {
  const transactionData = await exportTransactions(userId, filters)

  const summary = {
    totalIncome: transactionData
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
    totalExpenses: transactionData
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
    transactionCount: transactionData.length,
    dateRange: {
      start: filters.startDate || transactionData[transactionData.length - 1]?.date,
      end: filters.endDate || transactionData[0]?.date,
    },
  }

  return {
    summary,
    transactions: transactionData,
    generatedAt: new Date().toISOString(),
  }
}

function generateCSV(data: any, type: string): Buffer {
  let csvContent = ''

  if (type === 'transactions' || type === 'report') {
    const transactions = type === 'report' ? data.transactions : data
    csvContent = 'ID,Descrição,Valor,Tipo,Data,Categoria,Conta,Espaço,Criado Em\n'

    transactions.forEach((transaction: any) => {
      csvContent +=
        [
          transaction.id,
          `"${transaction.description || ''}"`,
          transaction.amount,
          transaction.type,
          transaction.date,
          `"${transaction.categoryName || ''}"`,
          `"${transaction.accountName || ''}"`,
          `"${transaction.spaceName || ''}"`,
          transaction.createdAt,
        ].join(',') + '\n'
    })
  } else if (type === 'full-backup') {
    // Para backup completo, criar múltiplas seções
    csvContent = '=== TRANSAÇÕES ===\n'
    csvContent += 'ID,Descrição,Valor,Tipo,Data,Categoria,Conta,Espaço,Criado Em\n'

    data.transactions.forEach((transaction: any) => {
      csvContent +=
        [
          transaction.id,
          `"${transaction.description || ''}"`,
          transaction.amount,
          transaction.type,
          transaction.date,
          `"${transaction.categoryName || ''}"`,
          `"${transaction.accountName || ''}"`,
          `"${transaction.spaceName || ''}"`,
          transaction.createdAt,
        ].join(',') + '\n'
    })

    csvContent += '\n=== CATEGORIAS ===\n'
    csvContent += 'ID,Nome,Tipo,Cor,Ícone,Criado Em\n'
    data.categories.forEach((category: any) => {
      csvContent +=
        [category.id, `"${category.name}"`, category.type, category.color, category.icon, category.createdAt].join(
          ',',
        ) + '\n'
    })
  }

  return Buffer.from(csvContent, 'utf-8')
}

function generateExcel(data: any, type: string): Buffer {
  const workbook = XLSX.utils.book_new()

  if (type === 'transactions' || type === 'report') {
    const transactions = type === 'report' ? data.transactions : data
    const worksheet = XLSX.utils.json_to_sheet(
      transactions.map((t: any) => ({
        ID: t.id,
        Descrição: t.description,
        Valor: t.amount,
        Tipo: t.type,
        Data: t.date,
        Categoria: t.categoryName,
        Conta: t.accountName,
        Espaço: t.spaceName,
        'Criado Em': t.createdAt,
      })),
    )
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações')
  } else if (type === 'full-backup') {
    // Transações
    const transactionsWs = XLSX.utils.json_to_sheet(
      data.transactions.map((t: any) => ({
        ID: t.id,
        Descrição: t.description,
        Valor: t.amount,
        Tipo: t.type,
        Data: t.date,
        Categoria: t.categoryName,
        Conta: t.accountName,
        Espaço: t.spaceName,
        'Criado Em': t.createdAt,
      })),
    )
    XLSX.utils.book_append_sheet(workbook, transactionsWs, 'Transações')

    // Categorias
    const categoriesWs = XLSX.utils.json_to_sheet(
      data.categories.map((c: any) => ({
        ID: c.id,
        Nome: c.name,
        Tipo: c.type,
        Cor: c.color,
        Ícone: c.icon,
        'Criado Em': c.createdAt,
      })),
    )
    XLSX.utils.book_append_sheet(workbook, categoriesWs, 'Categorias')

    // Contas
    const accountsWs = XLSX.utils.json_to_sheet(
      data.accounts.map((a: any) => ({
        ID: a.id,
        Nome: a.name,
        Tipo: a.type,
        'Saldo Inicial': a.initialBalance,
        Espaço: a.spaceId,
        'Criado Em': a.createdAt,
      })),
    )
    XLSX.utils.book_append_sheet(workbook, accountsWs, 'Contas')

    // Espaços
    const spacesWs = XLSX.utils.json_to_sheet(
      data.spaces.map((s: any) => ({
        ID: s.id,
        Nome: s.name,
        Descrição: s.description,
        Cor: s.color,
        'Criado Em': s.createdAt,
      })),
    )
    XLSX.utils.book_append_sheet(workbook, spacesWs, 'Espaços')
  }

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
}

function generatePDF(data: any, type: string): Buffer {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text('Relatório Financeiro', 20, 20)

  doc.setFontSize(12)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30)

  if (type === 'report') {
    doc.text(`Receitas: R$ ${data.summary.totalIncome.toFixed(2)}`, 20, 45)
    doc.text(`Despesas: R$ ${data.summary.totalExpenses.toFixed(2)}`, 20, 55)
    doc.text(`Saldo: R$ ${(data.summary.totalIncome - data.summary.totalExpenses).toFixed(2)}`, 20, 65)
    doc.text(`Total de transações: ${data.summary.transactionCount}`, 20, 75)

    // Tabela de transações
    const tableData = data.transactions
      .slice(0, 50)
      .map((t: any) => [
        t.description,
        t.type === 'INCOME' ? '+' : '-',
        `R$ ${parseFloat(t.amount).toFixed(2)}`,
        new Date(t.date).toLocaleDateString('pt-BR'),
        t.categoryName || '',
      ])

    ;(doc as any).autoTable({
      head: [['Descrição', 'Tipo', 'Valor', 'Data', 'Categoria']],
      body: tableData,
      startY: 85,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    })
  }

  return Buffer.from(doc.output('arraybuffer'))
}
