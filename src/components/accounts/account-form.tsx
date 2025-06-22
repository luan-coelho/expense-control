'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useCreateAccount, useUpdateAccount } from '@/hooks'
import {
  createAccountSchema,
  sanitizeAccountName,
  getAccountTypesForSelect,
  ACCOUNT_VALIDATION_RULES,
  type CreateAccountInput,
  type AccountWithRelations,
  type AccountTypeEnum,
} from '@/types/account'

interface AccountFormProps {
  account?: AccountWithRelations
  onSuccess?: () => void
  onCancel?: () => void
}

// Mapeamento de tipos de conta para labels em português
const accountTypeLabels: Record<AccountTypeEnum, string> = {
  CHECKING: 'Conta Corrente',
  SAVINGS: 'Poupança',
  CREDIT_CARD: 'Cartão de Crédito',
  INVESTMENT: 'Investimento',
  CASH: 'Dinheiro',
  OTHER: 'Outro',
}

export function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const isEditing = !!account
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: account?.name || '',
      type: (account?.type as AccountTypeEnum) || 'CHECKING',
    },
    mode: 'onChange', // Validação em tempo real
  })

  const createMutation = useCreateAccount()
  const updateMutation = useUpdateAccount()

  const isLoading = createMutation.isPending || updateMutation.isPending
  const watchedName = form.watch('name')
  const watchedType = form.watch('type')
  const sanitizedName = watchedName ? sanitizeAccountName(watchedName) : ''

  // Obter opções de tipos de conta com ícones
  const accountTypes = getAccountTypesForSelect()

  function handleSubmit(values: CreateAccountInput) {
    // Sanitizar dados antes de enviar
    const sanitizedValues = {
      ...values,
      name: sanitizeAccountName(values.name),
    }

    if (isEditing) {
      updateMutation.mutate(
        { id: account.id, data: sanitizedValues },
        {
          onSuccess: () => {
            onSuccess?.()
          },
          onError: (error: any) => {
            // Tratar erros específicos de validação do backend
            if (error?.response?.data?.field) {
              form.setError(error.response.data.field as keyof CreateAccountInput, {
                type: 'server',
                message: error.response.data.error,
              })
            }
          },
        },
      )
    } else {
      createMutation.mutate(sanitizedValues, {
        onSuccess: () => {
          form.reset()
          onSuccess?.()
        },
        onError: (error: any) => {
          // Tratar erros específicos de validação do backend
          if (error?.response?.data?.field) {
            form.setError(error.response.data.field as keyof CreateAccountInput, {
              type: 'server',
              message: error.response.data.error,
            })
          }
        },
      })
    }
  }

  function handlePreview() {
    setIsPreviewMode(!isPreviewMode)
  }

  // Calcular estatísticas do nome
  const nameLength = watchedName?.length || 0
  const remainingChars = ACCOUNT_VALIDATION_RULES.NAME_MAX_LENGTH - nameLength
  const isNameValid =
    nameLength >= ACCOUNT_VALIDATION_RULES.NAME_MIN_LENGTH && nameLength <= ACCOUNT_VALIDATION_RULES.NAME_MAX_LENGTH

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center justify-between">
                Nome da Conta
                <span className={`text-xs ${isNameValid ? 'text-muted-foreground' : 'text-destructive'}`}>
                  {nameLength}/{ACCOUNT_VALIDATION_RULES.NAME_MAX_LENGTH}
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Nubank, Itaú, Carteira..."
                  {...field}
                  className={`${!isNameValid && nameLength > 0 ? 'border-destructive' : ''}`}
                  maxLength={ACCOUNT_VALIDATION_RULES.NAME_MAX_LENGTH}
                />
              </FormControl>
              <FormDescription className="text-xs space-y-1">
                <div>Use um nome que identifique claramente esta conta</div>
                {remainingChars <= 10 && remainingChars > 0 && (
                  <div className="text-amber-600">{remainingChars} caracteres restantes</div>
                )}
                {nameLength > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handlePreview}
                      className="h-6 px-2 text-xs">
                      {isPreviewMode ? 'Ocultar' : 'Mostrar'} prévia
                    </Button>
                    {isPreviewMode && sanitizedName && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">"{sanitizedName}"</span>
                    )}
                  </div>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo da Conta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo da conta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accountTypes.map(accountType => (
                    <SelectItem key={accountType.value} value={accountType.value}>
                      <div className="flex items-center gap-2">
                        <span>{accountType.icon}</span>
                        <span>{accountType.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className="text-xs">Escolha o tipo que melhor representa esta conta</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Informações de validação */}
        {nameLength > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <h4 className="text-sm font-medium">Validação do Nome</h4>
            <div className="space-y-1 text-xs">
              <div
                className={`flex items-center gap-2 ${
                  nameLength >= ACCOUNT_VALIDATION_RULES.NAME_MIN_LENGTH ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                <span>{nameLength >= ACCOUNT_VALIDATION_RULES.NAME_MIN_LENGTH ? '✓' : '○'}</span>
                Mínimo {ACCOUNT_VALIDATION_RULES.NAME_MIN_LENGTH} caracteres
              </div>
              <div
                className={`flex items-center gap-2 ${
                  nameLength <= ACCOUNT_VALIDATION_RULES.NAME_MAX_LENGTH ? 'text-green-600' : 'text-destructive'
                }`}>
                <span>{nameLength <= ACCOUNT_VALIDATION_RULES.NAME_MAX_LENGTH ? '✓' : '✗'}</span>
                Máximo {ACCOUNT_VALIDATION_RULES.NAME_MAX_LENGTH} caracteres
              </div>
              <div
                className={`flex items-center gap-2 ${
                  ACCOUNT_VALIDATION_RULES.ALLOWED_NAME_PATTERN.test(watchedName || '')
                    ? 'text-green-600'
                    : 'text-muted-foreground'
                }`}>
                <span>{ACCOUNT_VALIDATION_RULES.ALLOWED_NAME_PATTERN.test(watchedName || '') ? '✓' : '○'}</span>
                Apenas letras, números e símbolos permitidos
              </div>
            </div>
          </div>
        )}

        {/* Prévia do tipo selecionado */}
        {watchedType && (
          <div className="rounded-lg bg-muted/50 p-3">
            <h4 className="text-sm font-medium mb-2">Tipo Selecionado</h4>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">{accountTypes.find(t => t.value === watchedType)?.icon}</span>
              <span className="font-medium">{accountTypes.find(t => t.value === watchedType)?.label}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading || !form.formState.isValid} className="min-w-[100px]">
            {isLoading ? (isEditing ? 'Atualizando...' : 'Criando...') : isEditing ? 'Atualizar' : 'Criar Conta'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
