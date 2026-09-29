@echo off
echo Arrancando Servidor y Cliente en ventanas independientes...
start "Servidor Backend" cmd /k "cd /d %~dp0app-seguimiento\server && node server.js"
start "Cliente Vite" cmd /k "cd /d %~dp0app-seguimiento-cliente\client && npm run dev"
