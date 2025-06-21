# Sistema de Contexto Global de Espaço

Este documento descreve o sistema de contexto global de espaço implementado na aplicação de controle de despesas, que permite ao usuário alternar entre diferentes espaços (casa, trabalho, etc.) de forma centralizada.

## Visão Geral

O sistema de contexto global de espaço elimina a necessidade de seleção individual de espaço em formulários e componentes, centralizando essa escolha em um contexto React que é consumido por toda a aplicação.

## Arquitetura

### Componentes Principais

1. **SpaceProvider** (`src/components/providers/space-provider.tsx`)
   - Contexto React que gerencia o estado global do espaço ativo
   - Implementa persistência automática no localStorage
   - Fornece hook `useActiveSpace` para consumo

2. **SpaceSelector** (`src/components/layout/space-selector.tsx`)
   - Componente de seleção de espaço no header
   - Permite alternância instantânea entre espaços
   - Integrado ao contexto global

3. **Hook useActiveSpace**
   - Hook personalizado para consumir o contexto
   - Retorna espaço ativo, função de alteração e estado de loading

## Implementação

### 1. Configuração do Provider

O `SpaceProvider` deve ser adicionado ao layout raiz da aplicação:

```tsx
// src/app/layout.tsx
import { SpaceProvider } from '@/components/providers/space-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeProvider>
          <QueryProvider>
            <SessionProvider>
              <SpaceProvider>
                {children}
              </SpaceProvider>
            </SessionProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 2. Uso em Componentes

Para consumir o espaço ativo em qualquer componente:

```tsx
import { useActiveSpace } from '@/components/providers/space-provider'

export function MeuComponente() {
  const { activeSpace, setActiveSpace, isLoading } = useActiveSpace()

  if (isLoading) {
    return <div>Carregando...</div>
  }

  if (!activeSpace) {
    return <div>Nenhum espaço disponível</div>
  }

  return (
    <div>
      <h2>Espaço Ativo: {activeSpace.name}</h2>
      {/* Usar activeSpace.id em operações */}
    </div>
  )
}
```

### 3. Formulários de Transação

Os formulários não precisam mais de campos de seleção de espaço:

```tsx
export function TransactionForm() {
  const { activeSpace } = useActiveSpace()

  const onSubmit = (values: FormValues) => {
    const transactionData = {
      ...values,
      spaceId: activeSpace?.id, // Usar sempre o espaço ativo
    }
    
    // Enviar dados...
  }

  // Formulário sem campo de espaço
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Campos do formulário, SEM seleção de espaço */}
    </form>
  )
}
```

### 4. Filtros e Consultas

Componentes que filtram dados por espaço:

```tsx
export function TransactionList() {
  const { activeSpace } = useActiveSpace()

  const { data } = useTransactions({
    filters: {
      spaceId: activeSpace?.id,
    }
  })

  // Renderizar lista filtrada pelo espaço ativo
}
```

## Funcionalidades

### Persistência Automática

- O espaço selecionado é salvo automaticamente no `localStorage`
- Chave utilizada: `'activeSpaceId'`
- Restauração automática ao recarregar a página
- Fallback para o primeiro espaço disponível se o salvo não existir

### Estados de Loading

- O contexto expõe um estado `isLoading` durante inicialização
- Evita renderizações prematuras antes dos espaços serem carregados
- Componentes podem mostrar skeletons ou placeholders

### Tratamento de Erros

- Contexto inicializa corretamente mesmo sem espaços disponíveis
- Fallback automático se espaço salvo não existir mais
- Validação de existência do contexto via hook

## Componentes Refatorados

### Antes (com seleção individual)

```tsx
// ❌ Padrão antigo - seleção individual
interface TransactionFormProps {
  spaces: Space[]
}

