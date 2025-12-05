#!/usr/bin/env python3
"""
Script para testar conexão com banco de dados MySQL remoto
Banco: espiritualidade_quantica
"""

import sys

try:
    import mysql.connector
    from mysql.connector import Error
except ImportError:
    print("❌ Módulo mysql-connector-python não instalado")
    print("Instale com: pip install mysql-connector-python")
    sys.exit(1)

# Configurações de conexão
config = {
    'host': '165.22.158.58',
    'port': 3306,
    'user': 'espiritual',
    'password': 'Quantic@2025!',
    'database': 'espiritualidade_quantica'
}

def test_connection():
    """Testa a conexão com o banco de dados"""
    try:
        print("🔄 Tentando conectar ao banco de dados...")
        print(f"   Host: {config['host']}")
        print(f"   Banco: {config['database']}")
        print(f"   Usuário: {config['user']}")
        print()
        
        # Conectar ao banco de dados
        connection = mysql.connector.connect(**config)
        
        if connection.is_connected():
            db_info = connection.get_server_info()
            print(f"✅ CONEXÃO BEM SUCEDIDA!")
            print(f"   Versão MySQL: {db_info}")
            print()
            
            # Criar cursor
            cursor = connection.cursor()
            
            # Testar query: mostrar tabelas
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            print(f"📊 Tabelas encontradas ({len(tables)}):")
            for table in tables:
                print(f"   - {table[0]}")
            print()
            
            # Testar query: contar registros
            queries = [
                ("users", "SELECT COUNT(*) FROM users"),
                ("books", "SELECT COUNT(*) FROM books"),
                ("payments", "SELECT COUNT(*) FROM payments")
            ]
            
            print("📈 Contagem de registros:")
            for table_name, query in queries:
                cursor.execute(query)
                count = cursor.fetchone()[0]
                print(f"   - {table_name}: {count} registros")
            
            print()
            print("=" * 60)
            print("✅ TESTE CONCLUÍDO COM SUCESSO!")
            print("=" * 60)
            print()
            print("📋 DADOS DE ACESSO:")
            print(f"   Host: {config['host']}")
            print(f"   Porta: {config['port']}")
            print(f"   Banco: {config['database']}")
            print(f"   Usuário: {config['user']}")
            print(f"   Senha: {config['password']}")
            print()
            print("🔗 String de Conexão:")
            print(f"   mysql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}")
            print()
            
            cursor.close()
            
    except Error as e:
        print(f"❌ ERRO AO CONECTAR: {e}")
        print()
        print("Possíveis causas:")
        print("  1. Firewall bloqueando porta 3306")
        print("  2. MySQL não configurado para aceitar conexões externas")
        print("  3. Credenciais incorretas")
        print("  4. Servidor fora do ar")
        return False
        
    finally:
        if 'connection' in locals() and connection.is_connected():
            connection.close()
            print("🔌 Conexão encerrada.")
    
    return True

if __name__ == "__main__":
    test_connection()
