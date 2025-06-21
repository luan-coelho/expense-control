'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { AccountForm } from './account-form'
import { type AccountWithRelations } from '@/types/account'

interface AccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: AccountWithRelations
}

export function AccountModal({
  open,
  onOpenChange,
  account,
}: AccountModalProps) {
  const isEditing = !!account

  const handleSuccess = () => {
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Conta' : 'Nova Conta'}
          </DialogTitle>
        </DialogHeader>
        <AccountForm
          account={account}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
} 