@echo off
echo ===================================================
echo   Starting RestoPOS - Offline Restaurant System
echo ===================================================

echo Starting Backend Server on http://localhost:5000 ...
start "RestoPOS Backend" cmd /k "cd server && npm run dev"

echo Starting Frontend POS Client on http://localhost:5173 ...
start "RestoPOS Frontend" cmd /k "cd client && npm run dev"

echo.
echo RestoPOS is starting up in separate windows.
echo Open http://localhost:5173 in your browser.
echo ===================================================
