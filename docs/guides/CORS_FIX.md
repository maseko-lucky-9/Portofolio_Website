# CORS Setup - Quick Reference

## ✅ Configuration Fixed

### Backend CORS Origin Updated

**File:** `portfolio-api/.env`

```env
# Before (WRONG)
CORS_ORIGIN=http://localhost:3001  ❌

# After (CORRECT)
CORS_ORIGIN=http://localhost:8080  ✅
```

**Why this matters:**
- Your Vite dev server runs on port **8080**
- Backend CORS must allow requests from **8080**
- Mismatch causes "CORS policy" errors in browser

---

## 📋 Complete Configuration

### Frontend (Vite) - `portfolio-ui/vite.config.ts`

```ts
export default defineConfig({
  server: {
    host: "::",
    port: 8080,  // ← Frontend port
    
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // ← Backend port
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
```

### Backend (Node.js) - `portfolio-api/.env`

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

CORS_ORIGIN=http://localhost:8080
CORS_CREDENTIALS=true
```

### Docker Services - `portfolio-api/docker-compose.dev.yml`

```yaml
services:
  postgres:
    ports:
      - "5432:5432"  # PostgreSQL
      
  redis:
    ports:
      - "6379:6379"  # Redis
```

---

## 🚀 Start Development Servers

### 1. Start Docker Containers

```bash
cd portfolio-api
docker-compose -f docker-compose.dev.yml up -d

# Verify containers are running
docker ps
```

### 2. Start Backend

```bash
cd portfolio-api
npm run dev

# Should show:
# Server listening on http://0.0.0.0:3000
```

### 3. Start Frontend

```bash
cd portfolio-ui
npm run dev

# Should show:
# VITE ready in X ms
# ➜ Local:   http://localhost:8080/
```

### 4. Open Browser

```
http://localhost:8080
```

---

## 🧪 Test CORS Setup

### Option 1: Automated Test Script

```bash
# From project root
node test-cors.js

# Expected output:
# ✅ CORS origin matches frontend
# ✅ Preflight request successful
# ✅ Credentials allowed
# ✅ Wrong origin correctly rejected
```

### Option 2: Browser Console

```javascript
// Open http://localhost:8080
// Open DevTools Console (F12)

// Test 1: Health check
fetch('/api/v1/health')
  .then(r => r.json())
  .then(console.log);
// Should return: { status: 'ok', ... }

// Test 2: Projects API
fetch('/api/v1/projects?limit=5')
  .then(r => r.json())
  .then(console.log);
// Should return: { data: [...], pagination: {...} }

// Test 3: With credentials
fetch('/api/v1/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);
```

### Option 3: Network Tab Check

1. Open DevTools (F12)
2. Go to Network tab
3. Make an API request
4. Check response headers:
   ```
   access-control-allow-origin: http://localhost:8080 ✅
   access-control-allow-credentials: true ✅
   ```

---

## ❌ Common Issues & Solutions

### Issue 1: "CORS policy" Error

```
Access to fetch at 'http://localhost:3000/v1/projects' from origin 
'http://localhost:8080' has been blocked by CORS policy
```

**Solution:**
```bash
# Check backend .env
cat portfolio-api/.env | grep CORS_ORIGIN
# Should show: CORS_ORIGIN=http://localhost:8080

# If wrong, fix it and restart backend
```

### Issue 2: Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Issue 3: Proxy Not Working

**Symptoms:**
- `/api/v1/projects` returns 404
- No CORS errors (because it's same-origin)

**Solution:**
```bash
# Restart Vite dev server
Ctrl+C
npm run dev
```

### Issue 4: Cookies Not Working

**Symptoms:**
- Login works but `/api/v1/auth/me` returns 401

**Solution:**
```ts
// Ensure credentials are included
fetch('/api/v1/auth/me', {
  credentials: 'include',  // ← Required!
})
```

### Issue 5: Docker Containers Not Running

```bash
# Check container status
docker ps

# If not running, start them
cd portfolio-api
docker-compose -f docker-compose.dev.yml up -d

# Check logs if issues
docker logs portfolio-db-dev
docker logs portfolio-redis-dev
```

---

## 📡 Request Flow

### Development (With Proxy)

```
Browser
  ↓ GET http://localhost:8080/api/v1/projects
Vite Dev Server (port 8080)
  ↓ Proxy rewrites to: http://localhost:3000/v1/projects
Node.js Backend (port 3000)
  ↓ Returns data with CORS headers
Vite Dev Server
  ↓ Forwards response
Browser ✅ (Same origin, no CORS!)
```

### Production (No Proxy)

```
Browser
  ↓ GET https://api.yourportfolio.com/v1/projects
  ↓ Origin: https://yourportfolio.com
Node.js Backend
  ↓ Checks CORS_ORIGIN
  ↓ Adds header: Access-Control-Allow-Origin: https://yourportfolio.com
Browser ✅ (CORS header present)
```

---

## 🔒 Security Best Practices

### Development

```env
# .env (development)
CORS_ORIGIN=http://localhost:8080
CORS_CREDENTIALS=true
```

### Production

```env
# .env.production
CORS_ORIGIN=https://yourportfolio.com,https://www.yourportfolio.com
CORS_CREDENTIALS=true
```

**Never use:**
```env
CORS_ORIGIN=*  # ❌ Insecure! Allows any origin
```

---

## 📚 Additional Resources

- [CORS Setup Guide](./CORS_SETUP_GUIDE.md) - Complete documentation
- [Data Fetching Guide](./portfolio-ui/DATA_FETCHING_GUIDE.md) - React patterns
- [API Service Layer](./portfolio-ui/API_SERVICE_LAYER.md) - Service docs
- [Environment Setup](./portfolio-ui/ENVIRONMENT_SETUP.md) - Env vars

---

## ⚡ Quick Commands

```bash
# Start everything
docker-compose -f portfolio-api/docker-compose.dev.yml up -d
cd portfolio-api && npm run dev &
cd portfolio-ui && npm run dev

# Stop everything
# Ctrl+C in both terminal windows
docker-compose -f portfolio-api/docker-compose.dev.yml down

# Test CORS
node test-cors.js

# Check what's running
netstat -ano | findstr ":3000 :8080 :5432 :6379"
```

---

## ✅ Checklist

Before starting development:

- [ ] Docker containers running (PostgreSQL, Redis)
- [ ] Backend `.env` has `CORS_ORIGIN=http://localhost:8080`
- [ ] Backend server running on port 3000
- [ ] Frontend server running on port 8080
- [ ] CORS test passes (run `node test-cors.js`)
- [ ] Can access http://localhost:8080 in browser
- [ ] API calls work (check browser console)

---

**Your CORS is now properly configured! 🎉**

If you still see CORS errors:
1. Verify backend `.env` has correct CORS_ORIGIN
2. Restart backend server
3. Run `node test-cors.js` to diagnose
4. Check browser console for specific error
