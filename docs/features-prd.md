# 📄 **Product Requirements Document (PRD)**

## **Nome do Projeto**: Finanças Pessoais Web

## **Versão**: 1.0

## **Data**: 20/06/2025

## **Autor**: Luan Coêlho

---

## 🎯 **Visão Geral**

Aplicativo web responsivo de controle de finanças pessoais com foco na simplicidade, usabilidade mobile e visualização clara dos gastos e ganhos. O sistema permite que usuários cadastrem transações, agrupem por categorias e espaços, visualizem saldo e relatórios.

---

## 🧑‍💻 **Público-Alvo**

Usuários que desejam controlar suas finanças pessoais de forma prática, com interface intuitiva e acesso seguro em múltiplos dispositivos.

---

## 🧩 **Funcionalidades Essenciais**

### 1. **Cadastro de Transações**

- Tipos: Entrada (receita), Saída (despesa)
- Campos obrigatórios:

  - Valor (decimal)
  - Data (date picker)
  - Descrição (texto curto)
  - Categoria (seleção)
  - Espaço (ex: Casa, Trabalho)
  - Conta (ex: Banco, Carteira)

- Validação: valor > 0, data válida, categoria obrigatória

### 2. **Listagem de Transações**

- Ordenação padrão: cronológica decrescente
- Filtros:

  - Período (mês atual, mês anterior, intervalo personalizado)
  - Categoria
  - Conta
  - Espaço

- Destaques:

  - Total de entradas
  - Total de saídas
  - Saldo do período

### 3. **Agrupamento por Espaços**

- Cadastro e edição de "espaços" (ex: Casa, Loja)
- Cada transação deve pertencer a um espaço
- Filtros e relatórios por espaço

### 4. **Categorias de Transações**

- Categorias pré-definidas (ex: Alimentação, Transporte, Lazer)
- Opção para personalizar (criar, editar, excluir)
  - Categorias personalizadas devem ser vinculadas ao usuário, para que não sejam compartilhadas com outros usuários

### 5. **Saldo Total**

- Cálculo automático e exibido em destaque
- Fórmula: `Entradas - Saídas`
- Pode ser filtrado por conta, espaço, período

### 6. **Filtro por Período**

- Períodos suportados:

  - Mês atual
  - Mês anterior
  - Intervalo personalizado

- Aplicado globalmente (listagens e gráficos)

### 7. **Cadastro de Contas**

- Ex: Carteira, Banco, Cartão de Crédito
- Cada transação é vinculada a uma conta
- Permitir criação/edição/exclusão de contas

### 8. **Gráficos e Relatórios**

- Gráfico de Pizza: proporção de gastos por categoria
- Gráfico de Linha ou Barra: evolução mensal de entradas e saídas
- Responsivos e otimizados para mobile

### 9. **Recorrência de Transações**

- Campos adicionais:

  - Tipo de recorrência: Mensal, Semanal, Anual
  - Duração: número de repetições ou fim fixo

- Geração automática das transações futuras

### 10. **Autenticação e Backup**

- Login via Google (OAuth)

### 11. **Modo Escuro**

- Alternância manual (modo claro/escuro)
- Detecção automática baseada no sistema operacional

---

## 💡 **Funcionalidades Futuras (Versão 2.0)**

1. Importação/Exportação de dados (CSV, Excel)
2. Integrações com APIs bancárias
3. Notificações e alertas (gasto excessivo)
4. Metas financeiras mensais/anuais
5. Compartilhamento de espaço com múltiplos usuários

---

## 🎨 **Design e Usabilidade**

- UI responsiva (preferência para Tailwind CSS, Shadcn, ou similares)
- Interface mobile-first, otimizada para toque
- Layout minimalista com destaque para dados importantes
- Componentes acessíveis e responsivos

---

## ⚙️ **Tecnologias**

- **Node.js:** v20
- **React:** v19
- **Next.js:** v15 (App Router)
- **TypeScript:** v5
- **Tailwind CSS:** v4
- **Shadcn UI:** última versão compatível com Tailwind 4
- **Drizzle ORM:** com PostgreSQL
- **React Query:** para gerenciamento de estado do servidor

---

## ✅ **Critérios de Aceitação**

- O usuário deve ser capaz de:

  - Cadastrar e visualizar transações
  - Alternar entre períodos e contas
  - Visualizar saldo e gráficos
  - Autenticar com conta Google

- A interface deve ser totalmente funcional em mobile
- Saldo e gráficos devem ser atualizados automaticamente

---

## 🧪 **Testes**

- Testes de UI responsiva
- Testes de cálculo (saldo, filtros)
- Testes de autenticação
- Testes de recorrência e agrupamento
- Testes de segurança (acesso restrito por usuário)
