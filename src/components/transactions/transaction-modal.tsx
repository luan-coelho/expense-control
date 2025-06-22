'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { TransactionForm } from './transaction-form'
import { type TransactionWithRelations } from '@/types/transaction'

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: TransactionWithRelations
  accounts?: Array<{ id: string; name: string; type: string }>
}

export function TransactionModal({ open, onOpenChange, transaction, accounts = [] }: TransactionModalProps) {
  const handleSuccess = () => {
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl">{transaction ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
        </DialogHeader>

        <TransactionForm
          transaction={transaction}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          accounts={accounts}
        />
      </DialogContent>
    </Dialog>
  )
}
