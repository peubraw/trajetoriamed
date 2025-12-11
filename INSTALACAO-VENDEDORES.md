# 🚀 Instalação Rápida - Sistema de Vendedores

## Passo 1: Executar Migração do Banco

### Opção A: Usando o Script Automático (Windows)
```bash
install-vendedores.bat
```

### Opção B: Manual (MySQL)
```bash
# No terminal MySQL ou phpMyAdmin
mysql -u root -p wppbot_saas < database/migrations/add-user-roles.sql
```

## Passo 2: Reiniciar Servidor

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
node server.js
```

## Passo 3: Testar

1. Acesse: `http://localhost:3000`
2. Faça login com sua conta admin
3. Vá para o CRM Kanban
4. Clique em "Gerenciar Vendedores" (botão verde)
5. Crie um vendedor de teste
6. Teste o login com as credenciais do vendedor

## ✅ Verificação

Se tudo estiver correto, você verá:

- ✅ Botão "Gerenciar Vendedores" no CRM (apenas para admins)
- ✅ Página de gestão de vendedores funcionando
- ✅ Vendedores criados com sucesso
- ✅ Vendedores vendo apenas seus leads

## ❌ Problemas Comuns

### Erro: "Column 'role' doesn't exist"
**Solução**: A migração não foi executada. Execute o Passo 1 novamente.

### Erro: "Access denied for user"
**Solução**: Verifique usuário e senha do MySQL no comando.

### Botão "Gerenciar Vendedores" não aparece
**Solução**: Limpe o cache do navegador (Ctrl+Shift+Del) ou use aba anônima.

### Vendedor vê todos os leads
**Solução**: 
1. Verifique se o vendedor está com `role = 'seller'` no banco
2. Verifique se os leads estão atribuídos corretamente

## 📚 Documentação Completa

Veja: `docs/SISTEMA-VENDEDORES.md`

## 🆘 Suporte

Em caso de dúvidas, verifique:
1. Logs do servidor Node.js
2. Console do navegador (F12)
3. Tabela `users` no banco de dados
