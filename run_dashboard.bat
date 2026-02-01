@echo off
echo Starting Pneumonia Severity Assessment Dashboard...
echo.

echo [1/2] Starting FastAPI Backend...
start "Backend API" cmd /k "venv\Scripts\activate && uvicorn src.api.main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React Frontend...
cd app\dashboard
start "Frontend Dashboard" cmd /k "npm run dev"

echo.
echo Dashboard starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul
