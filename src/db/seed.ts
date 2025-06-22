import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { usersTable, categoriesTable, spacesTable, accountsTable, transactionsTable } from './schema'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client)

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...')

  try {
    // Criar usuário de teste
    const [user] = await db
      .insert(usersTable)
      .values({
        email: 'usuario@teste.com',
        name: 'Usuário Teste',
      })
      .returning()
      .onConflictDoNothing()

    console.log('✅ Usuário de teste criado:', user.email)

    // Criar categorias padrão
    const categories = await db
      .insert(categoriesTable)
      .values([
        { userId: user.id, name: 'Alimentação', icon: '🍔', isDefault: true },
        { userId: user.id, name: 'Transporte', icon: '🚗', isDefault: true },
        { userId: user.id, name: 'Saúde', icon: '🏥', isDefault: true },
        { userId: user.id, name: 'Educação', icon: '📚', isDefault: true },
        { userId: user.id, name: 'Lazer', icon: '🎮', isDefault: true },
        { userId: user.id, name: 'Casa', icon: '🏠', isDefault: true },
        { userId: user.id, name: 'Salário', icon: '💰', isDefault: true },
        { userId: user.id, name: 'Freelance', icon: '💻', isDefault: true },
        { userId: user.id, name: 'Investimentos', icon: '📈', isDefault: true },
        { userId: user.id, name: 'Outros', icon: '📦', isDefault: true },
      ])
      .returning()
      .onConflictDoNothing()

    console.log('✅ Categorias criadas:', categories.length)

    // Criar espaços padrão
    const spaces = await db
      .insert(spacesTable)
      .values([
        { userId: user.id, name: 'Pessoal' },
        { userId: user.id, name: 'Trabalho' },
        { userId: user.id, name: 'Família' },
        { userId: user.id, name: 'Negócios' },
      ])
      .returning()
      .onConflictDoNothing()

    console.log('✅ Espaços criados:', spaces.length)

    // Criar contas padrão
    const accounts = await db
      .insert(accountsTable)
      .values([
        { userId: user.id, name: 'Conta Corrente', type: 'checking' },
        { userId: user.id, name: 'Conta Poupança', type: 'savings' },
        { userId: user.id, name: 'Cartão de Crédito', type: 'credit_card' },
        { userId: user.id, name: 'Dinheiro', type: 'cash' },
        { userId: user.id, name: 'Conta Investimento', type: 'investment' },
      ])
      .returning()
      .onConflictDoNothing()

    console.log('✅ Contas criadas:', accounts.length)

    // Criar transações de exemplo
    const sampleTransactions = [
      // Receitas
      {
        userId: user.id,
        amount: '5000.00',
        date: new Date('2024-01-01'),
        description: 'Salário Janeiro',
        categoryId: categories.find(c => c.name === 'Salário')?.id!,
        spaceId: spaces.find(s => s.name === 'Pessoal')?.id!,
        accountId: accounts.find(a => a.name === 'Conta Corrente')?.id!,
        type: 'INCOME' as const,
      },
      {
        userId: user.id,
        amount: '1500.00',
        date: new Date('2024-01-05'),
        description: 'Projeto Freelance',
        categoryId: categories.find(c => c.name === 'Freelance')?.id!,
        spaceId: spaces.find(s => s.name === 'Trabalho')?.id!,
        accountId: accounts.find(a => a.name === 'Conta Corrente')?.id!,
        type: 'INCOME' as const,
      },

      // Despesas
      {
        userId: user.id,
        amount: '800.00',
        date: new Date('2024-01-02'),
        description: 'Supermercado',
        categoryId: categories.find(c => c.name === 'Alimentação')?.id!,
        spaceId: spaces.find(s => s.name === 'Família')?.id!,
        accountId: accounts.find(a => a.name === 'Cartão de Crédito')?.id!,
        type: 'EXPENSE' as const,
      },
      {
        userId: user.id,
        amount: '150.00',
        date: new Date('2024-01-03'),
        description: 'Gasolina',
        categoryId: categories.find(c => c.name === 'Transporte')?.id!,
        spaceId: spaces.find(s => s.name === 'Pessoal')?.id!,
        accountId: accounts.find(a => a.name === 'Conta Corrente')?.id!,
        type: 'EXPENSE' as const,
      },
      {
        userId: user.id,
        amount: '120.00',
        date: new Date('2024-01-04'),
        description: 'Consulta médica',
        categoryId: categories.find(c => c.name === 'Saúde')?.id!,
        spaceId: spaces.find(s => s.name === 'Pessoal')?.id!,
        accountId: accounts.find(a => a.name === 'Dinheiro')?.id!,
        type: 'EXPENSE' as const,
      },
      {
        userId: user.id,
        amount: '80.00',
        date: new Date('2024-01-06'),
        description: 'Cinema',
        categoryId: categories.find(c => c.name === 'Lazer')?.id!,
        spaceId: spaces.find(s => s.name === 'Pessoal')?.id!,
        accountId: accounts.find(a => a.name === 'Cartão de Crédito')?.id!,
        type: 'EXPENSE' as const,
      },
      {
        userId: user.id,
        amount: '200.00',
        date: new Date('2024-01-07'),
        description: 'Curso online',
        categoryId: categories.find(c => c.name === 'Educação')?.id!,
        spaceId: spaces.find(s => s.name === 'Pessoal')?.id!,
        accountId: accounts.find(a => a.name === 'Conta Corrente')?.id!,
        type: 'EXPENSE' as const,
      },
      {
        userId: user.id,
        amount: '1000.00',
        date: new Date('2024-01-08'),
        description: 'Investimento CDB',
        categoryId: categories.find(c => c.name === 'Investimentos')?.id!,
        spaceId: spaces.find(s => s.name === 'Pessoal')?.id!,
        accountId: accounts.find(a => a.name === 'Conta Investimento')?.id!,
        type: 'EXPENSE' as const,
      },
    ]

    const transactions = await db.insert(transactionsTable).values(sampleTransactions).returning().onConflictDoNothing()

    console.log('✅ Transações de exemplo criadas:', transactions.length)

    console.log('🎉 Seed concluído com sucesso!')
    console.log('\n📊 Resumo:')
    console.log(`- Usuários: 1`)
    console.log(`- Categorias: ${categories.length}`)
    console.log(`- Espaços: ${spaces.length}`)
    console.log(`- Contas: ${accounts.length}`)
    console.log(`- Transações: ${transactions.length}`)
  } catch (error) {
    console.error('❌ Erro durante o seed:', error)
    throw error
  } finally {
    await client.end()
  }
}

// Executar seed se este arquivo for chamado diretamente
if (require.main === module) {
  seed().catch(error => {
    console.error('Erro fatal durante o seed:', error)
    process.exit(1)
  })
}

export { seed }
