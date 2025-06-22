import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { transactionsTable, categoriesTable, accountsTable, spacesTable } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const mappings = JSON.parse((formData.get('mappings') as string) || '{}')
    const preview = formData.get('preview') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não suportado. Use CSV ou Excel.' }, { status: 400 })
    }

    // Processar arquivo
    const fileContent = await file.text()
    const parsedData = parseCSV(fileContent)

    if (parsedData.length === 0) {
      return NextResponse.json({ error: 'Arquivo vazio ou formato inválido' }, { status: 400 })
    }

    // Validar e mapear dados
    const validationResult = await validateAndMapData(parsedData, mappings, session.user.id, preview)

    if (preview) {
      return NextResponse.json({
        preview: validationResult.validTransactions.slice(0, 10),
        errors: validationResult.errors,
        stats: {
          total: parsedData.length,
          valid: validationResult.validTransactions.length,
          invalid: validationResult.errors.length,
        },
      })
    }

    // Inserir transações válidas
    if (validationResult.validTransactions.length > 0) {
      const insertedTransactions = await db
        .insert(transactionsTable)
        .values(validationResult.validTransactions)
        .returning()

      return NextResponse.json({
        success: true,
        imported: insertedTransactions.length,
        errors: validationResult.errors,
        transactions: insertedTransactions,
      })
    }

    return NextResponse.json({
      success: false,
      imported: 0,
      errors: validationResult.errors,
    })
  } catch (error) {
    console.error('Erro na importação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Gerar template CSV
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const csvTemplate = `description,amount,type,date,category,account,space
Exemplo de receita,1000.00,INCOME,2024-01-15,Salário,Conta Corrente,Pessoal
Exemplo de despesa,50.00,EXPENSE,2024-01-15,Alimentação,Cartão de Crédito,Pessoal`

    return new NextResponse(csvTemplate, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="template-importacao.csv"',
      },
    })
  } catch (error) {
    console.error('Erro ao gerar template:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

function parseCSV(content: string): any[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const data = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: any = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    data.push(row)
  }

  return data
}

async function validateAndMapData(data: any[], mappings: any, userId: string, preview: boolean) {
  const validTransactions = []
  const errors = []

  // Buscar entidades existentes para validação
  const [categories, accounts, spaces] = await Promise.all([
    db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId)),
    db.select().from(accountsTable).where(eq(accountsTable.userId, userId)),
    db.select().from(spacesTable).where(eq(spacesTable.userId, userId)),
  ])

  const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]))
  const accountMap = new Map(accounts.map(a => [a.name.toLowerCase(), a.id]))
  const spaceMap = new Map(spaces.map(s => [s.name.toLowerCase(), s.id]))

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNumber = i + 2 // +2 porque começamos do índice 0 e pulamos o header

    try {
      // Mapear campos usando os mappings fornecidos ou nomes padrão
      const description = row[mappings.description || 'description']
      const amount = parseFloat(row[mappings.amount || 'amount'])
      const type = row[mappings.type || 'type']?.toUpperCase()
      const date = new Date(row[mappings.date || 'date'])
      const categoryName = row[mappings.category || 'category']
      const accountName = row[mappings.account || 'account']
      const spaceName = row[mappings.space || 'space']

      // Validações
      const rowErrors = []

      if (!description || description.trim() === '') {
        rowErrors.push('Descrição é obrigatória')
      }

      if (isNaN(amount) || amount <= 0) {
        rowErrors.push('Valor deve ser um número positivo')
      }

      if (!['INCOME', 'EXPENSE'].includes(type)) {
        rowErrors.push('Tipo deve ser INCOME ou EXPENSE')
      }

      if (isNaN(date.getTime())) {
        rowErrors.push('Data inválida')
      }

      // Buscar IDs das entidades
      const categoryId = categoryMap.get(categoryName?.toLowerCase())
      const accountId = accountMap.get(accountName?.toLowerCase())
      const spaceId = spaceMap.get(spaceName?.toLowerCase())

      if (!categoryId) {
        rowErrors.push(`Categoria "${categoryName}" não encontrada`)
      }

      if (!accountId) {
        rowErrors.push(`Conta "${accountName}" não encontrada`)
      }

      if (!spaceId) {
        rowErrors.push(`Espaço "${spaceName}" não encontrado`)
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          errors: rowErrors,
          data: row,
        })
      } else {
        // Verificar duplicatas se não for preview
        if (!preview) {
          const existingTransaction = await db
            .select()
            .from(transactionsTable)
            .where(
              and(
                eq(transactionsTable.userId, userId),
                eq(transactionsTable.description, description.trim()),
                eq(transactionsTable.amount, amount.toString()),
                eq(transactionsTable.date, date),
                eq(transactionsTable.categoryId, categoryId!),
                eq(transactionsTable.accountId, accountId!),
                eq(transactionsTable.spaceId, spaceId!),
              ),
            )
            .limit(1)

          if (existingTransaction.length > 0) {
            errors.push({
              row: rowNumber,
              errors: ['Transação duplicada já existe no sistema'],
              data: row,
            })
            continue
          }
        }

        validTransactions.push({
          userId,
          description: description.trim(),
          amount: amount.toString(),
          type: type as 'INCOME' | 'EXPENSE',
          date,
          categoryId: categoryId!,
          accountId: accountId!,
          spaceId: spaceId!,
          isRecurrent: false,
        })
      }
    } catch (error) {
      errors.push({
        row: rowNumber,
        errors: [`Erro ao processar linha: ${error}`],
        data: row,
      })
    }
  }

  return { validTransactions, errors }
}
