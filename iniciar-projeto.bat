@echo off
echo Encerrando processos na porta 3005...
npx kill-port 3005 > nul 2>&1

echo Iniciando frontend e backend...
npm start
pause
