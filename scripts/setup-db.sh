#!/bin/bash

echo "🚀 Configurando banco de dados do Expense Control..."

# Verifica se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Inicia o PostgreSQL
echo "📦 Iniciando PostgreSQL com Docker..."
npm run db:up

# Aguarda o banco estar pronto
echo "⏳ Aguardando PostgreSQL inicializar..."
sleep 10

# Aplica as migrações
echo "🔄 Aplicando migrações do banco..."
npm run db:push

# Cria usuário admin
echo "👤 Criando usuário administrador..."
npm run db:seed:create-admin-user

echo "✅ Configuração concluída!"
echo ""
echo "🎯 Próximos passos:"
echo "   1. Execute 'npm run dev' para iniciar o servidor"
echo "   2. Acesse http://localhost:3000"
echo "   3. Faça login com admin@example.com / admin123"
echo ""
echo "💡 Comandos úteis:"
echo "   - npm run db:studio    # Abre o Drizzle Studio"
echo "   - npm run db:down      # Para o banco de dados"
echo "   - npm run db:up        # Inicia o banco de dados" 