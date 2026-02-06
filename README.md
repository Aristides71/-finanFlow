# Finance Manager

Um sistema completo de gestão financeira pessoal com suporte a múltiplas contas bancárias, categorização de transações, relatórios e dashboards.

## Funcionalidades

- **Dashboard:** Visão geral de receitas, despesas e saldo.
- **Transações:** Cadastro de receitas e despesas com categorização.
- **Contas Bancárias:** Gerenciamento de múltiplas contas (Corrente, Poupança, etc.).
- **Relatórios:** Exportação de relatórios em PDF.
- **Autenticação:** Sistema de login e cadastro seguro.
- **Trial:** Período de testes de 3 dias para novos usuários.

## Tecnologias

- **Frontend:** React, Vite, TailwindCSS.
- **Backend:** Node.js, Express, Prisma ORM.
- **Banco de Dados:** PostgreSQL (Produção) / SQLite (Desenvolvimento).

## Como Rodar Localmente

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
3. Configure o arquivo `.env` no server.
4. Inicie o servidor:
   ```bash
   cd server && npm run dev
   ```
5. Inicie o cliente:
   ```bash
   cd client && npm run dev
   ```
