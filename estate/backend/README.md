# Akiba Estate Backend

Production-ready Flask backend for Akiba Estate property management system.

## Features

- **Authentication**: JWT-based auth with OTP password reset
- **Role-based Access**: Admin and Tenant roles with protected routes
- **House Management**: CRUD operations for houses and tenants
- **Payment Tracking**: Rent and payment management
- **Messaging**: Chat system between admin and tenants
- **Maintenance Requests**: Tenant issue reporting
- **Notices & Events**: Estate-wide and house-specific announcements

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Database

Create a PostgreSQL database:

```bash
psql -U postgres
CREATE DATABASE estate;
\q
```

### 3. Environment Variables

Create a `.env` file:

```env
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/estate
```

Alternative (without `DATABASE_URL`):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=estate
DB_USER=postgres
DB_PASSWORD=your_password
```

If no PostgreSQL settings are provided, the backend uses a local SQLite DB file (`backend/estate.db`) for quick local development.

### 4. Initialize Database

```bash
python app.py
```

This will create all tables automatically.

### 5. Run Migrations (Optional)

```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/send-otp` - Send OTP for password reset
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password` - Reset password

### Admin Routes (Protected)
- `GET /api/admin/houses` - Get all houses
- `POST /api/admin/houses` - Create house
- `PUT /api/admin/houses/:id` - Update house
- `DELETE /api/admin/houses/:id` - Delete house
- `GET /api/admin/tenants` - Get all tenants
- `POST /api/admin/notices` - Send notice
- `POST /api/admin/payments` - Create payment
- `GET /api/admin/stats` - Get dashboard stats

### Tenant Routes (Protected)
- `GET /api/tenant/dashboard` - Get tenant dashboard
- `GET /api/tenant/payments` - Get payments
- `GET /api/tenant/notices` - Get notices
- `POST /api/tenant/maintenance-requests` - Create maintenance request

### Chat Routes (Protected)
- `GET /api/chat/messages` - Get all messages
- `POST /api/chat/messages` - Send message
- `GET /api/chat/users` - Get users for chat

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based middleware
- House data isolation (tenants see only their house)
- OTP-based password reset

## Production Deployment

1. Set strong SECRET_KEY and JWT_SECRET
2. Use production PostgreSQL database
3. Enable HTTPS
4. Set DEBUG=False
5. Configure CORS for your domain
6. Set up email service for OTP delivery
