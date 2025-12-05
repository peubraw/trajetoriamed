#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script para atualizar o prompt MASTER no banco de dados do VPS"""

import mysql.connector
import sys

# Configurações do banco
DB_CONFIG = {
    'host': 'localhost',
    'user': 'wppbot',
    'password': 'wppbot@2025',
    'database': 'wppbot_saas',
    'charset': 'utf8mb4'
}

# Email do usuário
USER_EMAIL = 'leandro.berti@gmail.com'

# Arquivo do prompt
PROMPT_FILE = '/var/www/wppbot/prompt-templates/MASTER-Bot-Trajetoria-Med-UNIFIED.txt'

def update_prompt():
    try:
        # Ler o arquivo do prompt
        print(f"[1/4] Lendo arquivo: {PROMPT_FILE}")
        with open(PROMPT_FILE, 'r', encoding='utf-8') as f:
            prompt_content = f.read()
        
        print(f"[OK] Arquivo lido: {len(prompt_content)} caracteres")
        
        # Conectar ao banco
        print("[2/4] Conectando ao banco de dados...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("[OK] Conectado")
        
        # Buscar ID do usuário
        print(f"[3/4] Buscando usuário: {USER_EMAIL}")
        cursor.execute("SELECT id FROM users WHERE email = %s", (USER_EMAIL,))
        result = cursor.fetchone()
        
        if not result:
            print(f"[ERRO] Usuário não encontrado: {USER_EMAIL}")
            return False
        
        user_id = result[0]
        print(f"[OK] Usuário encontrado: ID {user_id}")
        
        # Atualizar prompt
        print("[4/4] Atualizando prompt...")
        cursor.execute("""
            UPDATE bot_configs 
            SET system_prompt = %s, 
                updated_at = NOW() 
            WHERE user_id = %s
        """, (prompt_content, user_id))
        
        conn.commit()
        
        # Verificar atualização
        cursor.execute("""
            SELECT bot_name, LENGTH(system_prompt) as prompt_size, updated_at 
            FROM bot_configs 
            WHERE user_id = %s
        """, (user_id,))
        
        result = cursor.fetchone()
        if result:
            bot_name, prompt_size, updated_at = result
            print("\n" + "="*50)
            print("✅ PROMPT ATUALIZADO COM SUCESSO!")
            print("="*50)
            print(f"Bot: {bot_name}")
            print(f"Tamanho do prompt: {prompt_size} caracteres")
            print(f"Atualizado em: {updated_at}")
            print("="*50)
        
        cursor.close()
        conn.close()
        return True
        
    except FileNotFoundError:
        print(f"[ERRO] Arquivo não encontrado: {PROMPT_FILE}")
        return False
    except mysql.connector.Error as e:
        print(f"[ERRO] Erro no banco de dados: {e}")
        return False
    except Exception as e:
        print(f"[ERRO] Erro inesperado: {e}")
        return False

if __name__ == '__main__':
    success = update_prompt()
    sys.exit(0 if success else 1)
