'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import { 
  createTransactionSchema, 
  updateTransactionSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type TransactionWithRelations,
  TransactionType
} from '@/types/transaction'
import { 
  useCreateTransaction, 
  useUpdateTransaction 
} from '@/hooks/use-transactions'
import { CategorySelect } from '@/components/categories'
import { RecurrenceConfig } from './recurrence-config'

interface TransactionFormProps {
  transaction?: TransactionWithRelations
  onSuccess?: () => void
  onCancel?: () => void
  spaces?: Array<{ id: string; name: string }>
  accounts?: Array<{ id: string; name: string; type: string }>
}

export function TransactionForm({
  transaction,
  onSuccess,
  onCancel,
  spaces = [],
  accounts = [],
}: TransactionFormProps) {
  const isEditing = !!transaction
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()

  // Função para formatar data para input date
  const formatDateForInput = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toISOString().split('T')[0]
  }

  // Obter data atual formatada
  const getCurrentDate = (): string => {
    return formatDateForInput(new Date())
  }

  const form = useForm<CreateTransactionInput | UpdateTransactionInput>({
    resolver: zodResolver(isEditing ? updateTransactionSchema : createTransactionSchema),
    defaultValues: isEditing
      ? {
          amount: transaction.amount.toString(),
          description: transaction.description,
          date: formatDateForInput(transaction.date),
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
          spaceId: '',
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
      if (isEditing && transaction) {
        await updateMutation.mutateAsync({
          id: transaction.id,
          data: values as UpdateTransactionInput,
        })
      } else {
        await createMutation.mutateAsync(values as CreateTransactionInput)
      }
      
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao processar a transação:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Editar Transação' : 'Nova Transação'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Descrição da transação"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categoria - Usando CategorySelect integrado */}
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

            {/* Espaço */}
            <FormField
              control={form.control}
              name="spaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Espaço</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um espaço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {spaces.map((space) => (
                        <SelectItem key={space.id} value={space.id}>
                          {space.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conta */}
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
                      {accounts.map((account) => (
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

            {/* Configuração de recorrência */}
            <RecurrenceConfig
              control={form.control}
              setValue={form.setValue}
              watch={form.watch}
            />

            {/* Botões de ação */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                {isSubmitting || createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Atualizando...' : 'Criando...'}
                  </>
                ) : (
                  isEditing ? 'Atualizar Transação' : 'Criar Transação'
                )}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 