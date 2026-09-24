@echo off
chcp 65001 >nul
title Aula IA Cientifica
cd /d "%~dp0"

rem ==========================================================================
rem  Inicia Aula IA y abre el navegador listo para usar solo con la voz:
rem  - la primera vez, alguien debe pulsar "Permitir" en el aviso del microfono;
rem    Chrome lo recuerda para siempre en este perfil
rem  - permite que el asistente hable sin que nadie toque la pagina
rem  - abre la app como ventana propia, sin barra de direcciones
rem ==========================================================================

if not exist node_modules (
  echo Instalando dependencias por primera vez, espera un momento...
  call npx -y pnpm@10.4.1 install
)
if not exist .env (
  copy .env.example .env >nul
  echo Se creo el archivo .env. Escribe tu clave de Claude en ANTHROPIC_API_KEY.
)

curl -s -o nul http://localhost:3000 && goto abrir
echo Iniciando el servidor de Aula IA...
start "Servidor Aula IA - no cierres esta ventana" /min cmd /k "npx pnpm@10.4.1 dev"

set /a intentos=0
:esperar
timeout /t 2 /nobreak >nul
curl -s -o nul http://localhost:3000 && goto abrir
set /a intentos+=1
if %intentos% lss 45 goto esperar
echo No se pudo iniciar el servidor. Revisa la ventana "Servidor Aula IA".
pause
exit /b 1

:abrir
set "NAVEGADOR="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "NAVEGADOR=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined NAVEGADOR if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "NAVEGADOR=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined NAVEGADOR if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "NAVEGADOR=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined NAVEGADOR if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "NAVEGADOR=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined NAVEGADOR (
  echo No encontre Google Chrome ni Microsoft Edge. Instala Google Chrome.
  pause
  exit /b 1
)

start "" "%NAVEGADOR%" --user-data-dir="%LocalAppData%\AulaIA\navegador" --app=http://localhost:3000 --start-maximized --autoplay-policy=no-user-gesture-required --no-first-run --no-default-browser-check
exit /b 0
