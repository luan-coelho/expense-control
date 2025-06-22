'use client'

import { useState } from 'react'

import { TransactionList } from './transaction-list'
import { TransactionModal } from './transaction-modal'
import { type TransactionWithRelations, type TransactionFilters } from '@/types/transaction'

interface TransactionManagerProps {
  accounts?: Array<{ id: string; name: string; type: string }>
}

const mockAccounts = [
  { id: '1', name: 'Conta Corrente', type: 'checking' },
  { id: '2', name: 'Conta Poupança', type: 'savings' },
  { id: '3', name: 'Cartão de Crédito', type: 'credit_card' },
  { id: '4', name: 'Dinheiro', type: 'cash' },
  { id: '5', name: 'Conta Investimento', type: 'investment' },
]

export function TransactionManager({ accounts: propAccounts }: TransactionManagerProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithRelations | undefined>(undefined)
  const [filters, setFilters] = useState<TransactionFilters>({})

  // Usar props ou fallback para mock (accounts)
  const accounts = propAccounts || mockAccounts

  const handleAdd = () => {
    setEditingTransaction(undefined)
    setModalOpen(true)
  }

  const handleEdit = (transaction: TransactionWithRelations) => {
    setEditingTransaction(transaction)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingTransaction(undefined)
  }

  return (
    <div className="space-y-6">
      <TransactionList onAdd={handleAdd} onEdit={handleEdit} filters={filters} onFiltersChange={setFilters} />

      <TransactionModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        transaction={editingTransaction}
        accounts={accounts}
      />
    </div>
  )
}
