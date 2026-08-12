# cPanel Deployment Guide — HOK Interior Designs

## Overview

This guide explains how to deploy the HOK Interior Designs website to cPanel hosting with Apache (frontend) and Node.js/Passenger (backend).

## Architecture

```
Customer Browser
       ↓
https://yourdomain.com (Apache serving static React files)
       ↓
https://api.yourdomain.com (Node.js/Passenger backend)
       ↓
PostgreSQL Database
```

## Prerequisites

1. cPanel hosting with:
   - Apache
   - Node.js/Passenger (or SSH access to run Node.js)
   - PostgreSQL database (or MySQL/MariaDB with migration)
2. Domain name pointing to your cPanel server
3. SSL certificate (Let's Encrypt via cPanel is fine)

---

## Step 1: Build Frontend Locally

```bash
# From the project root
npm install
npm run build
```

This creates the `dist/` folder with production-ready static files.

---

## Step 2: Upload Frontend to cPanel

1. Log into cPanel
2. Open **File Manager**
3. Navigate to `public_html/` (this is your web root)
4. **Delete** any existing files in `public_html/` (except any you want to keep)
5. Upload the **contents** of `CPANEL_DEPLOYMENT/frontend-dist/` to `public_html/`

**DO NOT** upload the `frontend-dist` folder itself — upload its contents.

Final structure in `public_html/`:
```
public_html/
├── index.html
├── assets/
├── .htaccess
├── favicon.svg
├── robots.txt
├── sitemap.xml
├── manifest.webmanifest
├── sw.js
└── workbox-484ee7e7.js
```

---

## Step 3: Configure Frontend Environment

The frontend needs to know where the backend API is located.

### Option A: Build-time configuration (recommended)

Before building, set the API URL:

```bash
# For separate subdomain
export VITE_API_URL=https://api.yourdomain.com/api
npm run build

# For same domain with proxy
export VITE_API_URL=/api
npm run build
```

Then upload the new `dist/` contents to `public_html/`.

### Option B: Runtime configuration (advanced)

Create `public_html/config.js` before `index.html` loads:

```html
<!-- In index.html, before main.jsx -->
<script src="/config.js"></script>
```

```js
// public_html/config.js
window.__API_URL__ = 'https://api.yourdomain.com/api';
```

Then modify `src/services/api.js` to read from `window.__API_URL__`.

---

## Step 4: Create Backend Directory

1. In cPanel File Manager, navigate to your home directory (same level as `public_html/`)
2. Create a folder called `api` (or any name you prefer)
3. Upload the **contents** of `CPANEL_DEPLOYMENT/backend/backend/` to this folder

Final structure:
```
/home/youruser/
├── public_html/          (frontend)
└── api/                  (backend)
    ├── src/
    ├── prisma/
    ├── uploads/
    ├── package.json
    ├── package-lock.json
    └── .env
```

---

## Step 5: Set Up Node.js Application in cPanel

1. In cPanel, go to **Setup Node.js App** (or **Node.js Manager**)
2. Click **Create Application**
3. Fill in:
   - **Node.js version**: 20.x or 22.x (matches your local version)
   - **Application mode**: Production
   - **Application root**: `/home/youruser/api`
   - **Application URL**: `api.yourdomain.com` (create a subdomain first)
   - **Application startup file**: `src/server.js`
4. Click **Create**

---

## Step 6: Install Backend Dependencies

After creating the Node.js app:

```bash
# Via cPanel Terminal or SSH
cd /home/youruser/api
npm install --production
```

Or use cPanel's **Run NPM Install** button if available.

---

## Step 7: Configure Backend Environment Variables

In cPanel Node.js App settings, set these environment variables:

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | Yes |
| `PORT` | `10000` (or the port shown in cPanel) | Yes |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` | Yes |
| `JWT_ACCESS_SECRET` | `your-secure-secret-here` | Yes |
| `JWT_REFRESH_SECRET` | `your-secure-refresh-secret` | Yes |
| `CLIENT_URL` | `https://yourdomain.com` | Yes |
| `CLOUDINARY_CLOUD_NAME` | `your-cloud-name` | If using Cloudinary |
| `CLOUDINARY_API_KEY` | `your-api-key` | If using Cloudinary |
| `CLOUDINARY_API_SECRET` | `your-api-secret` | If using Cloudinary |
| `REDIS_URL` | `redis://...` | Optional |

**Important**: Never commit `.env` files to git.

---

## Step 8: Configure Database

1. In cPanel, go to **PostgreSQL Databases** (or **MySQL Databases**)
2. Create a new database
3. Create a database user and note the password
4. Add the user to the database with all privileges
5. Update `DATABASE_URL` in your backend `.env` with the new credentials

### Run Migrations

```bash
cd /home/youruser/api
npx prisma migrate deploy
```

If `prisma migrate deploy` is not available, use:
```bash
npx prisma db push
```

**Note**: If migrating from Neon/PostgreSQL to cPanel's PostgreSQL, you may need to export/import data.

---

## Step 9: Configure DNS

1. In your domain registrar, add an **A record**:
   - Name: `@`
   - Value: Your cPanel server IP
   - TTL: 3600

2. Add a **CNAME record** for the API subdomain:
   - Name: `api`
   - Value: `yourdomain.com` (or the cPanel server hostname)
   - TTL: 3600

3. In cPanel, go to **Subdomains** and create:
   - Subdomain: `api`
   - Domain: `yourdomain.com`
   - Document Root: `/home/youruser/api` (or leave default)

4. Wait for DNS propagation (usually 5-30 minutes)

---

## Step 10: Configure SSL

1. In cPanel, go to **SSL/TLS Status**
2. Enable **AutoSSL** for both:
   - `yourdomain.com`
   - `api.yourdomain.com`

Or use Let's Encrypt if available.

---

## Step 11: Test Backend

```bash
# Health check
curl https://api.yourdomain.com/health

# Expected response:
# {"database":"ok","server":"running"}
```

If you get a 404, check:
- Node.js app is running in cPanel
- `.htaccess` in `public_html/` is correct
- Application URL in cPanel matches your subdomain

---

## Step 12: Test Frontend

1. Visit `https://yourdomain.com`
2. Verify the homepage loads
3. Navigate to `/shop`, `/about`, `/contact`, `/login`, `/signup`
4. Refresh each page — should NOT return 404
5. Check browser console for errors

---

## Step 13: Test Authentication

1. Visit `https://yourdomain.com/login`
2. Try logging in with admin credentials
3. Verify you can access `https://yourdomain.com/admin`
4. Try signing up a new customer
5. Verify customer can log in and access `/account/orders`

---

## Step 14: Test Orders

1. Add a product to cart
2. Complete checkout
3. Verify order appears in admin dashboard
4. Verify customer can see order in `/account/orders`

---

## Security Checklist

- [ ] No `.env` files uploaded to `public_html/`
- [ ] No `node_modules/` in `public_html/`
- [ ] No `.git/` directory accessible publicly
- [ ] `CLIENT_URL` in backend `.env` matches your frontend domain
- [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are strong random strings
- [ ] SSL is enabled for both frontend and backend
- [ ] CORS only allows your actual domain (not `*`)
- [ ] File uploads directory is not publicly accessible (if sensitive)
- [ ] Backend is not in `public_html/`

---

## Troubleshooting

### Frontend shows 404 on refresh
- Check `.htaccess` is present in `public_html/`
- Verify Apache `mod_rewrite` is enabled
- Check File Manager didn't create a `dist/` subfolder

### API requests fail with CORS error
- Verify `CLIENT_URL` in backend `.env` matches `https://yourdomain.com`
- Check backend logs in cPanel Node.js App
- Ensure SSL is active on both domains

### Backend won't start
- Check Node.js version compatibility
- Verify `DATABASE_URL` is correct
- Check cPanel Node.js App logs for errors
- Ensure `npm install --production` completed successfully

### Images don't load
- Verify Cloudinary credentials in backend `.env`
- Check that uploads directory has correct permissions
- Ensure Cloudinary CDN is accessible

---

## What NOT to Upload to public_html/

```
node_modules/
.git/
.env
package.json
package-lock.json
server.js
src/
prisma/
uploads/
any .js files (except those in assets/)
```

---

## Support

For deployment issues:
1. Check cPanel Node.js App logs
2. Check Apache error logs in cPanel
3. Verify environment variables are set correctly
4. Test API directly: `curl https://api.yourdomain.com/health`
