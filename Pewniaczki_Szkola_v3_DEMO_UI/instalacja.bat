@echo off
setlocal
cd /d "%~dp0"
echo ============================================
echo       PEWNIACZKI v3 - INSTALACJA WINDOWS
echo ============================================
node --version >nul 2>&1
if errorlevel 1 goto no_node
call npm.cmd --version >nul 2>&1
if errorlevel 1 goto no_npm
if not exist "backend\.env" (
  copy /Y "backend\.env.example" "backend\.env" >nul
  if errorlevel 1 goto env_error
  echo Utworzono backend\.env - uzupelnij w nim lokalne haslo bazy.
)
echo.
echo [1/3] Instalacja bibliotek backendu...
pushd "backend"
call npm.cmd install
if errorlevel 1 goto backend_error
echo.
echo [2/3] Generowanie Prisma Client...
call npx.cmd prisma generate
if errorlevel 1 goto prisma_error
popd
echo.
echo [3/3] Instalacja bibliotek frontendu...
pushd "frontend"
call npm.cmd install
if errorlevel 1 goto frontend_error
popd
echo.
echo GOTOWE. Teraz uzupelnij backend\.env i uruchom przygotuj_baze.bat.
pause
exit /b 0
:no_node
echo BLAD: Nie wykryto node.exe. Zainstaluj Node.js LTS i uruchom ten plik ponownie.
goto fail
:no_npm
echo BLAD: Nie wykryto npm.cmd. Sprawdz instalacje Node.js.
goto fail
:env_error
echo BLAD: Nie udalo sie utworzyc backend\.env.
goto fail
:backend_error
popd
echo BLAD: npm install w backend zakonczyl sie bledem.
goto fail
:prisma_error
popd
echo BLAD: npx prisma generate zakonczyl sie bledem.
goto fail
:frontend_error
popd
echo BLAD: npm install w frontend zakonczyl sie bledem.
goto fail
:fail
pause
exit /b 1
