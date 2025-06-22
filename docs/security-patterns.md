# Padrões de Segurança - Ownership Enforcement

Este documento descreve os padrões de segurança implementados no sistema para garantir que usuários só possam acessar e modificar seus próprios dados.

## Visão Geral

O sistema implementa uma arquitetura de segurança em camadas que garante:

- **Autenticação obrigatória** em todas as rotas de API
- **Isolamento total** entre dados de diferentes usuários
- **Controle de acesso** granular para modificações
- **Integridade referencial** para evitar corrupção de dados
- **Privacidade** sem revelação de existência de recursos de outros usuários

## Padrões Implementados

### 1. Autenticação Obrigatória

Todas as rotas de API implementam verificação de autenticação:

```typescript
const session = await auth()
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
}
```

**Rotas protegidas:**

- `/api/spaces` (GET, POST)
- `/api/spaces/[id]` (GET, PUT, DELETE)
- `/api/accounts` (GET, POST)
- `/api/accounts/[id]` (GET, PUT, DELETE)
- `/api/transactions` (GET, POST)
- `/api/transactions/[id]` (GET, PUT, DELETE)
- `/api/categories` (GET, POST)
- `/api/categories/[id]` (GET, PUT, DELETE)

### 2. Isolamento por Usuário nas Consultas

Todas as queries de listagem filtram automaticamente por `userId`:

```typescript
// Spaces
.where(eq(spacesTable.userId, session.user.id))

// Accounts
.where(eq(accountsTable.userId, session.user.id))

// Transactions
.where(eq(transactionsTable.userId, session.user.id))

// Categories (inclui categorias padrão + do usuário)
.where(
  or(
    isNull(categoriesTable.userId), // Categorias padrão
    eq(categoriesTable.userId, session.user.id) // Categorias do usuário
  )
)
```

### 3. Controle de Acesso Individual

Para recursos específicos, o sistema verifica ownership:

```typescript
// Padrão para GET individual
const resource = await db
  .select()
  .from(resourceTable)
  .where(and(eq(resourceTable.id, resourceId), eq(resourceTable.userId, session.user.id)))
  .limit(1)

if (resource.length === 0) {
  return NextResponse.json({ error: 'Recurso não encontrado' }, { status: 404 })
}
```

**Benefício de Segurança:** Este padrão retorna 404 tanto para recursos inexistentes quanto para recursos que não pertencem ao usuário, não revelando informações sobre a existência de dados de outros usuários.

### 4. Verificação de Ownership para Modificações

Antes de PUT/DELETE, o sistema verifica explicitamente a propriedade:

```typescript
// Verificar se o recurso existe e pertence ao usuário
const existingResource = await db
  .select({ id: resourceTable.id, userId: resourceTable.userId })
  .from(resourceTable)
  .where(eq(resourceTable.id, resourceId))
  .limit(1)

if (existingResource.length === 0) {
  return NextResponse.json({ error: 'Recurso não encontrado' }, { status: 404 })
}

if (existingResource[0].userId !== session.user.id) {
  return NextResponse.json(
    {
      error: 'Você não tem permissão para modificar este recurso',
    },
    { status: 403 },
  )
}
```

**Códigos de Status:**

- **404:** Recurso não existe
- **403:** Recurso existe mas não pertence ao usuário

### 5. Proteções de Integridade Referencial

O sistema impede exclusão de recursos que estão sendo utilizados:

```typescript
// Verificar transações vinculadas antes de excluir spaces/accounts
const [{ transactionCount }] = await db
  .select({ transactionCount: count() })
  .from(transactionsTable)
  .where(eq(transactionsTable.spaceId, spaceId)) // ou accountId

if (transactionCount > 0) {
  return NextResponse.json(
    {
      error: 'Não é possível excluir este recurso pois existem transações vinculadas',
    },
    { status: 400 },
  )
}
```

### 6. Prevenção de Duplicatas

Duplicatas são verificadas apenas no escopo do usuário:

```typescript
const existingResource = await db
  .select({ id: resourceTable.id })
  .from(resourceTable)
  .where(and(eq(resourceTable.name, validatedData.name), eq(resourceTable.userId, session.user.id)))
  .limit(1)

if (existingResource.length > 0) {
  return NextResponse.json(
    {
      error: 'Já existe um recurso com este nome',
    },
    { status: 400 },
  )
}
```

**Isolamento:** Usuários diferentes podem ter recursos com nomes iguais.

## Status de Implementação

| Recurso      | Autenticação | Ownership | Integridade | Status   |
| ------------ | ------------ | --------- | ----------- | -------- |
| Spaces       | ✅           | ✅        | ✅          | Completo |
| Accounts     | ✅           | ✅        | ✅          | Completo |
| Transactions | ✅           | ✅        | ✅          | Completo |
| Categories   | ✅           | ✅        | N/A         | Completo |

## Validação

Os padrões de segurança são validados através de:

1. **Testes de documentação** (`src/tests/ownership-enforcement.test.ts`)
2. **Revisão de código** das rotas de API
3. **Análise estática** dos padrões implementados

## Considerações Adicionais

### Categorias Padrão

As categorias têm uma lógica especial onde:

- Categorias com `userId = null` são visíveis para todos (categorias padrão)
- Categorias com `userId` específico são visíveis apenas para o proprietário
- Usuários podem criar suas próprias categorias personalizadas

### Middleware de Autenticação

O sistema utiliza NextAuth.js com:

- Estratégia JWT para sessões
- Verificação de usuário ativo no banco
- Integração com Google OAuth

### Performance

Os filtros de `userId` são aplicados diretamente nas queries SQL, garantindo:

- Eficiência nas consultas
- Uso adequado de índices do banco
- Segurança no nível de dados
