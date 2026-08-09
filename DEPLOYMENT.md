# Deployment Guide — HOK Interiors Backend

This document describes how to deploy the HOK Interiors backend for horizontal scaling.

## Architecture

The application is stateless and supports running multiple backend instances behind a load balancer. All persistent state is stored in PostgreSQL via Prisma. File uploads go to Cloudinary or Supabase. Authentication uses JWT with refresh tokens stored in the database.

## Required Environment Variables

### Core
| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` |
| `PORT` | Port the server listens on (Render sets this automatically) |
| `BASE_URL` | Public URL of the backend |
| `CLIENT_URL` | Public URL of the frontend (for CORS) |
| `SERVER_ID` | Unique identifier for this instance (e.g., `hok-api-01`) |

### Database
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string with `connection_limit` param |

### File Storage
| Variable | Description |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

**OR**

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

### Authentication
| Variable | Description |
|----------|-------------|
| `JWT_ACCESS_SECRET` | Secret for JWT access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for JWT refresh tokens (min 32 chars) |
| `ACCESS_TOKEN_TTL` | Access token TTL (default: `15m`) |
| `REFRESH_TOKEN_TTL` | Refresh token TTL (default: `30d`) |

### Optional: Redis
| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Redis connection string (recommended for production with multiple instances) |

Redis enables shared rate limiting across instances. Without Redis, rate limiting still works but is per-instance.

### Admin Seeding
| Variable | Description |
|----------|-------------|
| `SEED_ADMIN_EMAIL` | Default admin email |
| `SEED_ADMIN_PASSWORD` | Default admin password |

## Render Multi-Instance Configuration

The `render.yaml` is configured for up to 3 instances:

```yaml
scaling:
  minInstances: 1
  maxInstances: 3
```

### Scaling Procedure

1. **Verify Database Connection Pooling**
   - The `DATABASE_URL` should include `connection_limit`. The app adds `connection_limit=5` if not present.
   - For Render + Neon, each instance uses up to 5 connections. With 3 instances, max 15 concurrent connections.

2. **Deploy to Render**
   - Push changes to trigger a deployment.
   - Render will build and start the service.

3. **Scale Instances**
   - Go to the Render dashboard.
   - Navigate to your web service.
   - Click "Scaling" and adjust the instance count (1–3).
   - Or use the Render CLI:
     ```bash
     render services scale home-interior-backend --instances 3
     ```

4. **Verify Health**
   - Check `/api/health` — all instances return the same database status.
   - Check `/api/ready` — returns 200 if database is ready.

## Database Connection Pooling

Prisma manages the connection pool automatically. For multiple instances:

- **Production**: `connection_limit=5` per instance
- **Development**: `connection_limit=2` per instance

The app automatically appends `connection_limit` to `DATABASE_URL` if missing.

## Redis (Optional but Recommended)

Redis provides:
- Shared rate limiting across instances
- Distributed cache for frequently accessed data
- Future session storage

### Setting up Redis on Render

1. Create a new Redis service in Render.
2. Copy the connection URL.
3. Add `REDIS_URL` to your backend service environment variables.

## Graceful Shutdown

The server handles `SIGTERM` and `SIGINT` signals:

1. Stops accepting new connections
2. Disconnects from PostgreSQL
3. Disconnects from Redis
4. Exits with code 0

If shutdown takes longer than 30 seconds, it forces exit.

## Health Checks

| Endpoint | Purpose |
|----------|---------|
| `/api/health` | Checks database connectivity |
| `/api/ready` | Checks database + Redis availability |

Both endpoints return `X-Server-ID` header for tracing.

## Logging

All log messages include the instance `SERVER_ID` for tracing across instances. Configure `SERVER_ID` in Render environment variables (e.g., `hok-api-01`, `hok-api-02`, etc.).

## Load Balancer Notes

- The app uses `process.env.PORT` (Render sets this automatically).
- Health checks use `/api/health`.
- No instance-specific data is stored in memory.
- JWT authentication is stateless — any instance can validate tokens.
- Refresh tokens are stored in PostgreSQL, shared across all instances.

## Troubleshooting

- **Rate limiting not working across instances**: Enable Redis.
- **Database connection errors**: Check `connection_limit` and max connections on Neon.
- **Instance-specific state**: Ensure no in-memory caches hold critical state.
