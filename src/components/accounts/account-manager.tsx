'use client'

import { useState } from 'react'
import { type AccountWithRelations } from '@/types/account'
import { AccountList } from './account-list'
import { AccountModal } from './account-modal'

interface AccountManagerProps {
  className?: string
}

export function AccountManager({ className }: AccountManagerProps) {
  const [modalState, setModalState] = useState<{
    open: boolean
    account?: AccountWithRelations
  }>({
    open: false,
  })

  const handleCreateAccount = () => {
    setModalState({
      open: true,
    })
  }

  const handleEditAccount = (account: AccountWithRelations) => {
    setModalState({
      open: true,
      account,
    })
  }

  const handleCloseModal = () => {
    setModalState({
      open: false,
    })
  }

  return (
    <div className={className}>
      <AccountList onAdd={handleCreateAccount} onEdit={handleEditAccount} />

      <AccountModal open={modalState.open} onOpenChange={handleCloseModal} account={modalState.account} />
    </div>
  )
}
