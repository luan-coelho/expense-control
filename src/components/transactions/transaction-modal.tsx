'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { TransactionForm } from './transaction-form'
import { type TransactionWithRelations } from '@/types/transaction'

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: TransactionWithRelations
  spaces?: Array<{ id: string; name: string }>
  accounts?: Array<{ id: string; name: string; type: string }>
}

export function TransactionModal({
  open,
  onOpenChange,
  transaction,
  spaces = [],
  accounts = [],
}: TransactionModalProps) {
  const handleSuccess = () => {
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
        </DialogHeader>
        
        <TransactionForm
          transaction={transaction}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          spaces={spaces}
          accounts={accounts}
        />
      </DialogContent>
    </Dialog>
  )
} 