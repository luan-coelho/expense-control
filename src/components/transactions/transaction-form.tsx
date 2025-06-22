'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { CategorySelect } from '@/components/categories'
import { useActiveSpaceId } from '@/components/providers/space-provider'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/use-transactions'
import {
  createTransactionSchema,
  TransactionType,
  updateTransactionSchema,
  type CreateTransactionInput,
  type TransactionWithRelations,
  type UpdateTransactionInput,
} from '@/types/transaction'
import { RecurrenceConfig } from './recurrence-config'

interface TransactionFormProps {
  transaction?: TransactionWithRelations
  onSuccess?: () => void
  onCancel?: () => void
  accounts?: Array<{ id: string; name: string; type: string }>
}

export function TransactionForm({ transaction, onSuccess, onCancel, accounts = [] }: TransactionFormProps) {
  const isEditing = !!transaction
  const [isSubmitting, setIsSubmitting] = useState(false)
  const activeSpaceId = useActiveSpaceId()

  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()

  // Função para formatar data para string ISO
  const formatDateForSubmit = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  // Função para converter string para Date
  const parseStringToDate = (dateString: string): Date => {
    return new Date(dateString)
  }

  // Obter data atual formatada
  const getCurrentDate = (): string => {
    return formatDateForSubmit(new Date())
  }

  const form = useForm<CreateTransactionInput | UpdateTransactionInput>({
    resolver: zodResolver(isEditing ? updateTransactionSchema : createTransactionSchema),
    defaultValues: isEditing
      ? {
          amount: transaction.amount.toString(),
          description: transaction.description,
          date: typeof transaction.date === 'string' ? transaction.date : formatDateForSubmit(transaction.date),
          categoryId: transaction.categoryId,
          spaceId: transaction.spaceId,
          accountId: transaction.accountId,
          type: transaction.type,
          isRecurrent: transaction.isRecurrent || false,
          recurrencePattern: transaction.recurrencePattern || undefined,
        }
      : {
          amount: '',
          description: '',
          date: getCurrentDate(),
          categoryId: '',
          spaceId: activeSpaceId || '',
          accountId: '',
          type: TransactionType.EXPENSE,
          isRecurrent: false,
          recurrencePattern: undefined,
        },
  })

  const selectedType = form.watch('type')

  async function onSubmit(values: CreateTransactionInput | UpdateTransactionInput) {
    setIsSubmitting(true)

    try {
      // Garantir que o spaceId seja sempre o do espaço ativo
      const dataWithActiveSpace = {
        ...values,
        spaceId: activeSpaceId || values.spaceId,
      }

      if (isEditing && transaction) {
        await updateMutation.mutateAsync({
          id: transaction.id,
          data: dataWithActiveSpace as UpdateTransactionInput,
        })
      } else {
        await createMutation.mutateAsync(dataWithActiveSpace as CreateTransactionInput)
      }

      onSuccess?.()
    } catch (error) {
      console.error('Erro ao processar a transação:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção: Informações Básicas */}
        <div className="space-y-6">
          {/* Primeira linha: Tipo e Valor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo da transação */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TransactionType.INCOME}>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Receita
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value={TransactionType.EXPENSE}>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-red-100 text-red-800">
                            Despesa
                          </Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      className={`${
                        selectedType === TransactionType.INCOME
                          ? 'border-green-300 focus:border-green-500'
                          : 'border-red-300 focus:border-red-500'
                      }`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Segunda linha: Descrição (campo completo) */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Descrição da transação" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Terceira linha: Data e Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? parseStringToDate(field.value) : undefined}
                      onSelect={date => {
                        if (date) {
                          field.onChange(formatDateForSubmit(date))
                        }
                      }}
                      placeholder="Selecione a data da transação"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categoria */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <CategorySelect
                      value={field.value}
                      onValueChange={field.onChange}
                      type={selectedType}
                      placeholder="Selecione uma categoria"
                      allowClear
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Quarta linha: Conta (campo completo) */}
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <span>{account.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {account.type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Seção: Configurações Avançadas */}
        <div className="border-t pt-8">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-semibold">Configurações Avançadas</h3>
          </div>
          <RecurrenceConfig control={form.control} setValue={form.setValue} watch={form.watch} />
        </div>

        {/* Botões de ação */}
        <div className="flex gap-4 pt-6 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            className="flex-1">
            {isSubmitting || createMutation.isPending || updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Atualizando...' : 'Criando...'}
              </>
            ) : isEditing ? (
              'Atualizar Transação'
            ) : (
              'Criar Transação'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