export function TransactionForm({ spaces }: TransactionFormProps) {
  return (
    <form>
      <Select name="spaceId">
        {spaces.map(space => (
          <option key={space.id} value={space.id}>
            {space.name}
          </option>
        ))}
      </Select>
      {/* Outros campos */}
    </form>
  )
}
```

### Depois (com contexto global)

```tsx
// ✅ Padrão novo - contexto global
export function TransactionForm() {
  const { activeSpace } = useActiveSpace()

  return (
    <form>
      {/* Campo de espaço removido - usa contexto automaticamente */}
      {/* Outros campos */}
    </form>
  )
}
```

## Benefícios

1. **Consistência**: Todos os componentes usam o mesmo espaço ativo
2. **Simplicidade**: Eliminação de props redundantes
3. **Persistência**: Mantém seleção entre sessões
4. **Performance**: Menos re-renderizações desnecessárias
5. **Manutenibilidade**: Centralização da lógica de espaço

## Casos de Uso Especiais

### Relatórios Multi-Espaço

Para componentes que precisam visualizar dados de múltiplos espaços (como relatórios), o filtro por espaço é mantido:

```tsx
export function ReportsPage() {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('all')

  // Relatórios podem filtrar por espaço específico ou 'todos'
  return (
    <div>
      <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
        <option value="all">Todos os espaços</option>
        {/* Opções de espaços */}
      </Select>
      {/* Gráficos e tabelas */}
    </div>
  )
}
```

## Migração

### Checklist de Migração

Para migrar componentes existentes:

1. ✅ Remover props `spaces` ou `spaceId`
2. ✅ Adicionar hook `useActiveSpace`
3. ✅ Remover campos de seleção de espaço em formulários
4. ✅ Usar `activeSpace.id` em operações
5. ✅ Atualizar interfaces TypeScript
6. ✅ Testar persistência e alternância

### Componentes Migrados

- ✅ TransactionForm
- ✅ TransactionModal  
- ✅ TransactionManager
- ✅ UpcomingTransactions
- ✅ RecurringCalendar
- ✅ Página de Transações

## API do Contexto

### SpaceContextType

```typescript
interface SpaceContextType {
  activeSpace: Space | null        // Espaço atualmente ativo
  setActiveSpace: (space: Space) => void  // Função para alterar espaço
  isLoading: boolean              // Estado de carregamento/inicialização
}
```

### useActiveSpace Hook

```typescript
function useActiveSpace(): SpaceContextType
```

**Retorna:**
- `activeSpace`: Espaço ativo atual ou `null`
- `setActiveSpace`: Função para definir novo espaço ativo
- `isLoading`: `true` durante carregamento inicial

**Throws:**
- Erro se usado fora do `SpaceProvider`

## Testes

### Cenários de Teste

1. **Alternância de espaços**: Verificar se mudança reflete em todos os componentes
2. **Persistência**: Recarregar página e verificar espaço mantido
3. **Fallback**: Remover espaço salvo e verificar seleção do primeiro
4. **Estados vazios**: Testar comportamento sem espaços disponíveis
5. **Loading**: Verificar estados de carregamento

### Exemplo de Teste

```typescript
describe('SpaceProvider', () => {
  it('should persist selected space', () => {
    // Renderizar com espaços mockados
    // Selecionar espaço
    // Verificar localStorage
    // Recarregar componente
    // Verificar espaço restaurado
  })
})
```

## Troubleshooting

### Problemas Comuns

1. **Hook usado fora do Provider**
   - Erro: "useActiveSpace deve ser usado dentro de um SpaceProvider"
   - Solução: Verificar se componente está dentro do SpaceProvider

2. **Espaço não persiste**
   - Verificar se localStorage está habilitado
   - Verificar se não há conflitos de chaves

3. **Loading infinito**
   - Verificar se hook useSpaces está retornando dados
   - Verificar dependências do useEffect

## Roadmap

### Melhorias Futuras

- [ ] Suporte a múltiplos espaços ativos (para comparações)
- [ ] Sincronização entre abas do navegador
- [ ] Cache otimizado por espaço
- [ ] Histórico de espaços recentes
- [ ] Configurações personalizadas por espaço 