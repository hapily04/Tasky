@echo off
setlocal EnableExtensions
cd /d "%~dp0"

REM Set to 1 if you prebuilt on this PC and want .next in the zip
set INCLUDE_NEXT=0

echo.
echo Packing Tasky for upload...
echo   Folder: %CD%
echo   Zip layout: app/  (extract to /home/container/app on panel)
echo   Include .next: %INCLUDE_NEXT%
echo   Keeps on server: .env, data/, cloudflared at container root
echo.

if "%INCLUDE_NEXT%"=="1" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\pack-for-upload.ps1" -IncludeNext
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\pack-for-upload.ps1"
)

if errorlevel 1 (
  echo.
  echo Pack failed.
  pause
  exit /b 1
)

echo Done.
pause
endlocal
