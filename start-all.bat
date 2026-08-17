@echo off
echo 🚀 Starting Wholesale Distribution System...
echo.
echo 📦 Starting Backend Server...
start cmd /k "echo Backend Server & npm run server"

timeout /t 3 /nobreak > nul

echo 🎨 Starting Frontend Application...
start cmd /k "echo Frontend Application & npm run dev"

echo.
echo ✅ Both servers are starting!
echo.
echo 📱 Frontend: http://localhost:5173
echo 📦 Backend:  http://localhost:3000
echo.
echo 👤 Demo Accounts:
echo   - wholesaler@example.com / password123
echo   - admin@example.com / password123
echo.
echo Press any key to close this window...
pause > nul