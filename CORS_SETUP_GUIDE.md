# CORS Setup Guide - Vite + Node.js + Docker

> Complete guide for configuring CORS between Vite dev server and Node.js backend

## Table of Contents

1. [Current Configuration Overview](#current-configuration-overview)
2. [Vite Dev Server Proxy](#vite-dev-server-proxy)
3. [Node.js CORS Configuration](#nodejs-cors-configuration)
4. [Docker Networking](#docker-networking)
5. [Production CORS](#production-cors)
6. [Testing CORS Setup](#testing-cors-setup)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## Current Configuration Overview

### Your Setup

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Environment                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Browser                                                      │
│     │                                                         │
│     ├─> http://localhost:8080  (Vite Dev Server)            │
│     │        │                                                │
│     │        ├─> /api/*  ──────────────┐                    │
│     │        │   (proxied)              │                    │
│     │        │                          ▼                    │
│     │        │                  http://localhost:3000        │
│     │        │                  (Node.js Backend)            │
│     │        │                          │                    │
│     │        │                          ├─> PostgreSQL       │
│     │        │                          │   (localhost:5432) │
│     │        │                          │                    │
│     │        │                          └─> Redis            │
│     │        │                              (localhost:6379) │
│     │        │                                                │
│     │        └─> /ws  ───────────────────────────────────┐  │
│     │            (WebSocket proxy)                        │  │
│     │                                                     ▼  │
│     │                                             ws://localhost:3000
│     │                                             (WebSocket)  │
│     │                                                          │
└─────────────────────────────────────────────────────────────┘
```

### Issue Detected ⚠️

Your current backend CORS origin is set to `http://localhost:3001`, but Vite runs on port `8080`:

```env
# .env (INCORRECT)
CORS_ORIGIN=http://localhost:3001  ❌
```

**This needs to be:**

```env
# .env (CORRECT)
CORS_ORIGIN=http://localhost:8080  ✅
```

---

## Vite Dev Server Proxy

### 1. Basic Proxy Configuration

Your current `vite.config.ts` is well-configured:

```ts
// portfolio-ui/vite.config.ts
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::",      // Listen on all interfaces (IPv4 + IPv6)
      port: 8080,      // Vite dev server port
      
      proxy: {
        // API proxy
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,  // Changes the origin of the host header
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false,       // Accept self-signed certificates
        },
        
        // WebSocket proxy
        '/ws': {
          target: env.VITE_WS_URL || 'ws://localhost:3000',
          ws: true,           // Enable WebSocket proxying
          changeOrigin: true,
        },
      },
    },
  };
});
```

### 2. How the Proxy Works

#### Without Proxy (CORS Issues)

```tsx
// ❌ Browser makes request to different origin
fetch('http://localhost:3000/v1/projects')
  .then(res => res.json());

// Browser error:
// "Access to fetch at 'http://localhost:3000/v1/projects' from origin 
// 'http://localhost:8080' has been blocked by CORS policy"
```

#### With Proxy (No CORS Issues)

```tsx
// ✅ Browser makes request to same origin
fetch('/api/v1/projects')
  .then(res => res.json());

// Vite proxy:
// 1. Receives request at http://localhost:8080/api/v1/projects
// 2. Rewrites to http://localhost:3000/v1/projects
// 3. Forwards to backend
// 4. Returns response to browser
// 5. Browser sees same-origin request (no CORS!)
```

### 3. Advanced Proxy Configuration

#### Environment-Specific Proxies

```ts
// vite.config.ts
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Different backends for different environments
  const getApiTarget = () => {
    if (mode === 'staging') {
      return 'https://staging-api.yourportfolio.com';
    }
    if (mode === 'production') {
      return 'https://api.yourportfolio.com';
    }
    return env.VITE_API_URL || 'http://localhost:3000';
  };

  return {
    server: {
      proxy: {
        '/api': {
          target: getApiTarget(),
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: mode === 'production', // Only verify SSL in production
        },
      },
    },
  };
});
```

#### Multiple API Endpoints

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      // Main API
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1'),
      },
      
      // Analytics API (different service)
      '/analytics': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      
      // External API
      '/github': {
        target: 'https://api.github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/github/, ''),
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      },
    },
  },
});
```

#### WebSocket with Authentication

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
        changeOrigin: true,
        configure: (proxy, options) => {
          // Add custom WebSocket upgrade logic
          proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
            // Forward authentication headers
            const token = req.headers.cookie?.match(/token=([^;]+)/)?.[1];
            if (token) {
              proxyReq.setHeader('Authorization', `Bearer ${token}`);
            }
          });
          
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
        },
      },
    },
  },
});
```

### 4. Proxy Debugging

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        
        // Enable logging
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[Proxy]', req.method, req.url, '→', proxyReq.path);
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[Proxy]', proxyRes.statusCode, req.url);
          });
          
          proxy.on('error', (err, req, res) => {
            console.error('[Proxy Error]', err.message);
          });
        },
      },
    },
  },
});
```

---

## Node.js CORS Configuration

### 1. Fix Your Current CORS Origin

Update your `.env` file:

```env
# portfolio-api/.env
CORS_ORIGIN=http://localhost:8080
CORS_CREDENTIALS=true
```

### 2. Express/Fastify CORS Middleware

#### For Express

```ts
// src/index.ts
import express from 'express';
import cors from 'cors';
import { config } from './config';

const app = express();

// ✅ Basic CORS setup
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));
```

#### For Fastify (Your Stack)

```ts
// src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';

const fastify = Fastify({
  logger: true,
});

// ✅ Basic CORS setup
await fastify.register(cors, {
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 3. Environment-Specific Origins

#### Multiple Allowed Origins

```ts
// src/config/index.ts
const envSchema = z.object({
  CORS_ORIGIN: z.string().transform((val) => {
    // Support comma-separated origins
    return val.split(',').map(origin => origin.trim());
  }).default('http://localhost:8080'),
});

// src/index.ts
await fastify.register(cors, {
  origin: (origin, callback) => {
    const allowedOrigins = config.cors.origin;
    
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
});
```

#### Wildcard Pattern Matching

```ts
// src/index.ts
await fastify.register(cors, {
  origin: (origin, callback) => {
    // Allow all localhost ports in development
    if (config.nodeEnv === 'development' && origin?.match(/^http:\/\/localhost:\d+$/)) {
      callback(null, true);
      return;
    }
    
    // Allow your domains in production
    const allowedOrigins = [
      'https://yourportfolio.com',
      'https://www.yourportfolio.com',
      /\.yourportfolio\.com$/,  // Subdomains
    ];
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      return allowed.test(origin || '');
    });
    
    callback(null, isAllowed);
  },
  credentials: true,
});
```

### 4. Credentials Handling

#### Cookies and Authentication

```ts
await fastify.register(cors, {
  origin: config.cors.origin,
  credentials: true,  // ⚠️ Required for cookies/auth headers
  
  // Allow cookies in requests
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Cookie',
  ],
  
  // Expose headers to client
  exposedHeaders: [
    'Set-Cookie',
    'X-Total-Count',
    'X-Page-Count',
  ],
});
```

#### Frontend Cookie Configuration

```ts
// src/lib/http-client.ts
const httpClient = {
  async request(endpoint: string, options?: RequestInit) {
    return fetch(endpoint, {
      ...options,
      credentials: 'include',  // ✅ Send cookies with requests
    });
  },
};
```

### 5. Preflight Request Optimization

#### Caching Preflight Responses

```ts
await fastify.register(cors, {
  origin: config.cors.origin,
  credentials: true,
  
  // Cache preflight requests for 1 hour
  maxAge: 3600,
  
  // Optimize by allowing common headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
  ],
  
  // Allow all common methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
```

#### Handle OPTIONS Manually (Advanced)

```ts
// src/index.ts
fastify.addHook('onRequest', async (request, reply) => {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    reply
      .code(204)
      .header('Access-Control-Allow-Origin', config.cors.origin)
      .header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      .header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
      .header('Access-Control-Max-Age', '86400')
      .send();
    return;
  }
});
```

---

## Docker Networking

### 1. Current Docker Setup

Your `docker-compose.dev.yml` exposes services to the host:

```yaml
services:
  postgres:
    ports:
      - "5432:5432"  # Host:Container
      
  redis:
    ports:
      - "6379:6379"  # Host:Container
```

### 2. Container-to-Container Communication

When running backend in Docker, use service names:

#### Docker Compose with API

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: portfolio-db-dev
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: portfolio_db
    networks:
      - portfolio-network
    # ✅ No port mapping needed for internal communication
    expose:
      - "5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: portfolio-redis-dev
    networks:
      - portfolio-network
    expose:
      - "6379"
    volumes:
      - redis_dev_data:/data

  api:
    build:
      context: ./portfolio-api
      dockerfile: Dockerfile
    container_name: portfolio-api-dev
    environment:
      # ✅ Use service names for internal communication
      DATABASE_URL: "postgresql://postgres:postgres@postgres:5432/portfolio_db"
      REDIS_URL: "redis://redis:6379"
      REDIS_HOST: redis
      REDIS_PORT: 6379
      
      # ✅ CORS origin points to host machine
      CORS_ORIGIN: "http://localhost:8080"
      
      PORT: 3000
      HOST: "0.0.0.0"
    ports:
      - "3000:3000"  # Expose to host
    networks:
      - portfolio-network
    depends_on:
      - postgres
      - redis

networks:
  portfolio-network:
    driver: bridge

volumes:
  postgres_dev_data:
  redis_dev_data:
```

### 3. Host Machine Access Patterns

#### Scenario A: All Services on Host (Your Current Setup)

```
Browser (localhost:8080)
    ↓
Vite Dev Server (localhost:8080)
    ↓ /api/* → localhost:3000
Node.js Backend (localhost:3000)
    ↓
PostgreSQL (localhost:5432)
Redis (localhost:6379)
```

Environment variables:
```env
# Backend runs on host
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/portfolio_db
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:8080
```

#### Scenario B: Backend in Docker, DB/Redis in Docker

```
Browser (localhost:8080)
    ↓
Vite Dev Server (localhost:8080)
    ↓ /api/* → localhost:3000
Docker Container (api)
    ↓
PostgreSQL (postgres:5432 - internal)
Redis (redis:6379 - internal)
```

Environment variables:
```env
# Backend in container
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/portfolio_db
REDIS_URL=redis://redis:6379
CORS_ORIGIN=http://localhost:8080  # Still host machine
```

#### Scenario C: Frontend in Docker Too

```yaml
# docker-compose.dev.yml
services:
  frontend:
    build:
      context: ./portfolio-ui
      dockerfile: Dockerfile.dev
    container_name: portfolio-ui-dev
    ports:
      - "8080:8080"
    networks:
      - portfolio-network
    environment:
      # ✅ API URL uses service name
      VITE_API_URL: "http://api:3000"
      
  api:
    # ... (same as before)
    environment:
      # ✅ CORS origin uses service name
      CORS_ORIGIN: "http://frontend:8080"
```

### 4. Network Aliases for Services

```yaml
services:
  api:
    networks:
      portfolio-network:
        aliases:
          - backend
          - api
          - portfolio-api
    
  postgres:
    networks:
      portfolio-network:
        aliases:
          - db
          - database
```

Now you can use any alias:
```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/portfolio_db
DATABASE_URL=postgresql://postgres:postgres@database:5432/portfolio_db
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/portfolio_db
```

### 5. Docker Host Access

Access host machine from container:

```yaml
# docker-compose.dev.yml
services:
  api:
    extra_hosts:
      - "host.docker.internal:host-gateway"  # Linux
      # or for Windows/Mac:
      - "host.docker.internal:172.17.0.1"
```

```env
# Access service running on host from container
EXTERNAL_API_URL=http://host.docker.internal:8080
```

---

## Production CORS

### 1. Vite Build Considerations

#### Production Build Removes Proxy

```ts
// vite.config.ts
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  
  return {
    // ⚠️ Proxy ONLY works in development
    server: isDev ? {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    } : undefined,
    
    // ✅ In production, use full URLs
    build: {
      outDir: 'dist',
    },
  };
});
```

#### Production API URLs

```env
# .env.production
VITE_API_URL=https://api.yourportfolio.com
VITE_WS_URL=wss://api.yourportfolio.com
```

```ts
// src/config/env.ts
export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  
  // Helper to build full URLs
  apiEndpoint: (path: string) => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  },
};

// Usage
fetch(env.apiEndpoint('/v1/projects'));
```

### 2. Static File Serving

#### Serve from Backend

```ts
// src/index.ts
import path from 'path';
import { fastifyStatic } from '@fastify/static';

// Serve frontend static files
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../../portfolio-ui/dist'),
  prefix: '/',
});

// API routes
fastify.register(apiRoutes, { prefix: '/v1' });

// SPA fallback - serve index.html for all other routes
fastify.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith('/v1')) {
    reply.code(404).send({ error: 'Not Found' });
  } else {
    reply.sendFile('index.html');
  }
});
```

#### Separate Static Server

```nginx
# nginx.conf
server {
  listen 80;
  server_name yourportfolio.com;
  
  # Serve static files
  root /var/www/portfolio/dist;
  index index.html;
  
  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  # Proxy API requests
  location /v1 {
    proxy_pass http://api:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  
  # WebSocket proxy
  location /ws {
    proxy_pass http://api:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

### 3. CDN Configuration

#### CloudFlare Setup

```env
# Production environment
CORS_ORIGIN=https://yourportfolio.com,https://www.yourportfolio.com
```

```ts
// src/index.ts
await fastify.register(cors, {
  origin: config.cors.origins,  // Multiple origins
  credentials: true,
  
  // CloudFlare headers
  exposedHeaders: [
    'CF-Ray',
    'CF-Cache-Status',
  ],
});

// Trust CloudFlare IPs
fastify.addHook('onRequest', async (request, reply) => {
  // Get real IP from CloudFlare
  const realIP = request.headers['cf-connecting-ip'] || 
                 request.headers['x-forwarded-for'] || 
                 request.ip;
  
  request.ip = realIP as string;
});
```

#### CloudFlare Workers for CORS

```js
// cloudflare-worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': 'https://yourportfolio.com',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Max-Age': '86400',
    };
    
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers, status: 204 });
    }
    
    // Forward to API
    const response = await fetch(`https://api.yourportfolio.com${url.pathname}`, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    // Add CORS headers to response
    const newResponse = new Response(response.body, response);
    Object.entries(headers).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });
    
    return newResponse;
  },
};
```

### 4. Reverse Proxy Setup

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/portfolio
upstream api_backend {
  server localhost:3000;
  keepalive 32;
}

server {
  listen 80;
  server_name yourportfolio.com www.yourportfolio.com;
  
  # Redirect to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name yourportfolio.com www.yourportfolio.com;
  
  # SSL certificates
  ssl_certificate /etc/letsencrypt/live/yourportfolio.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/yourportfolio.com/privkey.pem;
  
  # Security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  
  # Frontend static files
  root /var/www/portfolio/dist;
  index index.html;
  
  # Gzip compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
  
  # API proxy
  location /v1 {
    proxy_pass http://api_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # CORS headers (if not handled by backend)
    # add_header 'Access-Control-Allow-Origin' 'https://yourportfolio.com' always;
    # add_header 'Access-Control-Allow-Credentials' 'true' always;
  }
  
  # WebSocket proxy
  location /ws {
    proxy_pass http://api_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
  }
  
  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

#### Traefik Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=you@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt
    networks:
      - portfolio-network

  api:
    image: portfolio-api:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.yourportfolio.com`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=3000"
      
      # CORS middleware
      - "traefik.http.middlewares.api-cors.headers.accesscontrolallowmethods=GET,POST,PUT,PATCH,DELETE,OPTIONS"
      - "traefik.http.middlewares.api-cors.headers.accesscontrolalloworigin=https://yourportfolio.com"
      - "traefik.http.middlewares.api-cors.headers.accesscontrolallowcredentials=true"
      - "traefik.http.routers.api.middlewares=api-cors"
    networks:
      - portfolio-network
    environment:
      CORS_ORIGIN: "https://yourportfolio.com"

  frontend:
    image: nginx:alpine
    volumes:
      - ./portfolio-ui/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`yourportfolio.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
    networks:
      - portfolio-network

networks:
  portfolio-network:
    driver: bridge

volumes:
  letsencrypt:
```

---

## Testing CORS Setup

### 1. Local Network Testing

#### Test from Different Devices on Same Network

```bash
# Find your local IP
# Windows
ipconfig | findstr IPv4

# macOS/Linux
ifconfig | grep "inet "

# Example: 192.168.1.100
```

Update Vite config:
```ts
// vite.config.ts
export default defineConfig({
  server: {
    host: '0.0.0.0',  // Listen on all interfaces
    port: 8080,
  },
});
```

Update backend CORS:
```env
# .env
CORS_ORIGIN=http://192.168.1.100:8080,http://localhost:8080
```

Access from phone/tablet:
```
http://192.168.1.100:8080
```

### 2. Different Browser Testing

#### Chrome DevTools

```js
// Console
fetch('/api/v1/projects')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Check Network tab:
// - Request headers
// - Response headers (Access-Control-Allow-Origin)
// - Preflight OPTIONS request
```

#### Firefox Developer Tools

```
F12 → Network → Filter by XHR → Look for:
- Access-Control-Allow-Origin
- Access-Control-Allow-Credentials
- Access-Control-Allow-Methods
```

#### Safari Web Inspector

```
Develop → Show Web Inspector → Network
- Check CORS headers
- Look for security errors
```

### 3. Mobile Device Testing

#### iOS Safari

```bash
# Enable Web Inspector on iOS
Settings → Safari → Advanced → Web Inspector

# Connect iPhone to Mac
# Safari → Develop → [Your iPhone] → [Your Page]
```

#### Android Chrome

```bash
# Enable USB Debugging
Settings → Developer Options → USB Debugging

# Chrome DevTools
chrome://inspect#devices
```

#### Mobile-Specific CORS Issues

```ts
// Handle iOS Safari cookie issues
// src/lib/http-client.ts
const httpClient = {
  async request(url: string, options?: RequestInit) {
    return fetch(url, {
      ...options,
      credentials: 'include',
      
      // iOS Safari workaround
      headers: {
        ...options?.headers,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
  },
};
```

### 4. Incognito Mode Testing

Tests without cached cookies/storage:

```bash
# Chrome Incognito
Ctrl+Shift+N (Windows/Linux)
Cmd+Shift+N (Mac)

# Firefox Private Window
Ctrl+Shift+P (Windows/Linux)
Cmd+Shift+P (Mac)

# Safari Private Window
Cmd+Shift+N (Mac)
```

#### What to Test

```ts
// 1. Fresh authentication
localStorage.clear();
sessionStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC";
});

// 2. CORS without credentials
fetch('/api/v1/projects')
  .then(r => r.json())
  .then(console.log);

// 3. CORS with credentials
fetch('/api/v1/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);
```

### 5. Automated CORS Testing

```ts
// tests/cors.test.ts
import { describe, it, expect } from 'vitest';

describe('CORS Configuration', () => {
  it('should allow requests from localhost:8080', async () => {
    const response = await fetch('http://localhost:3000/v1/health', {
      headers: {
        'Origin': 'http://localhost:8080',
      },
    });
    
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:8080');
    expect(response.headers.get('access-control-allow-credentials')).toBe('true');
  });
  
  it('should handle preflight requests', async () => {
    const response = await fetch('http://localhost:3000/v1/projects', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8080',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
      },
    });
    
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-methods')).toContain('POST');
  });
  
  it('should reject requests from unknown origins', async () => {
    const response = await fetch('http://localhost:3000/v1/health', {
      headers: {
        'Origin': 'http://evil-site.com',
      },
    });
    
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});
```

---

## Troubleshooting Common Issues

### 1. Vite HMR with API Calls

#### Problem: HMR Breaks After API Call

```tsx
// ❌ Problem: Creating new client on every render
function Component() {
  const client = new ApiClient(); // New instance each render
  const { data } = useQuery(['data'], () => client.get());
}
```

```tsx
// ✅ Solution: Create client outside component
const apiClient = new ApiClient();

function Component() {
  const { data } = useQuery(['data'], () => apiClient.get());
}
```

#### Problem: Proxy Not Working After HMR

```bash
# Restart Vite dev server
Ctrl+C
npm run dev
```

### 2. WebSocket Connections

#### Problem: WebSocket Fails After Deployment

```ts
// ❌ Wrong: Hardcoded localhost
const ws = new WebSocket('ws://localhost:3000/ws');

// ✅ Correct: Use environment variable
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
const ws = new WebSocket(wsUrl);

// ✅ Better: Auto-detect protocol
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
const ws = new WebSocket(wsUrl);
```

#### WebSocket with Vite Proxy

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,  // ✅ Required for WebSocket
        changeOrigin: true,
        
        // Debug WebSocket issues
        configure: (proxy, options) => {
          proxy.on('upgrade', (req, socket, head) => {
            console.log('[WS] Upgrading connection...');
          });
          
          proxy.on('error', (err) => {
            console.error('[WS Error]', err);
          });
        },
      },
    },
  },
});
```

### 3. Cookie/Session Issues

#### Problem: Cookies Not Being Sent

```ts
// ❌ Missing credentials
fetch('/api/v1/auth/me')
  .then(r => r.json());

// ✅ Include credentials
fetch('/api/v1/auth/me', {
  credentials: 'include',  // Send cookies
})
  .then(r => r.json());
```

#### Problem: SameSite Cookie Blocking

```ts
// Backend: Set cookie with correct SameSite
fastify.get('/login', async (request, reply) => {
  reply.setCookie('token', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
});
```

#### Problem: Third-Party Cookie Blocking

```env
# Development: Use same domain
# Frontend: http://localhost:8080
# Backend:  http://localhost:3000
# ✅ Works - same domain (localhost)

# Production: Use subdomains
# Frontend: https://www.yourportfolio.com
# Backend:  https://api.yourportfolio.com
# ✅ Works - same base domain (.yourportfolio.com)
```

### 4. HTTPS Development Setup

#### Generate Self-Signed Certificate

```bash
# Create certs directory
mkdir -p certs
cd certs

# Generate certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Org/CN=localhost"
```

#### Configure Vite for HTTPS

```ts
// vite.config.ts
import fs from 'fs';
import path from 'path';

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/cert.pem')),
    },
    host: '0.0.0.0',
    port: 8080,
  },
});
```

#### Configure Backend for HTTPS

```ts
// src/index.ts
import fs from 'fs';
import path from 'path';

const fastify = Fastify({
  https: config.nodeEnv === 'development' ? {
    key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem')),
  } : undefined,
});
```

#### Update Environment

```env
# .env.local (frontend)
VITE_API_URL=https://localhost:3000

# .env (backend)
CORS_ORIGIN=https://localhost:8080
```

### 5. Docker Networking Issues

#### Problem: Cannot Connect to Host Services

```yaml
# docker-compose.dev.yml
services:
  api:
    # ✅ Add extra_hosts
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      DATABASE_URL: "postgresql://postgres:postgres@host.docker.internal:5432/portfolio_db"
```

#### Problem: Services Can't Find Each Other

```bash
# Check if services are on same network
docker network ls
docker network inspect portfolio-api_default

# Ensure services are on same network
docker-compose ps
```

#### Problem: Port Already in Use

```bash
# Find what's using the port
# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000

# Kill the process
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>
```

---

## Quick Fix Checklist

### ✅ Development Setup

```bash
# 1. Fix CORS origin in backend
# portfolio-api/.env
CORS_ORIGIN=http://localhost:8080  # ✅ Match Vite port

# 2. Check Vite proxy
# portfolio-ui/vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',  # ✅ Backend port
      changeOrigin: true,
    },
  },
}

# 3. Use relative URLs in code
fetch('/api/v1/projects')  # ✅ Proxied
# Not: fetch('http://localhost:3000/v1/projects')  # ❌ CORS error

# 4. Include credentials
fetch('/api/v1/auth/me', { credentials: 'include' })  # ✅

# 5. Check both servers are running
# Terminal 1:
cd portfolio-api && npm run dev  # Port 3000

# Terminal 2:
cd portfolio-ui && npm run dev   # Port 8080
```

### ✅ Production Setup

```bash
# 1. Update production origins
# portfolio-api/.env.production
CORS_ORIGIN=https://yourportfolio.com,https://www.yourportfolio.com

# 2. Use full URLs in production
# portfolio-ui/.env.production
VITE_API_URL=https://api.yourportfolio.com

# 3. Configure reverse proxy (Nginx/Traefik)
# See sections above

# 4. Enable HTTPS
# Use Let's Encrypt certificates

# 5. Test CORS headers
curl -H "Origin: https://yourportfolio.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.yourportfolio.com/v1/projects
```

---

## Action Required 🎯

**Fix your CORS origin NOW:**

```bash
# Edit portfolio-api/.env
nano portfolio-api/.env
```

Change:
```env
CORS_ORIGIN=http://localhost:3001  # ❌ Wrong port
```

To:
```env
CORS_ORIGIN=http://localhost:8080  # ✅ Correct port (matches Vite)
```

Then restart your backend:
```bash
cd portfolio-api
npm run dev
```

Your CORS issues should be resolved! 🎉
