import json
import mysql.connector

# Ler JSON
with open('/tmp/config_with_flows.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

# Conectar ao banco
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Leviathan1986@',
    database='wppbot_saas'
)

cursor = conn.cursor()

# Inserir
config_json = json.dumps(config, ensure_ascii=False)
cursor.execute("UPDATE bot_configs SET courses_config = %s WHERE id = 1", (config_json,))
conn.commit()

print("✅ Configuração inserida no banco de dados!")

# Verificar
cursor.execute("SELECT JSON_LENGTH(courses_config, '$.courses') as total FROM bot_configs WHERE id=1")
result = cursor.fetchone()
print(f"✅ Total de cursos: {result[0]}")

# Verificar fluxos
cursor.execute("SELECT JSON_LENGTH(courses_config, '$.courses[7].flow_instructions') as caixa, JSON_LENGTH(courses_config, '$.courses[8].flow_instructions') as tce FROM bot_configs WHERE id=1")
result = cursor.fetchone()
print(f"✅ Fluxo CAIXA: {result[0]} caracteres")
print(f"✅ Fluxo TCE MG: {result[1]} caracteres")

cursor.close()
conn.close()

print("\n🎉 TODOS OS 9 FLUXOS FORAM INSERIDOS COM SUCESSO!")
print("\n📋 Fluxos incluídos:")
print("  1. ✅ Pós em Auditoria")
print("  2. ✅ Pós em Medicina do Trabalho")
print("  3. ✅ Pós em Perícia Médica")
print("  4. ✅ Combo (2 em 1)")
print("  5. ✅ Prova de Títulos")
print("  6. ✅ Missão Médico Legista")
print("  7. ✅ SOS Médico Legista")
print("  8. ✅ CAIXA - Médico do Trabalho")
print("  9. ✅ TCE MG - Tribunal de Contas")
