'use client'

import { Suspense } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { TransactionManager, UpcomingTransactions } from '@/components/transactions'
import { useSpaces } from '@/hooks/use-spaces'
import { useAccounts } from '@/hooks/use-accounts'
import { AlertCircle, RefreshCw, Database, CreditCard } from 'lucide-react'

function TransactionManagerWrapper() {
  const { 
    data: spacesData, 
    isLoading: spacesLoading, 
    error: spacesError,
    refetch: refetchSpaces 
  } = useSpaces()
  
  const { 
    data: accountsData, 
    isLoading: accountsLoading, 
    error: accountsError,
    refetch: refetchAccounts 
  } = useAccounts()

  // Estados de loading
  if (spacesLoading || accountsLoading) {
    return <TransactionManagerSkeleton />
  }

  // Estados de erro
  if (spacesError || accountsError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={<AlertCircle className="w-16 h-16" />}
            title="Erro ao carregar dados"
            description={
              spacesError 
                ? "Não foi possível carregar os espaços. Verifique sua conexão e tente novamente."
                : "Não foi possível carregar as contas. Verifique sua conexão e tente novamente."
            }
            action={{
              label: "Tentar novamente",
              onClick: () => {
                if (spacesError) refetchSpaces()
                if (accountsError) refetchAccounts()
              }
            }}
          />
        </CardContent>
      </Card>
    )
  }

  // Extrair dados dos resultados paginados
  const spaces = spacesData?.spaces || []
  const accounts = accountsData?.accounts || []

  // Transformar dados para o formato esperado pelo TransactionManager
  const transformedSpaces = spaces.map(space => ({
    id: space.id,
    name: space.name
  }))

  const transformedAccounts = accounts.map(account => ({
    id: account.id,
    name: account.name,
    type: account.type.toLowerCase()
  }))

  // Estado vazio - sem espaços ou contas
  if (spaces.length === 0 && accounts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={<Database className="w-16 h-16" />}
            title="Configure seus espaços e contas"
            description="Para começar a gerenciar suas transações, você precisa criar pelo menos um espaço e uma conta."
            action={{
              label: "Recarregar",
              onClick: () => {
                refetchSpaces()
                refetchAccounts()
              }
            }}
          />
        </CardContent>
      </Card>
    )
  }

  // Estado vazio - sem espaços
  if (spaces.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={<Database className="w-16 h-16" />}
            title="Nenhum espaço encontrado"
            description="Você precisa criar pelo menos um espaço para organizar suas transações."
            action={{
              label: "Recarregar",
              onClick: () => refetchSpaces()
            }}
          />
        </CardContent>
      </Card>
    )
  }

  // Estado vazio - sem contas
  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={<CreditCard className="w-16 h-16" />}
            title="Nenhuma conta encontrada"
            description="Você precisa criar pelo menos uma conta para registrar suas transações."
            action={{
              label: "Recarregar",
              onClick: () => refetchAccounts()
            }}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <TransactionManager
      spaces={transformedSpaces}
      accounts={transformedAccounts}
    />
  )
}

function TransactionManagerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* List skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transações</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<TransactionManagerSkeleton />}>
            <TransactionManagerWrapper />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<UpcomingTransactionsSkeleton />}>
            <UpcomingTransactions limit={5} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function UpcomingTransactionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-4 w-20 ml-auto" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 