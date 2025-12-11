# Sistema de Acesso por Vendedor - CRM TrajetóriaMed

## 📋 Visão Geral

O sistema de acesso por vendedor permite que administradores criem contas para vendedores e controlem quais leads cada vendedor pode visualizar e gerenciar.

## 🎯 Funcionalidades Implementadas

### 1. **Roles de Usuários**
- **Admin**: Acesso total ao CRM, pode ver todos os leads e gerenciar vendedores
- **Vendedor**: Acesso restrito apenas aos leads atribuídos a ele

### 2. **Gestão de Vendedores** (Apenas Admin)
- Criar novos vendedores
- Editar informações dos vendedores
- Ativar/desativar vendedores
- Excluir vendedores
- Visualizar lista completa da equipe

### 3. **Controle de Acesso aos Leads**
- Admins veem todos os leads da conta
- Vendedores veem apenas leads atribuídos a eles
- Apenas admins podem atribuir leads aos vendedores
- Sistema de permissões protege todas as rotas da API

## 🚀 Como Usar

### Para Administradores

#### 1. Acessar Gestão de Vendedores
1. Faça login no sistema como administrador
2. Acesse o CRM Kanban
3. Clique no botão **"Gerenciar Vendedores"** (verde)
4. Você será direcionado para a página de gestão de vendedores

#### 2. Criar Novo Vendedor
1. Na tela de gestão, clique em **"Novo Vendedor"**
2. Preencha os dados:
   - Nome completo
   - Email (será usado para login)
   - Senha (mínimo 6 caracteres)
   - Telefone (opcional)
3. Clique em **"Criar Vendedor"**
4. O vendedor já poderá fazer login com o email e senha cadastrados

#### 3. Atribuir Leads aos Vendedores
1. No CRM Kanban, clique em um lead
2. Selecione o vendedor no campo **"Atribuir a Vendedor"**
3. O lead ficará visível apenas para o vendedor selecionado (e para admins)

#### 4. Editar Vendedor
1. Na tela de gestão de vendedores
2. Clique no ícone de **lápis** (editar)
3. Altere as informações necessárias
4. Clique em **"Salvar Alterações"**

#### 5. Desativar Vendedor
1. Edite o vendedor
2. Altere o status para **"Inativo"**
3. O vendedor não poderá mais fazer login

#### 6. Excluir Vendedor
1. Na tela de gestão de vendedores
2. Clique no ícone de **lixeira** (deletar)
3. Confirme a exclusão
4. Os leads do vendedor serão desvinculados automaticamente

### Para Vendedores

#### 1. Login
1. Acesse a página de login
2. Use o email e senha fornecidos pelo administrador
3. Você será direcionado ao CRM

#### 2. Visualizar Leads
1. Acesse o CRM Kanban
2. Você verá apenas os leads atribuídos a você
3. Não é possível ver leads de outros vendedores

#### 3. Gerenciar Leads
- Mover leads entre estágios (drag & drop)
- Adicionar notas e atividades
- Enviar mensagens (pausa o bot automaticamente)
- Pausar/reativar bot
- **NÃO** pode atribuir leads a outros vendedores (apenas admin)

## 🗄️ Migração do Banco de Dados

### Executar a Migração

```sql
-- Execute o arquivo de migração
source database/migrations/add-user-roles.sql;
```

### O que a migração faz:

1. **Adiciona campo `role`** na tabela `users`
   - Valores: `admin` ou `seller`
   - Padrão: `admin`

2. **Adiciona campo `parent_user_id`** na tabela `users`
   - Identifica qual admin criou o vendedor
   - NULL para admins principais

3. **Cria tabela `user_permissions`**
   - Para futuras expansões de permissões granulares

4. **Cria views**
   - `v_users_hierarchy`: Hierarquia de usuários
   - `v_leads_with_sellers`: Leads com informações de vendedor

5. **Adiciona índices**
   - Otimiza queries de permissão
   - Melhora performance de filtros

### Usuários Existentes

