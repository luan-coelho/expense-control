'use client'

import { useState } from 'react'

import { TransactionList } from './transaction-list'
import { TransactionModal } from './transaction-modal'
import { 
  type TransactionWithRelations,
  type TransactionFilters 
} from '@/types/transaction'

interface TransactionManagerProps {
  spaces?: Array<{ id: string; name: string }>
  accounts?: Array<{ id: string; name: string; type: string }>
}

// Dados mock como fallback para spaces e accounts
const mockSpaces = [
  { id: '1', name: 'Pessoal' },
  { id: '2', name: 'Trabalho' },
  { id: '3', name: 'Família' },
  { id: '4', name: 'Negócios' },
]

const mockAccounts = [
  { id: '1', name: 'Conta Corrente', type: 'checking' },
  { id: '2', name: 'Conta Poupança', type: 'savings' },
  { id: '3', name: 'Cartão de Crédito', type: 'credit_card' },
  { id: '4', name: 'Dinheiro', type: 'cash' },
  { id: '5', name: 'Conta Investimento', type: 'investment' },
]

export function TransactionManager({
  spaces: propSpaces,
  accounts: propAccounts,
}: TransactionManagerProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithRelations | undefined>(undefined)
  const [filters, setFilters] = useState<TransactionFilters>({})

  // Usar props ou fallback para mock (spaces e accounts)
  const spaces = propSpaces || mockSpaces
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
      <TransactionList
        onAdd={handleAdd}
        onEdit={handleEdit}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <TransactionModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        transaction={editingTransaction}
        spaces={spaces}
        accounts={accounts}
      />
    </div>
  )
} 