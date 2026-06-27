# Script para aplicar migrations via psql
# Requer: psql instalado no PATH ou variável PGPASSWORD setada

$projectId = "vfglcvmcsiwvqtkpjchl"
$host = "$projectId.supabase.co"
$user = "postgres"
$password = "WnAi3z1zNbYp81Ef"
$database = "postgres"
$port = "5432"

# Set password environment variable for psql (não interativo)
$env:PGPASSWORD = $password

# Aplicar todas as migrations
$migrationPath = "migrations"
Get-ChildItem $migrationPath -Filter "*.sql" | Sort-Object Name | ForEach-Object {
    Write-Host "Aplicando migration: $($_.Name)"
    & psql -h $host -p $port -U $user -d $database -f $_.FullName
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Migration $($_.Name) aplicada com sucesso"
    } else {
        Write-Host "✗ Erro ao aplicar migration $($_.Name)"
    }
}

# Limpar variável de ambiente
Remove-Item env:PGPASSWORD
