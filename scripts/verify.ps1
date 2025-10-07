# PowerShell script for verification
# This script handles command chaining in a PowerShell-compatible way

Write-Host "Running verification steps..." -ForegroundColor Cyan

# Step 1: Contract checking
Write-Host "Step 1: Contract checking..." -ForegroundColor Yellow
pnpm run contracts:check
if ($LASTEXITCODE -ne 0) {
    Write-Host "Contract checking failed" -ForegroundColor Red
    exit 1
}

# Step 2: Client generation
Write-Host "Step 2: Client generation..." -ForegroundColor Yellow
pnpm run client:gen
if ($LASTEXITCODE -ne 0) {
    Write-Host "Client generation failed" -ForegroundColor Red
    exit 1
}

# Step 3: Dependency cruising
Write-Host "Step 3: Dependency cruising..." -ForegroundColor Yellow
pnpm run depcruise
if ($LASTEXITCODE -ne 0) {
    Write-Host "Dependency cruising failed" -ForegroundColor Red
    exit 1
}

Write-Host "All verification steps passed!" -ForegroundColor Green
