'use client'

import { useActiveSpaceState, useSetActiveSpace, useSpaceLoading } from '@/components/providers/space-provider'
import { useSpaces } from '@/hooks/use-spaces'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Loader2 } from 'lucide-react'

export function SpaceSelector() {
  const { activeSpace } = useActiveSpaceState()
  const setActiveSpace = useSetActiveSpace()
  const spaceContextLoading = useSpaceLoading()
  const { data: spacesData, isLoading: spacesLoading } = useSpaces()

  const isLoading = spaceContextLoading || spacesLoading
  const spaces = spacesData?.spaces || []

  // Se não há espaços ou está carregando, não renderizar
  if (isLoading || spaces.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="text-sm text-muted-foreground">Nenhum espaço</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={activeSpace?.id || ''}
        onValueChange={spaceId => {
          const space = spaces.find(s => s.id === spaceId)
          if (space) {
            setActiveSpace(space)
          }
        }}>
        <SelectTrigger className="w-[180px] h-8 text-sm">
          <SelectValue placeholder="Selecionar espaço" />
        </SelectTrigger>
        <SelectContent>
          {spaces.map(space => (
            <SelectItem key={space.id} value={space.id}>
              {space.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
