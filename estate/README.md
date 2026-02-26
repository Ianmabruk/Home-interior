# Akiba Estate - Production-Level Property Management System

A comprehensive fullstack web application for estate/property management built with React, Flask, and PostgreSQL.

## 🚀 Features

### Authentication & Security
- JWT-based authentication
- Role-based access control (Admin & Tenant)
- OTP password reset system
- Bcrypt password hashing
- Protected API routes

### Admin Dashboard
- 📊 Analytics dashboard with real-time statistics
- 🏠 Complete CRUD operations for houses
- 👥 Tenant management
- 💰 Payment tracking and management
- 📢 Send general or house-specific announcements
- 📅 Event scheduling with reminders
- ⚠️ Warning system for tenants
- 🛠️ Maintenance request management
- 💬 Real-time chat with tenants
- 📸 Photo gallery management

### Tenant Dashboard
- 🏡 View house information and residents
- 💳 Track payments (due and paid)
- 📰 Receive notices and announcements
- 📅 View upcoming events
- ⚠️ View warnings
- 🖼️ Access house and estate photos
- 🔧 Submit maintenance requests
- 💬 Chat with admin

### UI/UX
- Modern, professional SaaS design
- Clean white background with green accents
- Fully responsive mobile design
- Sidebar navigation
- Smooth transitions and animations
- Intuitive user interface

## 📁 Project Structure

```
estate/
├── backend/                 # Flask API
│   ├── app.py              # Main application
│   ├── config.py           # Configuration
│   ├── models.py           # Database models
│   ├── requirements.txt    # Python dependencies
│   ├── routes/             # API routes
│   │   ├── auth.py        # Authentication
│   │   ├── admin.py       # Admin operations
│   │   ├── tenant.py      # Tenant operations
│   │   └── chat.py        # Messaging
│   └── utils/             # Utilities
│       ├── jwt.py         # JWT handling
│       ├── otp.py         # OTP generation
│       └── roles.py       # Role middleware
│
└── src/                    # React frontend
    ├── main.jsx           # Entry point
    ├── App.jsx            # Main app component
    ├── api/               # API service
    │   └── index.js
    ├── pages/             # Page components
    │   ├── Login.jsx
    │   ├── Signup.jsx
    │   ├── ForgotPassword.jsx
    │   ├── TenantDashboard.jsx
    │   ├── AdminDashboard.jsx
    │   ├── tenant/        # Tenant pages
    │   └── admin/         # Admin pages
    ├── components/        # Reusable components
    │   ├── Sidebar.jsx
    │   └── ProtectedRoute.jsx
    └── layouts/           # Layout components
        └── DashboardLayout.jsx
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Heroicons** - Icon library

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database
- **Flask-Migrate** - Database migrations
- **Flask-CORS** - Cross-origin resource sharing
- **PyJWT** - JWT authentication
- **Bcrypt** - Password hashing

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- PostgreSQL 12+

### Backend Setup

1. **Install PostgreSQL and create database:**
```bash
# On Linux/Mac
sudo -u postgres psql
CREATE DATABASE estate;
\q

# On Windows (using psql)
psql -U postgres
CREATE DATABASE estate;
\q
```

2. **Navigate to backend and install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

3. **Create `.env` file:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database:**
```bash
python app.py
```

The database tables will be created automatically on first run.

5. **Run the backend server:**
```bash
python app.py
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to project root and install dependencies:**
```bash
cd ..
npm install
```

2. **Run the development server:**
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🔑 Default Access

### Create Admin User

Run this in Python after starting the backend:

```python
from app import app
from models import db, User
import bcrypt

with app.app_context():
    hashed = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt())
    admin = User(
        email="admin@akiba.com",
        phone="+254700000000",
        password=hashed,
        role="admin",
        house_id=None
    )
    db.session.add(admin)
    db.session.commit()
    print("Admin created!")
```

**Admin Login:**
- Email: `admin@akiba.com`
- Password: `admin123`

### Create Tenant User

Tenants can sign up through the signup page or you can create them via Python:

```python
from app import app
from models import db, User, House
import bcrypt

with app.app_context():
    # First create a house
    house = House(number="A101", owner="John Doe", status="occupied")
    db.session.add(house)
    db.session.commit()
    
    # Then create tenant
    hashed = bcrypt.hashpw("tenant123".encode(), bcrypt.gensalt())
    tenant = User(
        email="tenant@akiba.com",
        phone="+254700000001",
        password=hashed,
        role="tenant",
        house_id=house.id
    )
    db.session.add(tenant)
    db.session.commit()
    print(f"Tenant created for House {house.number}!")
```

## 🎯 Usage

### For Admins

