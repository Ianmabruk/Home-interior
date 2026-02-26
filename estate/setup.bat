@echo off
echo ============================================
echo    Akiba Estate - Quick Start Script
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo [OK] All prerequisites are installed
echo.

REM Setup Backend
echo [SETUP] Setting up Flask backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
echo [OK] Backend setup complete
cd ..
echo.

REM Setup Frontend
echo [SETUP] Setting up React frontend...
call npm install
echo [OK] Frontend setup complete
echo.

echo ============================================
echo    Setup Complete!
echo ============================================
echo.
echo Next Steps:
echo 1. Create PostgreSQL database named 'estate'
echo 2. Update backend\.env with your database credentials
echo 3. Start backend: cd backend ^&^& venv\Scripts\activate ^&^& python app.py
echo 4. Start frontend: npm run dev
echo 5. Open http://localhost:5173 in your browser
echo.
echo Default Admin Credentials:
echo Email: admin@akiba.com
echo Password: admin123
echo.
echo Remember to create admin user using Python script in README!
pause
