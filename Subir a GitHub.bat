@echo off
chcp 65001 >nul
title Subir Aula IA a GitHub
cd /d "%~dp0"
echo Subiendo el proyecto a https://github.com/BernardoCOD/aula-ia-cientifica
echo Si se abre una ventana de GitHub, inicia sesion con la cuenta BernardoCOD.
echo.
git add -A
git -c user.name="Aula IA" -c user.email="becabellodp@gmail.com" commit -q -m "Actualizacion del proyecto" 2>nul
git push -u origin main
echo.
if errorlevel 1 (
  echo No se pudo subir. Revisa el mensaje de arriba.
) else (
  echo Listo: el proyecto esta en GitHub.
)
pause
