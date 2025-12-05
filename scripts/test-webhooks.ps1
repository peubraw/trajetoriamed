# Script de Teste - Webhooks de Pagamento
# Execute este script para testar os webhooks localmente ou no VPS

$VPS_IP = "165.22.158.58"
$LOCAL_URL = "http://localhost:3001"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTE DE WEBHOOKS DE PAGAMENTO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Menu de escolha
Write-Host "Escolha o ambiente de teste:" -ForegroundColor Yellow
Write-Host "1) Local (localhost:3001)" -ForegroundColor White
Write-Host "2) VPS ($VPS_IP)" -ForegroundColor White
Write-Host ""
$ambiente = Read-Host "Digite 1 ou 2"

if ($ambiente -eq "1") {
    $BASE_URL = $LOCAL_URL
    Write-Host "✅ Testando em: LOCAL" -ForegroundColor Green
} else {
    $BASE_URL = "http://$VPS_IP"
    Write-Host "✅ Testando em: VPS" -ForegroundColor Green
}

Write-Host ""
Write-Host "Escolha o gateway:" -ForegroundColor Yellow
Write-Host "1) Kiwify" -ForegroundColor White
Write-Host "2) Hotmart" -ForegroundColor White
Write-Host "3) Ambos" -ForegroundColor White
Write-Host ""
$gateway = Read-Host "Digite 1, 2 ou 3"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Payload Kiwify
$kiwifyPayload = @{
    order_id = "TEST-KIWI-$(Get-Date -Format 'yyyyMMddHHmmss')"
    order_status = "paid"
    customer_email = "teste@trajetoriamed.com"
    customer_phone = "5511999999999"
    product_name = "Pós Medicina do Trabalho"
    product_value = "2197.00"
    seller_email = "leandro.berti@gmail.com"
    created_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

# Payload Hotmart
$hotmartPayload = @{
    id = "TEST-HOT-$(Get-Date -Format 'yyyyMMddHHmmss')"
    event = "PURCHASE_COMPLETE"
    data = @{
        buyer = @{
            email = "teste@trajetoriamed.com"
            phone = "5511999999999"
            name = "Cliente Teste"
        }
        purchase = @{
            transaction = "HOT-TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
            status = "approved"
            price = @{
                value = 2197.00
                currency_code = "BRL"
            }
        }
        product = @{
            name = "Pós Medicina do Trabalho"
            id = "123456"
        }
    }
} | ConvertTo-Json -Depth 5

# Função para enviar webhook
function Send-Webhook {
    param(
        [string]$Gateway,
        [string]$Payload
    )
    
    Write-Host ""
    Write-Host "📤 Enviando webhook para $Gateway..." -ForegroundColor Yellow
    Write-Host "URL: $BASE_URL/api/webhooks/$Gateway" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/api/webhooks/$Gateway" `
            -Method POST `
            -ContentType "application/json" `
            -Body $Payload `
            -ErrorAction Stop
        
        if ($response.success) {
            Write-Host "✅ Webhook $Gateway enviado com sucesso!" -ForegroundColor Green
            Write-Host "   Resposta: $($response.message)" -ForegroundColor Gray
        } else {
            Write-Host "❌ Falha ao processar webhook $Gateway" -ForegroundColor Red
            Write-Host "   Erro: $($response.message)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Erro ao enviar webhook $Gateway" -ForegroundColor Red
        Write-Host "   Detalhes: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Executar testes
if ($gateway -eq "1" -or $gateway -eq "3") {
    Send-Webhook -Gateway "kiwify" -Payload $kiwifyPayload
    Start-Sleep -Seconds 1
}

if ($gateway -eq "2" -or $gateway -eq "3") {
    Send-Webhook -Gateway "hotmart" -Payload $hotmartPayload
    Start-Sleep -Seconds 1
}

# Buscar logs
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 Verificando logs de webhooks..." -ForegroundColor Yellow

try {
    $logs = Invoke-RestMethod -Uri "$BASE_URL/api/webhooks/logs" `
        -Method GET `
        -ContentType "application/json"
    
    if ($logs.success -and $logs.logs.Count -gt 0) {
        Write-Host "✅ Últimos 5 webhooks recebidos:" -ForegroundColor Green
        Write-Host ""
        
        $logs.logs | Select-Object -First 5 | ForEach-Object {
            $status = switch ($_.processing_status) {
                "processed" { "✅ PROCESSADO" }
                "pending"   { "⏳ PENDENTE" }
                "failed"    { "❌ FALHOU" }
            }
            
            Write-Host "  🔹 $($_.gateway.ToUpper()) | $($_.event_type) | $status" -ForegroundColor Cyan
            Write-Host "     Lead: $($_.lead_name) ($($_.lead_phone))" -ForegroundColor Gray
            Write-Host "     Data: $($_.created_at)" -ForegroundColor Gray
            
            if ($_.error_message) {
                Write-Host "     Erro: $($_.error_message)" -ForegroundColor Red
            }
            Write-Host ""
        }
    } else {
        Write-Host "⚠️  Nenhum log encontrado" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Erro ao buscar logs" -ForegroundColor Red
    Write-Host "   Detalhes: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Teste concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Acesse: $BASE_URL/webhook-config.html" -ForegroundColor White
Write-Host "  2. Verifique os logs na tabela" -ForegroundColor White
Write-Host "  3. Configure os webhooks nos gateways" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
