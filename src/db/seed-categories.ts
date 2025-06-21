import { db } from './index'
import { categoriesTable } from './schema/category-schema'

// Categorias predefinidas do sistema
const defaultCategories = [
  // Categorias de RECEITA
  {
    name: 'Salário',
    type: 'INCOME',
    icon: '💰',
    color: '#10B981',
    isDefault: true,
    sortOrder: '01',
  },
  {
    name: 'Freelance',
    type: 'INCOME',
    icon: '💻',
    color: '#3B82F6',
    isDefault: true,
    sortOrder: '02',
  },
  {
    name: 'Investimentos',
    type: 'INCOME',
    icon: '📈',
    color: '#8B5CF6',
    isDefault: true,
    sortOrder: '03',
  },
  {
    name: 'Aluguéis',
    type: 'INCOME',
    icon: '🏠',
    color: '#F59E0B',
    isDefault: true,
    sortOrder: '04',
  },
  {
    name: 'Vendas',
    type: 'INCOME',
    icon: '🛍️',
    color: '#EF4444',
    isDefault: true,
    sortOrder: '05',
  },
  {
    name: 'Outros',
    type: 'INCOME',
    icon: '💡',
    color: '#6B7280',
    isDefault: true,
    sortOrder: '06',
  },

  // Categorias de DESPESA
  {
    name: 'Alimentação',
    type: 'EXPENSE',
    icon: '🍽️',
    color: '#EF4444',
    isDefault: true,
    sortOrder: '10',
  },
  {
    name: 'Transporte',
    type: 'EXPENSE',
    icon: '🚗',
    color: '#F59E0B',
    isDefault: true,
    sortOrder: '11',
  },
  {
    name: 'Moradia',
    type: 'EXPENSE',
    icon: '🏠',
    color: '#8B5CF6',
    isDefault: true,
    sortOrder: '12',
  },
  {
    name: 'Saúde',
    type: 'EXPENSE',
    icon: '🏥',
    color: '#10B981',
    isDefault: true,
    sortOrder: '13',
  },
  {
    name: 'Educação',
    type: 'EXPENSE',
    icon: '📚',
    color: '#3B82F6',
    isDefault: true,
    sortOrder: '14',
  },
  {
    name: 'Lazer',
    type: 'EXPENSE',
    icon: '🎮',
    color: '#EC4899',
    isDefault: true,
    sortOrder: '15',
  },
  {
    name: 'Compras',
    type: 'EXPENSE',
    icon: '🛒',
    color: '#F97316',
    isDefault: true,
    sortOrder: '16',
  },
  {
    name: 'Impostos',
    type: 'EXPENSE',
    icon: '📄',
    color: '#6B7280',
    isDefault: true,
    sortOrder: '17',
  },
  {
    name: 'Investimentos',
    type: 'EXPENSE',
    icon: '💎',
    color: '#8B5CF6',
    isDefault: true,
    sortOrder: '18',
  },
  {
    name: 'Outros',
    type: 'EXPENSE',
    icon: '❓',
    color: '#6B7280',
    isDefault: true,
    sortOrder: '19',
  },
]

// Subcategorias de exemplo (hierarquia)
const defaultSubcategories = [
  // Subcategorias de Alimentação
  {
    name: 'Restaurantes',
    type: 'EXPENSE',
    icon: '🍕',
    color: '#EF4444',
    isDefault: true,
    parentName: 'Alimentação',
    sortOrder: '10.1',
  },
  {
    name: 'Supermercado',
    type: 'EXPENSE',
    icon: '🛒',
    color: '#EF4444',
    isDefault: true,
    parentName: 'Alimentação',
    sortOrder: '10.2',
  },
  
  // Subcategorias de Transporte
  {
    name: 'Combustível',
    type: 'EXPENSE',
    icon: '⛽',
    color: '#F59E0B',
    isDefault: true,
    parentName: 'Transporte',
    sortOrder: '11.1',
  },
  {
    name: 'Transporte Público',
    type: 'EXPENSE',
    icon: '🚌',
    color: '#F59E0B',
    isDefault: true,
    parentName: 'Transporte',
    sortOrder: '11.2',
  },
  
  // Subcategorias de Moradia
  {
    name: 'Aluguel',
    type: 'EXPENSE',
    icon: '🏠',
    color: '#8B5CF6',
    isDefault: true,
    parentName: 'Moradia',
    sortOrder: '12.1',
  },
  {
    name: 'Contas de Casa',
    type: 'EXPENSE',
    icon: '⚡',
    color: '#8B5CF6',
    isDefault: true,
    parentName: 'Moradia',
    sortOrder: '12.2',
  },
]

export async function seedDefaultCategories() {
  console.log('🌱 Iniciando seed das categorias predefinidas...')

  try {
    // Inserir categorias principais
    const insertedCategories = await db
      .insert(categoriesTable)
      .values(
        defaultCategories.map((category) => ({
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
          isDefault: category.isDefault,
          sortOrder: category.sortOrder,
          userId: null, // null para categorias do sistema
        }))
      )
      .returning()

    console.log(`✅ ${insertedCategories.length} categorias principais inseridas`)

    // Mapear nomes para IDs das categorias pai
    const categoryNameToId = insertedCategories.reduce((acc, cat) => {
      acc[cat.name] = cat.id
      return acc
    }, {} as Record<string, string>)

    // Inserir subcategorias
    const subcategoriesToInsert = defaultSubcategories.map((subcat) => ({
      name: subcat.name,
      type: subcat.type,
      icon: subcat.icon,
      color: subcat.color,
      isDefault: subcat.isDefault,
      sortOrder: subcat.sortOrder,
      userId: null, // null para categorias do sistema
      parentId: categoryNameToId[subcat.parentName],
    }))

    const insertedSubcategories = await db
      .insert(categoriesTable)
      .values(subcategoriesToInsert)
      .returning()

    console.log(`✅ ${insertedSubcategories.length} subcategorias inseridas`)
    console.log('🎉 Seed das categorias concluído com sucesso!')

    return {
      categories: insertedCategories,
      subcategories: insertedSubcategories,
    }
  } catch (error) {
    console.error('❌ Erro ao fazer seed das categorias:', error)
    throw error
  }
}

// Executar seed se chamado diretamente
if (require.main === module) {
  seedDefaultCategories()
    .then(() => {
      console.log('✅ Seed executado com sucesso!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Erro no seed:', error)
      process.exit(1)
    })
} 