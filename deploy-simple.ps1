# Deploy Simples - Envia script bash para VPS
param(
    [switch]$ResetTest = $false
)

$VPS_HOST = "165.22.158.58"
$VPS_USER = "root"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY REMOTO - VPS DIGITALOCEAN     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ler o script bash
$bashScript = Get-Content "deploy-remote.sh" -Raw

# Adicionar parâmetro de reset
$resetParam = if ($ResetTest) { "true" } else { "false" }

Write-Host "[INFO] Host: $VPS_HOST" -ForegroundColor White
Write-Host "[INFO] Reset Test: $ResetTest" -ForegroundColor White
Write-Host "[INFO] Senha: !Bouar4ngo" -ForegroundColor Yellow
Write-Host ""
Write-Host "[SSH] Conectando no VPS..." -ForegroundColor Yellow

# Enviar e executar script
$bashScript | ssh "$VPS_USER@$VPS_HOST" "cat > /tmp/deploy-wppbot.sh && chmod +x /tmp/deploy-wppbot.sh && bash /tmp/deploy-wppbot.sh $resetParam"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOY FINALIZADO                     " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "ACESSOS:" -ForegroundColor Cyan
Write-Host "  Web: http://$VPS_HOST" -ForegroundColor White
Write-Host "  SSH: ssh $VPS_USER@$VPS_HOST" -ForegroundColor White
Write-Host ""
Write-Host "LOGIN:" -ForegroundColor Cyan
Write-Host "  Email: leandro.berti@gmail.com" -ForegroundColor White
Write-Host ""

if ($ResetTest) {
    Write-Host "[RESET] Ambiente resetado! Conecte o WhatsApp novamente." -ForegroundColor Yellow
}
