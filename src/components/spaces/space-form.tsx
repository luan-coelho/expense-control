'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { useCreateSpace, useUpdateSpace } from '@/hooks'
import {
  createSpaceSchema,
  sanitizeSpaceName,
  SPACE_VALIDATION_RULES,
  type CreateSpaceInput,
  type SpaceWithRelations,
} from '@/types/space'

interface SpaceFormProps {
  space?: SpaceWithRelations
  onSuccess?: () => void
  onCancel?: () => void
}

export function SpaceForm({ space, onSuccess, onCancel }: SpaceFormProps) {
  const isEditing = !!space
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const form = useForm<CreateSpaceInput>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: {
      name: space?.name || '',
    },
    mode: 'onChange', // Validação em tempo real
  })

  const createMutation = useCreateSpace()
  const updateMutation = useUpdateSpace()

  const isLoading = createMutation.isPending || updateMutation.isPending
  const watchedName = form.watch('name')
  const sanitizedName = watchedName ? sanitizeSpaceName(watchedName) : ''

  function handleSubmit(values: CreateSpaceInput) {
    // Sanitizar dados antes de enviar
    const sanitizedValues = {
      ...values,
      name: sanitizeSpaceName(values.name),
    }

    if (isEditing) {
      updateMutation.mutate(
        { id: space.id, data: sanitizedValues },
        {
          onSuccess: () => {
            onSuccess?.()
          },
          onError: (error: any) => {
            // Tratar erros específicos de validação do backend
            if (error?.response?.data?.field) {
              form.setError(error.response.data.field as keyof CreateSpaceInput, {
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
            form.setError(error.response.data.field as keyof CreateSpaceInput, {
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
  const remainingChars = SPACE_VALIDATION_RULES.NAME_MAX_LENGTH - nameLength
  const isNameValid =
    nameLength >= SPACE_VALIDATION_RULES.NAME_MIN_LENGTH && nameLength <= SPACE_VALIDATION_RULES.NAME_MAX_LENGTH

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center justify-between">
                Nome do Espaço
                <span className={`text-xs ${isNameValid ? 'text-muted-foreground' : 'text-destructive'}`}>
                  {nameLength}/{SPACE_VALIDATION_RULES.NAME_MAX_LENGTH}
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Casa, Trabalho, Pessoal..."
                  {...field}
                  className={`${!isNameValid && nameLength > 0 ? 'border-destructive' : ''}`}
                  maxLength={SPACE_VALIDATION_RULES.NAME_MAX_LENGTH}
                />
              </FormControl>
              <FormDescription className="text-xs space-y-1">
                <div>Use um nome descritivo para organizar suas transações</div>
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

        {/* Informações de validação */}
        {nameLength > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <h4 className="text-sm font-medium">Validação do Nome</h4>
            <div className="space-y-1 text-xs">
              <div
                className={`flex items-center gap-2 ${
                  nameLength >= SPACE_VALIDATION_RULES.NAME_MIN_LENGTH ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                <span>{nameLength >= SPACE_VALIDATION_RULES.NAME_MIN_LENGTH ? '✓' : '○'}</span>
                Mínimo {SPACE_VALIDATION_RULES.NAME_MIN_LENGTH} caracteres
              </div>
              <div
                className={`flex items-center gap-2 ${
                  nameLength <= SPACE_VALIDATION_RULES.NAME_MAX_LENGTH ? 'text-green-600' : 'text-destructive'
                }`}>
                <span>{nameLength <= SPACE_VALIDATION_RULES.NAME_MAX_LENGTH ? '✓' : '✗'}</span>
                Máximo {SPACE_VALIDATION_RULES.NAME_MAX_LENGTH} caracteres
              </div>
              <div
                className={`flex items-center gap-2 ${
                  SPACE_VALIDATION_RULES.ALLOWED_NAME_PATTERN.test(watchedName || '')
                    ? 'text-green-600'
                    : 'text-muted-foreground'
                }`}>
                <span>{SPACE_VALIDATION_RULES.ALLOWED_NAME_PATTERN.test(watchedName || '') ? '✓' : '○'}</span>
                Apenas letras, números e símbolos permitidos
              </div>
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
            {isLoading ? (isEditing ? 'Atualizando...' : 'Criando...') : isEditing ? 'Atualizar' : 'Criar Espaço'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
