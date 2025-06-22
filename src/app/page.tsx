'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { RecentTransactions } from '@/components/dashboard'
import { SpendingByCategoryChart } from '@/components/charts'
import { useDashboardStats, formatCurrency } from '@/hooks'

export default function Home() {
  const { totalBalance, totalIncome, totalExpenses, totalTransactions, isLoading } = useDashboardStats()

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das suas finanças pessoais</p>
        </div>
        <Button asChild>
          <Link href="/transactions">Nova Transação</Link>
        </Button>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Saldo Total"
          value={isLoading ? 'Carregando...' : formatCurrency(totalBalance)}
          icon={
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                totalBalance >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
              <svg
                className={`w-4 h-4 ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          }
        />

        <StatCard
          title="Receitas"
          value={isLoading ? 'Carregando...' : formatCurrency(totalIncome)}
          icon={
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          }
        />

        <StatCard
          title="Despesas"
          value={isLoading ? 'Carregando...' : formatCurrency(totalExpenses)}
          icon={
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          }
        />

        <StatCard
          title="Transações"
          value={isLoading ? 'Carregando...' : totalTransactions.toString()}
          icon={
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          }
        />
      </div>

      {/* Test Chart - Temporary */}
      <div className="bg-card rounded-lg border p-6">
        <SpendingByCategoryChart />
      </div>

      {/* Recent transactions */}
      <RecentTransactions limit={5} />
    </div>
  )
}
