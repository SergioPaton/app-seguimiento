@echo off
echo Arrancando Servidor y Cliente en ventanas independientes...
start "Servidor Backend" cmd /k "cd /d %~dp0app-seguimiento\server && node server.js"
start "" "http://localhost:5173"
