@echo off
title Audio Surveillance System Launcher
echo ========================================================
echo   AUDIO SURVEILLANCE SYSTEM (FASTAPI + RANDOM FOREST)
echo ========================================================
echo.

echo [1/2] Menjalankan Backend API (FastAPI + Uvicorn)...
start "Backend Server (FastAPI)" cmd /k "cd Backend && uvicorn main:app --reload --host 127.0.0.1 --port 8000"
timeout /t 3 /nobreak >nul

echo [2/2] Menjalankan Frontend Client (React + Vite)...
echo.
echo Akses Antarmuka:
echo  - Frontend Dashboard : http://localhost:5173
echo  - Backend API Docs   : http://127.0.0.1:8000/docs
echo  - WebSocket Endpoint : ws://127.0.0.1:8000/ws/audio
echo.

cd Frontend\vite-project && npm run dev
