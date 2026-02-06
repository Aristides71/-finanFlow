@echo off
echo Iniciando o Finance Manager...

start "Finance Manager Server" cmd /k "cd server && npm start"
start "Finance Manager Client" cmd /k "cd client && npm run dev"

echo Servidores iniciados!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
