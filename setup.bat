@echo off
echo ================================================
echo   Audio Classification - Crawling Setup
echo ================================================

REM Buat virtual environment jika belum ada
if not exist venv (
    echo [1/4] Membuat virtual environment...
    python -m venv venv
) else (
    echo [1/4] Virtual environment sudah ada.
)

REM Aktivasi
echo [2/4] Mengaktifkan virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo [3/4] Menginstall dependencies...
pip install -r requirements.txt

echo [4/4] Setup selesai!
echo.
echo Untuk menjalankan crawling:
echo   jupyter notebook crawling/Crawling_Audio.ipynb
echo.
pause