1. **Login** with admin credentials
2. **Dashboard** - View estate statistics
3. **Houses** - Add, edit, delete houses
4. **Tenants** - Manage tenant accounts
5. **Payments** - Create payment records for houses
6. **Notices** - Send announcements (general or house-specific)
7. **Events** - Schedule estate events
8. **Maintenance** - Review and update maintenance requests
9. **Chat** - Communicate with tenants

### For Tenants

1. **Signup** with email, phone, password, and house number
2. **Login** to access dashboard
3. **View** house information and residents
4. **Check** payments due and payment history
5. **Read** notices and announcements
6. **View** upcoming events
7. **Submit** maintenance requests
8. **Chat** with admin
9. **Browse** house and estate photos

## 🔒 Security Features

- ✅ JWT token authentication with expiration
- ✅ Bcrypt password hashing (salt rounds: 12)
- ✅ Role-based access control middleware
- ✅ Protected API routes
- ✅ House data isolation (tenants can only access own house)
- ✅ OTP-based password reset (10-minute expiration)
- ✅ CORS configuration for frontend-backend communication
- ✅ Environment variable configuration
- ✅ SQL injection protection via SQLAlchemy ORM

## 🚀 Production Deployment

### Backend (Flask)

1. **Update configuration:**
```python
# config.py
SECRET_KEY = os.getenv("SECRET_KEY")  # Use strong random key
JWT_SECRET = os.getenv("JWT_SECRET")  # Use strong random key
SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")  # Production DB
```

2. **Use production WSGI server:**
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

3. **Enable HTTPS** (required for production)

4. **Set up email service** for OTP delivery

### Frontend (React)

1. **Build for production:**
```bash
npm run build
```

2. **Deploy `dist/` folder** to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Your own server with Nginx

3. **Update API URL:**
```env
VITE_API_URL=https://your-api-domain.com/api
```

### Database

1. **Use managed PostgreSQL:**
   - AWS RDS
   - Google Cloud SQL
   - DigitalOcean Managed Databases
   - Heroku Postgres

2. **Enable SSL connections**

3. **Set up automated backups**

4. **Configure connection pooling**

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/auth/signup        - Register new user
POST /api/auth/login         - Login user
POST /api/auth/send-otp      - Send OTP for password reset
POST /api/auth/verify-otp    - Verify OTP code
POST /api/auth/reset-password - Reset password with OTP
```

### Admin Endpoints (Protected)

```
GET  /api/admin/stats                - Dashboard statistics
GET  /api/admin/houses               - Get all houses
POST /api/admin/houses               - Create house
PUT  /api/admin/houses/:id           - Update house
DELETE /api/admin/houses/:id         - Delete house
GET  /api/admin/tenants              - Get all tenants
POST /api/admin/notices              - Send notice
POST /api/admin/payments             - Create payment
GET  /api/admin/maintenance-requests - Get maintenance requests
PUT  /api/admin/maintenance-requests/:id - Update request status
```

### Tenant Endpoints (Protected)

```
GET /api/tenant/dashboard           - Get dashboard data
GET /api/tenant/payments            - Get payments
GET /api/tenant/notices             - Get notices
GET /api/tenant/events              - Get events
POST /api/tenant/maintenance-requests - Create maintenance request
```

### Chat Endpoints (Protected)

```
GET  /api/chat/messages             - Get all messages
GET  /api/chat/messages/conversation/:userId - Get conversation
POST /api/chat/messages             - Send message
PUT  /api/chat/messages/:id/read    - Mark as read
GET  /api/chat/users                - Get users for chat
```

## 🧪 Testing

```bash
# Backend tests (add pytest)
pip install pytest
pytest

# Frontend tests (add vitest)
npm install -D vitest
npm run test
```

## 🐛 Troubleshooting

### Backend Issues

**Database connection error:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check credentials in .env file
# Ensure database 'estate' exists
```

**Module not found:**
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend Issues

**API connection error:**
```bash
# Check backend is running on port 5000
# Check VITE_API_URL in .env
# Check CORS configuration in backend
```

**Dependencies error:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📈 Future Enhancements

- [ ] WebSocket for real-time chat and notifications
- [ ] M-Pesa/Stripe payment integration
- [ ] Email notifications for payments and events
- [ ] SMS notifications via Twilio/Africa's Talking
- [ ] Advanced analytics with charts (Chart.js/Recharts)
- [ ] Document upload for tenants
- [ ] Multi-estate support
- [ ] Dark mode toggle
- [ ] Audit logs for admin actions
- [ ] Tenant verification status
- [ ] Export reports to PDF/Excel
- [ ] Automated rent reminders (Cron jobs)
- [ ] Push notifications (Firebase)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built with ❤️ for modern estate management

## 🙏 Acknowledgments

- React team for amazing UI library
- Flask team for lightweight Python framework
- TailwindCSS for utility-first CSS
- PostgreSQL for robust database

---

**⭐ Star this repo if you find it helpful!**
