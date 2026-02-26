#!/bin/bash

echo "🏗️  Akiba Estate - Quick Start Script"
echo "======================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ All prerequisites are installed"
echo ""

# Create PostgreSQL database
echo "📊 Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE estate;" 2>/dev/null || echo "Database may already exist"
echo "✅ Database setup complete"
echo ""

# Setup Backend
echo "🐍 Setting up Flask backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
echo "✅ Backend setup complete"
cd ..
echo ""

# Setup Frontend
echo "⚛️  Setting up React frontend..."
npm install
echo "✅ Frontend setup complete"
echo ""

echo "🎉 Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Update backend/.env with your database credentials"
echo "2. Start backend: cd backend && source venv/bin/activate && python app.py"
echo "3. Start frontend: npm run dev"
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "Default Admin Credentials:"
echo "Email: admin@akiba.com"
echo "Password: admin123"
echo ""
echo "Remember to create admin user using Python script in README!"
