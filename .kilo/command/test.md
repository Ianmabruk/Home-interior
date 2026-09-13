# Test

Run all tests (frontend + backend).

```bash
# Frontend tests (Vitest)
cd /home/ian-mabruk/home && npx vitest run

# Backend tests (Jest — requires Neon database connection)
cd /home/ian-mabruk/home/backend && NODE_OPTIONS='--experimental-vm-modules' \
  npx jest --config jest.config.js --runInBand --forceExit
```

Notes:
- Backend tests make real Cloudinary API uploads (SVG → Cloudinary) and hit the
  production Neon Postgres cluster.  Some tests are slow (8–20 s each) due to
  real network calls.  The database on the Neon free tier can be intermittently
  unavailable — retry after 30 s if you see `P1001` / connection errors.
- Frontend tests run in jsdom and do not require a database.
