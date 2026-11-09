@echo off
cd /d "%~dp0"

set /p port="Set a Port: "

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0LocalWebServer.ps1" -Command %port%

exit