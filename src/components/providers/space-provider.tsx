'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'
import { useSpaces } from '@/hooks/use-spaces'
import type { Space } from '@/db/schema/space-schema'

// Dividir o contexto em duas partes para otimizar re-renderizações
interface SpaceStateContextType {
  activeSpace: Space | null
  isLoading: boolean
}

interface SpaceActionsContextType {
  setActiveSpace: (space: Space) => void
}

const SpaceStateContext = createContext<SpaceStateContextType | undefined>(undefined)
const SpaceActionsContext = createContext<SpaceActionsContextType | undefined>(undefined)

interface SpaceProviderProps {
  children: ReactNode
}

export function SpaceProvider({ children }: SpaceProviderProps) {
  const { data: spacesData, isLoading: spacesLoading } = useSpaces()
  const [activeSpace, setActiveSpaceState] = useState<Space | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Função memoizada para definir o espaço ativo e persistir no localStorage
  const setActiveSpace = useCallback((space: Space) => {
    setActiveSpaceState(space)
    localStorage.setItem('activeSpaceId', space.id)
  }, [])

  // Inicializar o espaço ativo
  useEffect(() => {
    if (!spacesData?.spaces || spacesLoading || isInitialized) return

    const spaces = spacesData.spaces
    if (spaces.length === 0) {
      setIsInitialized(true)
      return
    }

    // Tentar recuperar o espaço salvo no localStorage
    const savedSpaceId = localStorage.getItem('activeSpaceId')
    let spaceToSet: Space | null = null

    if (savedSpaceId) {
      // Procurar o espaço salvo
      spaceToSet = spaces.find(space => space.id === savedSpaceId) || null
    }

    // Se não encontrou o espaço salvo ou não há espaço salvo, usar o primeiro espaço
    if (!spaceToSet) {
      spaceToSet = spaces[0]
    }

    if (spaceToSet) {
      setActiveSpaceState(spaceToSet)
      localStorage.setItem('activeSpaceId', spaceToSet.id)
    }

    setIsInitialized(true)
  }, [spacesData, spacesLoading, isInitialized])

  // Memoizar valores do contexto separadamente para otimizar re-renderizações
  const stateValue = useMemo<SpaceStateContextType>(
    () => ({
      activeSpace,
      isLoading: spacesLoading || !isInitialized,
    }),
    [activeSpace, spacesLoading, isInitialized],
  )

  const actionsValue = useMemo<SpaceActionsContextType>(
    () => ({
      setActiveSpace,
    }),
    [setActiveSpace],
  )

  return (
    <SpaceStateContext.Provider value={stateValue}>
      <SpaceActionsContext.Provider value={actionsValue}>{children}</SpaceActionsContext.Provider>
    </SpaceStateContext.Provider>
  )
}

// Hook principal que retorna todo o contexto (compatibilidade com código existente)
export function useActiveSpace() {
  const state = useContext(SpaceStateContext)
  const actions = useContext(SpaceActionsContext)

  if (state === undefined || actions === undefined) {
    throw new Error('useActiveSpace deve ser usado dentro de um SpaceProvider')
  }

  return useMemo(
    () => ({
      ...state,
      ...actions,
    }),
    [state, actions],
  )
}

// Hooks seletivos otimizados que consomem apenas o que precisam

/**
 * Hook otimizado que retorna apenas o estado do espaço ativo
 * Use este hook quando você só precisa ler o espaço ativo (não modificar)
 */
export function useActiveSpaceState(): SpaceStateContextType {
  const context = useContext(SpaceStateContext)
  if (context === undefined) {
    throw new Error('useActiveSpaceState deve ser usado dentro de um SpaceProvider')
  }
  return context
}

/**
 * Hook otimizado que retorna apenas as ações do espaço
 * Use este hook quando você só precisa modificar o espaço ativo
 */
export function useActiveSpaceActions(): SpaceActionsContextType {
  const context = useContext(SpaceActionsContext)
  if (context === undefined) {
    throw new Error('useActiveSpaceActions deve ser usado dentro de um SpaceProvider')
  }
  return context
}

/**
 * Hook ultra-otimizado que retorna apenas o ID do espaço ativo
 * Use para componentes que só precisam do ID (ex: filtros, query keys)
 */
export function useActiveSpaceId(): string | undefined {
  const { activeSpace } = useActiveSpaceState()
  return useMemo(() => activeSpace?.id, [activeSpace?.id])
}

/**
 * Hook ultra-otimizado que retorna apenas o nome do espaço ativo
 * Use para exibições de UI que só mostram o nome
 */
export function useActiveSpaceName(): string | undefined {
  const { activeSpace } = useActiveSpaceState()
  return useMemo(() => activeSpace?.name, [activeSpace?.name])
}

/**
 * Hook ultra-otimizado que retorna apenas se há um espaço ativo
 * Use para renderização condicional baseada na existência de espaço
 */
export function useHasActiveSpace(): boolean {
  const { activeSpace } = useActiveSpaceState()
  return useMemo(() => !!activeSpace, [activeSpace])
}

/**
 * Hook ultra-otimizado que retorna apenas o status de loading
 * Use para mostrar indicadores de carregamento
 */
export function useSpaceLoading(): boolean {
  const { isLoading } = useActiveSpaceState()
  return isLoading
}

/**
 * Hook ultra-otimizado que retorna apenas a função de definir espaço ativo
 * Use para componentes que só precisam alterar o espaço (ex: seletores)
 */
export function useSetActiveSpace() {
  const { setActiveSpace } = useActiveSpaceActions()
  return setActiveSpace
}
