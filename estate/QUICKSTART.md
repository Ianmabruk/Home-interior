# Akiba Estate - Quick Reference

## 🚀 Quick Start Commands

### Backend (Terminal 1)
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

### Frontend (Terminal 2)
```bash
npm run dev
```

## 🔑 Default Credentials

Create admin user first (see README.md)

**Admin:**
- Email: `admin@akiba.com`
- Password: `admin123`

**Tenant:** (after creating house)
- Email: `tenant@akiba.com`
- Password: `tenant123`

## 📡 API Endpoints

**Base URL:** `http://localhost:5000/api`

### Auth
- `POST /auth/signup` - Register
- `POST /auth/login` - Login
- `POST /auth/send-otp` - Request OTP
- `POST /auth/reset-password` - Reset password

### Admin (Requires auth header)
- `GET /admin/stats` - Dashboard stats
- `GET /admin/houses` - List houses
- `POST /admin/houses` - Create house
- `POST /admin/notices` - Send notice
- `POST /admin/payments` - Create payment

### Tenant (Requires auth header)
- `GET /tenant/dashboard` - Dashboard data
- `GET /tenant/payments` - Payment history
- `POST /tenant/maintenance-requests` - New request

## 🐛 Common Issues

### Port already in use
```bash
# Backend
lsof -ti:5000 | xargs kill -9

# Frontend
lsof -ti:5173 | xargs kill -9
```

### Database connection error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Create database if missing
sudo -u postgres psql -c "CREATE DATABASE estate;"
```

### Module not found
```bash
# Backend
pip install -r backend/requirements.txt

# Frontend
npm install
```

## 📦 Build for Production

### Frontend
```bash
npm run build
# Output in dist/ folder
```

### Backend
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change SECRET_KEY in backend/.env
- [ ] Change JWT_SECRET in backend/.env
- [ ] Use strong database password
- [ ] Enable HTTPS
- [ ] Update CORS origins
- [ ] Set up email service for OTP
- [ ] Enable database backups
- [ ] Set up monitoring and logging
- [ ] Use environment variables
- [ ] Disable debug mode

## 📊 Database Models

**Users** - Stores admin and tenant accounts
**Houses** - Property information
**Payments** - Rent and payment tracking
**Notices** - Announcements
**Events** - Estate events
**Messages** - Chat messages
**MaintenanceRequests** - Tenant requests
**OTP** - Password reset codes
**Warnings** - Admin warnings
**Photos** - Image gallery

## 🎨 Color Scheme

Primary: Green (`#16a34a`)
Background: White (`#ffffff`)
Text: Gray-900 (`#111827`)
Success: Green-600
Warning: Yellow-600
Error: Red-600
Info: Blue-600

## 📱 Responsive Breakpoints

- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

## 🔧 Development Tools

- React DevTools
- Redux DevTools (if added)
- Postman/Insomnia for API testing
- pgAdmin for PostgreSQL management

---

**Need help?** Check the main README.md for detailed documentation.
