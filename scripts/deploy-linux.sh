#!/bin/bash
# Script de Deploy para Linux/VPS
# Execute: chmod +x deploy-linux.sh && ./deploy-linux.sh

echo "🚀 INICIANDO DEPLOY - WPPBOT TRAJETÓRIA MED"
echo "============================================================"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ Erro: Execute este script no diretório raiz do projeto${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Diretório do projeto localizado${NC}"

# 1. Atualizar sistema
echo -e "\n${YELLOW}📦 Atualizando dependências...${NC}"
npm install

# 2. Verificar .env
echo -e "\n${YELLOW}🔧 Verificando configurações...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Arquivo .env criado. CONFIGURE AS CREDENCIAIS!${NC}"
    else
        echo -e "${RED}❌ Arquivo .env.example não encontrado${NC}"
    fi
fi

# 3. Criar diretório scripts se não existir
mkdir -p scripts
echo -e "${GREEN}✅ Diretório scripts verificado${NC}"

# 4. Atualizar banco de dados
echo -e "\n${YELLOW}💾 Atualizando banco de dados...${NC}"

# Ler credenciais do .env
source .env 2>/dev/null || true

DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-""}
DB_NAME=${DB_NAME:-wppbot_saas}

# Executar script SQL
SQL_SCRIPT="scripts/update-leandro-prompt.sql"
if [ -f "$SQL_SCRIPT" ]; then
    echo "Executando: $SQL_SCRIPT"
    
    if [ -n "$DB_PASSWORD" ]; then
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL_SCRIPT"
    else
        mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < "$SQL_SCRIPT"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Banco de dados atualizado com sucesso!${NC}"
    else
        echo -e "${YELLOW}⚠️  Houve um problema ao atualizar o banco${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Script SQL não encontrado: $SQL_SCRIPT${NC}"
fi

# 5. Copiar prompt MASTER
echo -e "\n${YELLOW}📝 Copiando prompt MASTER...${NC}"
PROMPT_SOURCE="prompt-templates/MASTER-Bot-Trajetoria-Med-UNIFIED.txt"
if [ -f "$PROMPT_SOURCE" ]; then
    # Backup do prompt atual
    if [ -f "prompt-templates/MASTER-Bot-Trajetoria-Med.txt" ]; then
        cp "prompt-templates/MASTER-Bot-Trajetoria-Med.txt" "prompt-templates/MASTER-Bot-Trajetoria-Med.BACKUP.txt"
        echo -e "${GREEN}✅ Backup do prompt anterior criado${NC}"
    fi
    
    # Copiar novo prompt
    cp "$PROMPT_SOURCE" "prompt-templates/MASTER-Bot-Trajetoria-Med.txt"
    echo -e "${GREEN}✅ Prompt MASTER atualizado${NC}"
else
    echo -e "${YELLOW}⚠️  Arquivo de prompt não encontrado: $PROMPT_SOURCE${NC}"
fi

# 6. Verificar PM2 (gerenciador de processos)
echo -e "\n${YELLOW}🔍 Verificando PM2...${NC}"
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✅ PM2 instalado${NC}"
    
    # Verificar se o app está rodando
    if pm2 list | grep -q "wppbot"; then
        echo -e "${YELLOW}Aplicação encontrada no PM2. Reiniciando...${NC}"
        pm2 restart wppbot
        echo -e "${GREEN}✅ Aplicação reiniciada${NC}"
    else
        echo -e "${YELLOW}Aplicação não encontrada no PM2${NC}"
        echo -e "${CYAN}Use: pm2 start server.js --name wppbot${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  PM2 não instalado${NC}"
    echo -e "${CYAN}Instale com: npm install -g pm2${NC}"
fi

# 7. Resumo
echo -e "\n${GREEN}✅ DEPLOY CONCLUÍDO!${NC}"
echo -e "\n${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
echo -e "1. Verificar o arquivo .env e configurar credenciais"
echo -e "2. Iniciar servidor:"
echo -e "   ${CYAN}npm start${NC}                    - Modo normal"
echo -e "   ${CYAN}npm run dev${NC}                  - Modo desenvolvimento"
echo -e "   ${CYAN}pm2 start server.js --name wppbot${NC} - Com PM2"
echo -e "3. Acessar: http://seu-servidor:3000"
echo -e "4. Login: leandro.berti@gmail.com"
echo -e "5. Conectar WhatsApp e testar"

echo -e "\n${CYAN}💡 DICA: Use PM2 para manter o servidor rodando em produção${NC}"
echo ""
