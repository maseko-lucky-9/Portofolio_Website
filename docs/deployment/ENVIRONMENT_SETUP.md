# Environment Configuration Guide

This guide explains how to configure the environment for connecting the Portfolio UI (Vite/React) frontend with the Portfolio API (Node.js/PostgreSQL/Redis) backend.

## Quick Start

### 1. Start Infrastructure (Docker)

```bash
# From portfolio-api directory
cd portfolio-api
docker-compose -f docker-compose.dev.yml up -d
```

This starts PostgreSQL and Redis containers.

### 2. Configure Backend

```bash
# Copy the example env file (already done)
cp .env.example .env

# Edit .env with your settings
# The defaults should work for local development
```

### 3. Configure Frontend

```bash
# The .env.local file has been created
# Edit if needed (defaults work with local backend)
cd portfolio-ui
```

### 4. Start Both Servers

```bash
# Terminal 1 - Backend
cd portfolio-api
npm run dev

# Terminal 2 - Frontend
cd portfolio-ui
npm run dev
```

---

## Frontend Configuration (.env.local)

Location: `portfolio-ui/.env.local`

### Required Variables

```env
# API Configuration
VITE_API_URL=http://localhost:3000      # Backend URL
VITE_API_VERSION=v1                      # API version prefix

# WebSocket (for real-time features)
VITE_WS_URL=ws://localhost:3000

# App Configuration
VITE_APP_NAME=Portfolio
VITE_APP_DESCRIPTION=My Portfolio Website

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CODE_EXECUTION=true
VITE_ENABLE_COMMENTS=true

# Debug Mode
VITE_DEBUG=true
```

### TypeScript Types

Types are defined in `src/vite-env.d.ts`:

```typescript
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_VERSION: string;
  // ... more types
}
```

### Using Environment Variables

```typescript
// ❌ Don't use process.env
console.log(process.env.API_URL);

// ✅ Use import.meta.env
console.log(import.meta.env.VITE_API_URL);

// ✅ Better: Use the config module
import { env, apiUrl } from '@/config/env';
console.log(env.apiUrl);
console.log(apiUrl('/projects')); // http://localhost:3000/v1/projects
```

### Vite Environment Loading Order

1. `.env` - Loaded in all cases
2. `.env.local` - Loaded in all cases, ignored by git
3. `.env.[mode]` - Only loaded in specified mode
4. `.env.[mode].local` - Only loaded in specified mode, ignored by git

Priority: `.env.local` > `.env`

---

## Backend Configuration (.env)

Location: `portfolio-api/.env`

### Database Connection (PostgreSQL)

```env
# Local development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/portfolio_db?schema=public"

# Docker (internal network)
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/portfolio_db?schema=public"

# Production (with SSL)
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&sslmode=require"
```

### Redis Configuration

```env
# Local development
REDIS_URL="redis://localhost:6379"

# With password
REDIS_URL="redis://:password@localhost:6379"

# Docker
REDIS_URL="redis://redis:6379"
```

### CORS Settings

**Important:** The CORS origin must match your Vite dev server URL.

```env
# For Vite dev server on port 8080
CORS_ORIGIN=http://localhost:8080
CORS_CREDENTIALS=true
```

### JWT/Authentication

```env
# Generate a secure secret:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-64-character-hex-string-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

---

## Verification Steps

### 1. Check Environment Variables Load (Frontend)

Add the `EnvCheck` component temporarily:

```tsx
// In App.tsx
import { EnvCheck } from '@/components/EnvCheck';

function App() {
  return (
    <>
      {/* Your app */}
      <EnvCheck />
    </>
  );
}
```

Or check in browser console:
```javascript
console.log(import.meta.env);
```

### 2. TypeScript Compilation Check (Frontend)

```bash
cd portfolio-ui
npm run build
```

No errors = types are correct.

### 3. Backend Connection Test

```bash
cd portfolio-api
npx ts-node scripts/verify-env.ts
```

Or test manually:
```bash
curl http://localhost:3000/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-11T...",
  "environment": "development"
}
```

### 4. Cross-Origin Setup Verification

1. Start both servers
2. Open frontend in browser (http://localhost:8080)
3. Open DevTools → Network tab
4. Make an API request
5. Check for CORS errors

If you see CORS errors:
- Verify `CORS_ORIGIN` in backend `.env` matches frontend URL
- Ensure credentials are enabled on both sides

---

## Docker Networking

### Development with Docker

When running the API inside Docker but the frontend outside:

```env
# Backend .env (inside Docker)
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/portfolio_db?schema=public"
REDIS_URL="redis://redis:6379"
CORS_ORIGIN=http://localhost:8080

# Frontend .env.local (outside Docker)
VITE_API_URL=http://localhost:3000
```

### Full Docker Setup

```yaml
# docker-compose.yml
services:
  api:
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/portfolio_db
      REDIS_URL: redis://redis:6379
      CORS_ORIGIN: http://localhost:8080
    networks:
      - portfolio-network

  postgres:
    networks:
      - portfolio-network

  redis:
    networks:
      - portfolio-network

networks:
  portfolio-network:
    driver: bridge
```

### PostgreSQL Connection Pooling

The Prisma client handles connection pooling automatically. For high-traffic:

```env
# Add connection pool settings to DATABASE_URL
DATABASE_URL="postgresql://...?connection_limit=20&pool_timeout=10"
```

---

## Common Issues

### CORS Errors

```
Access to fetch has been blocked by CORS policy
```

**Fix:** Ensure `CORS_ORIGIN` in backend matches your frontend URL exactly.

### Database Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Fix:** 
1. Ensure PostgreSQL is running: `docker ps`
2. Check the host in `DATABASE_URL` (use `localhost` outside Docker)

### Redis Connection Failed

```
Redis connection to localhost:6379 failed
```

**Fix:**
1. Ensure Redis is running: `docker ps`
2. Check `REDIS_URL` configuration

### Environment Variables Not Loading

**Frontend:** Only variables prefixed with `VITE_` are exposed to the client.

**Backend:** Ensure `.env` file is in the project root and `dotenv` is configured.

---

## Production Checklist

- [ ] Use strong, unique `JWT_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Use SSL for database connections
- [ ] Configure Redis password
- [ ] Set `CORS_ORIGIN` to production frontend URL
- [ ] Disable `DEMO_MODE` and `VITE_DEBUG`
- [ ] Use environment variables from hosting platform (not `.env` files)
