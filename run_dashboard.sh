#!/bin/bash

echo "Starting Pneumonia Severity Assessment Dashboard..."
echo ""

# Start backend
echo "[1/2] Starting FastAPI Backend..."
source venv/bin/activate
uvicorn src.api.main:app --reload --port 8000 &
BACKEND_PID=$!

sleep 3

# Start frontend
echo "[2/2] Starting React Frontend..."
cd app/dashboard
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Dashboard starting..."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
