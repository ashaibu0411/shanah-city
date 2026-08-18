@echo off
cd /d "%~dp0.."
echo Syncing Capacitor...
call npm run mobile:sync
echo.
echo Opening Android Studio (no Capacitor SDK dialog)...
call npm run mobile:android
