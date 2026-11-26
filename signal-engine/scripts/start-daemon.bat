@echo off
REM Windows: start the always-on engine (it sleeps until 9:00 ET on trading days).
cd /d "%~dp0\.."
call .venv\Scripts\activate.bat
python -m kcsignals daemon
