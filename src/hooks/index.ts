// Arquivo de exportação para hooks
// Adicione exportações de hooks aqui conforme necessário

export { useIsMobile } from './use-mobile'

// Hooks de transações
export {
  useTransactions,
  useTransaction,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useInvalidateTransactions,
  type UseTransactionsParams,
} from './use-transactions'

// Hooks de categorias
export {
  useCategories,
  useCategory,
  useCategoriesByType,
  useRootCategories,
  useCategoryChildren,
  useDefaultCategories,
  useSearchCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useInvalidateCategories,
  type UseCategoriesParams,
} from './use-categories'

// Hooks de espaços
export {
  useSpaces,
  useSpace,
  useSearchSpaces,
  useCreateSpace,
  useUpdateSpace,
  useDeleteSpace,
  useInvalidateSpaces,
  type UseSpacesParams,
} from './use-spaces'

// Hooks de contas
export {
  useAccounts,
  useAccount,
  useAccountsByType,
  useSearchAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useInvalidateAccounts,
  type UseAccountsParams,
} from './use-accounts'

// Hooks de dashboard
export { useDashboardStats, formatCurrency, type DashboardStats } from './use-dashboard-stats'

// Hooks de transações recorrentes
export {
  useRecurringTransactionInstances,
  useCreateRecurringTransaction,
  useRecurringTransactionsStats,
  recurringTransactionKeys,
} from './use-recurring-transactions'

// Hooks de analytics
export {
  useSpendingByCategory,
  useSummaryMetrics,
  useSpendingBySpace,
  useMonthlyIncomeExpenses,
  useBalanceEvolution,
} from './use-analytics'

// Hooks de exportação
export { useExport } from './use-export'

// Hooks de performance
export { useChartPerformance } from './use-chart-performance'

// Hooks de layout responsivo
export { useResponsiveLayout } from './use-responsive-layout'

// Hooks de notificações
export {
  useNotifications,
  useNotification,
  useUnreadNotificationsCount,
  useNotificationSettings,
  useCreateNotification,
  useUpdateNotification,
  useDeleteNotification,
  useMarkAsRead,
  useMarkAsUnread,
  useMarkAllAsRead,
  useUpdateNotificationSettings,
} from './use-notifications'

export {}
