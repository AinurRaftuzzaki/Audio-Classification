@echo off
echo ========================================================
echo   LIVE AUDIO CLASSIFICATION SYSTEM (KNN & 16 FITUR)
echo ========================================================
echo [1/2] Menjalankan Live Audio Server (Background)...
start /b python live_server.py

echo [2/2] Menjalankan Dashboard Streamlit...
echo.
echo Akses Sistem:
echo  - Live Audio Real-Time Monitoring: http://localhost:5000
echo  - Dashboard Lengkap (Streamlit)  : http://localhost:8501
echo.
streamlit run app.py
pause
