# Agent Instructions

## Lint Commands
- Frontend: `npx eslint src/ --max-warnings=0`
- Backend: `npx eslint src/ --max-warnings=0` (from `backend/` directory)
- Shared: `npx vitest run` (frontend tests), `npx jest` (backend tests)

## Typecheck
- Frontend build: `npx vite build`
- Backend syntax: `node --check <file>` for each modified file

## Test Commands
- Frontend: `npx vitest run`
- Backend: `npx jest --config jest.config.js` (requires database connection)