- Todos os usuários existentes serão automaticamente definidos como **admin**
- Nenhuma funcionalidade será quebrada

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

1. **database/migrations/add-user-roles.sql**
   - Migração do banco de dados

2. **services/auth.service.js**
   - Lógica de autenticação e autorização
   - Verificação de roles
   - CRUD de vendedores

3. **middleware/auth.middleware.js**
   - Middlewares de autenticação
   - `requireAuth`: Usuário logado
   - `requireAdmin`: Apenas admin
   - `canAccessLead`: Verifica acesso ao lead
   - `attachUserInfo`: Anexa dados do usuário

4. **routes/sellers.routes.js**
   - Rotas de gestão de vendedores
   - GET, POST, PUT, DELETE vendedores

5. **public/sellers.html**
   - Interface de gestão de vendedores

### Arquivos Modificados

1. **server.js**
   - Adicionada rota `/api/sellers`

2. **routes/crm.routes.js**
   - Adicionados middlewares de permissão
   - Proteção de rotas sensíveis

3. **services/crm.service.js**
   - Filtro de leads baseado em role
   - Integração com authService

4. **public/crm-kanban.html**
   - Botão "Gerenciar Vendedores" (apenas admin)
   - Verificação de role do usuário

## 🔒 Segurança

### Proteções Implementadas

1. **Filtros SQL automáticos**
   - Vendedores só recebem leads atribuídos a eles
   - Admins recebem todos os leads da conta

2. **Middlewares de proteção**
   - Todas as rotas sensíveis são protegidas
   - Verificação de permissão antes de cada ação

3. **Validações no backend**
   - Frontend pode ser burlado, mas backend sempre valida
   - Nenhuma operação bypassa as permissões

4. **Hierarquia de usuários**
   - Vendedores pertencem a um admin específico
   - Admin só gerencia seus próprios vendedores

## 🧪 Testando o Sistema

### Teste 1: Criar Vendedor
1. Login como admin
2. Acesse "Gerenciar Vendedores"
3. Crie um vendedor de teste
4. Logout
5. Login com as credenciais do vendedor
6. Verifique que não há leads visíveis

### Teste 2: Atribuir Lead
1. Login como admin
2. Crie ou selecione um lead
3. Atribua ao vendedor criado
4. Logout
5. Login como vendedor
6. Verifique que o lead está visível

### Teste 3: Segurança
1. Login como vendedor
2. Tente acessar `/sellers.html`
3. Deve receber erro 403 (Acesso Negado)
4. Tente acessar um lead não atribuído a você
5. Deve receber erro 403

### Teste 4: Exclusão de Vendedor
1. Login como admin
2. Atribua leads a um vendedor
3. Exclua o vendedor
4. Verifique que os leads foram desvinculados
5. Vendedor não consegue mais fazer login

## 🔄 Próximos Passos (Opcional)

### Melhorias Futuras

1. **Dashboard por vendedor**
   - Estatísticas individuais
   - Metas e comissões
   - Ranking de vendedores

2. **Notificações**
   - Notificar vendedor quando lead é atribuído
   - Alertas de leads quentes

3. **Permissões granulares**
   - Usar tabela `user_permissions`
   - Controlar ações específicas

4. **Histórico de atribuições**
   - Log de quando lead foi atribuído
   - Rastreamento de transferências

5. **Auto-atribuição**
   - Vendedores podem "pegar" leads disponíveis
   - Sistema de fila de leads

## 📞 Suporte

Se encontrar algum problema:

1. Verifique se a migração foi executada
2. Verifique os logs do servidor
3. Verifique o console do navegador
4. Confirme que o usuário tem o role correto no banco

## ✅ Checklist de Implementação

- [x] Migração do banco de dados
- [x] Serviço de autenticação e autorização
- [x] Middlewares de permissão
- [x] Rotas de vendedores
- [x] Interface de gestão de vendedores
- [x] Filtros no CRM por role
- [x] Proteção de rotas sensíveis
- [x] Botão de gerenciar vendedores (apenas admin)
- [x] Documentação completa
