// Tipos para melhor suporte TypeScript
export type RouteParams = Record<string, string | number>

/**
 * Rotas centralizadas da aplicação
 *
 * Este arquivo centraliza todas as rotas da aplicação (frontend e API) para facilitar
 * manutenção e refatoração. Sempre use estas rotas em vez de strings hardcoded.
 */

// Função utilitária para validar IDs
const validateId = (id: string): string => {
  if (!id || id.trim() === '') {
    throw new Error('ID é obrigatório')
  }
  return id.trim()
}

export const routes = {
  // Rotas do Frontend (páginas)
  frontend: {
    admin: {
      home: '/admin',
    },

    // Autenticação
    auth: {
      signin: '/auth/signin',
    },
  },

  // Rotas da API (backend)
  api: {
    transactions: {
      list: '/api/transactions',
      create: '/api/transactions',
      byId: (id: string) => `/api/transactions/${validateId(id)}`,
      update: (id: string) => `/api/transactions/${validateId(id)}`,
      delete: (id: string) => `/api/transactions/${validateId(id)}`,
    },

    categories: {
      list: '/api/categories',
      create: '/api/categories',
      byId: (id: string) => `/api/categories/${validateId(id)}`,
      update: (id: string) => `/api/categories/${validateId(id)}`,
      delete: (id: string) => `/api/categories/${validateId(id)}`,
    },

    spaces: {
      list: '/api/spaces',
      create: '/api/spaces',
      byId: (id: string) => `/api/spaces/${validateId(id)}`,
      update: (id: string) => `/api/spaces/${validateId(id)}`,
      delete: (id: string) => `/api/spaces/${validateId(id)}`,
    },

    accounts: {
      list: '/api/accounts',
      create: '/api/accounts',
      byId: (id: string) => `/api/accounts/${validateId(id)}`,
      update: (id: string) => `/api/accounts/${validateId(id)}`,
      delete: (id: string) => `/api/accounts/${validateId(id)}`,
    },
  },
}

/**
 * Query Keys para React Query
 * 
 * Centraliza todas as chaves de query para facilitar invalidação e cache management
 * Agora com suporte aprimorado para contexto de espaço
 */
export const queryKeys = {
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.transactions.lists(), { filters }] as const,
    details: () => [...queryKeys.transactions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), validateId(id)] as const,
    // Query keys específicas para espaço
    bySpace: (spaceId: string) => [...queryKeys.transactions.all, 'by-space', spaceId] as const,
  },

  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.categories.lists(), { filters }] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), validateId(id)] as const,
  },

  spaces: {
    all: ['spaces'] as const,
    lists: () => [...queryKeys.spaces.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.spaces.lists(), { filters }] as const,
    details: () => [...queryKeys.spaces.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.spaces.details(), validateId(id)] as const,
  },

  accounts: {
    all: ['accounts'] as const,
    lists: () => [...queryKeys.accounts.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.accounts.lists(), { filters }] as const,
    details: () => [...queryKeys.accounts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.accounts.details(), validateId(id)] as const,
  },

  analytics: {
    all: ['analytics'] as const,
    spendingByCategory: (filters?: Record<string, any>) => [...queryKeys.analytics.all, 'spending-by-category', filters] as const,
    spendingBySpace: (filters?: Record<string, any>) => [...queryKeys.analytics.all, 'spending-by-space', filters] as const,
    summaryMetrics: (filters?: Record<string, any>) => [...queryKeys.analytics.all, 'summary-metrics', filters] as const,
    monthlyIncomeExpenses: (filters?: Record<string, any>) => [...queryKeys.analytics.all, 'monthly-income-expenses', filters] as const,
    balanceEvolution: (filters?: Record<string, any>) => [...queryKeys.analytics.all, 'balance-evolution', filters] as const,
  },
} as const

export type FrontendRoutes = typeof routes.frontend
export type ApiRoutes = typeof routes.api
