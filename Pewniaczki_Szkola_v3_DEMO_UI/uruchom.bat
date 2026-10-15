@echo off
setlocal
cd /d "%~dp0"
if not exist "backend\.env" goto missing_env
if not exist "backend\node_modules" goto missing_deps
if not exist "frontend\node_modules" goto missing_deps
echo Uruchamianie aplikacji Pewniaczki v3...
start "Pewniaczki - Backend" cmd /k "cd /d ""%~dp0backend"" && npm.cmd run dev"
start "Pewniaczki - Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm.cmd run dev"
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"
echo Panel: http://localhost:5173
echo API: http://localhost:4000/api/health
exit /b 0
:missing_env
echo BLAD: Brak backend\.env. Uruchom instalacja.bat.
goto fail
:missing_deps
echo BLAD: Brak bibliotek. Uruchom instalacja.bat.
goto fail
:fail
pause
exit /b 1
