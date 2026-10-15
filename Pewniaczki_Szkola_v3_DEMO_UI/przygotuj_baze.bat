@echo off
setlocal
cd /d "%~dp0backend"
echo ============================================
echo    PEWNIACZKI v3 - BAZA MYSQL I KONTA
echo ============================================
if not exist ".env" goto missing_env
call npx.cmd prisma migrate deploy
if errorlevel 1 goto migrate_error
call npx.cmd prisma generate
if errorlevel 1 goto prisma_error
call npm.cmd run db:seed
if errorlevel 1 goto seed_error
echo.
echo [KONFIGURACJA ADMINISTRATORA]
call npm.cmd run admin:create
if errorlevel 1 goto admin_error
echo.
echo GOTOWE. Uruchom uruchom.bat.
pause
exit /b 0
:missing_env
echo BLAD: Brak backend\.env. Uruchom instalacja.bat.
goto fail
:migrate_error
echo BLAD migracji. Sprawdz XAMPP oraz backend\.env.
goto fail
:prisma_error
echo BLAD generowania Prisma Client.
goto fail
:seed_error
echo BLAD zapisywania danych testowych.
goto fail
:admin_error
echo BLAD konta admin. Mozesz ponowic: cd backend ^&^& npm.cmd run admin:create
goto fail
:fail
pause
exit /b 1
