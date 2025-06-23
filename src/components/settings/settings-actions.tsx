'use client'

import { Button } from '@/components/ui/button'

interface SettingsActionsProps {
  onSave: () => void
  onReset: () => void
  isSaving?: boolean
  hasChanges?: boolean
  isValid?: boolean
  saveText?: string
  resetText?: string
}

export function SettingsActions({
  onSave,
  onReset,
  isSaving = false,
  hasChanges = false,
  isValid = true,
  saveText = 'Salvar Alterações',
  resetText = 'Cancelar',
}: SettingsActionsProps) {
  return (
    <div className="flex justify-end space-x-2 pt-4 border-t">
      <Button 
        variant="outline" 
        onClick={onReset}
        disabled={isSaving || !hasChanges}
      >
        {resetText}
      </Button>
      <Button 
        onClick={onSave}
        disabled={isSaving || !hasChanges || !isValid}
      >
        {isSaving ? 'Salvando...' : saveText}
      </Button>
    </div>
  )
} 