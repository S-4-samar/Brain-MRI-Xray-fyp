# Start the FastAPI inference server on port 8000
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ProjectRoot "backend"
$VenvPython = Join-Path $ProjectRoot "brats_env\Scripts\python.exe"

Set-Location $BackendDir

if (Test-Path $VenvPython) {
    & $VenvPython -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
} else {
    Write-Host "Virtual env not found at brats_env. Using system Python..."
    python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
}
