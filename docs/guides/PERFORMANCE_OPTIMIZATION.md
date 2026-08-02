# Performance Optimization Strategy

Comprehensive performance optimization guide for the Vite/React + Fastify + PostgreSQL portfolio stack.

---

## Table of Contents

1. [Frontend Optimization (Vite/React)](#frontend-optimization)
2. [Backend Optimization (Node.js/Fastify)](#backend-optimization)
3. [Database Optimization (PostgreSQL)](#database-optimization)
4. [Network & Caching](#network-optimization)
5. [Monitoring & Profiling](#monitoring)
6. [Build & Deployment](#build-optimization)
7. [Mobile Performance](#mobile-performance)
8. [Production Readiness](#production-readiness)

---

## Frontend Optimization (Vite/React)

### Code Splitting & Lazy Loading

**Route-based Code Splitting**

In `portfolio-ui/src/App.tsx`:

```tsx
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// Lazy load route components
const Home = lazy(() => import("./pages/Home"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Blog = lazy(() => import("./pages/Blog"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    </Suspense>
  );
}
```

**Component-level Code Splitting**

```tsx
// Only load heavy components when needed
const CodeEditor = lazy(() => import("@monaco-editor/react"));
const Chart = lazy(() => import("./components/Chart"));

function ProjectDemo() {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div>
      <button onClick={() => setShowEditor(true)}>Show Code</button>
      {showEditor && (
        <Suspense fallback={<Skeleton />}>
          <CodeEditor />
        </Suspense>
      )}
    </div>
  );
}
```

**Vendor Chunk Splitting**

Update `portfolio-ui/vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-toast",
          ],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          utils: ["date-fns", "clsx", "tailwind-merge"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
```

### Bundle Analysis

**Install analyzer**:

```bash
npm install --save-dev rollup-plugin-visualizer
```

**Update `vite.config.ts`**:

```typescript
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      filename: "dist/stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

**Run analysis**:

```bash
npm run build
# Opens bundle visualization in browser
```

### Image Optimization

**Install Vite image plugin**:

```bash
npm install --save-dev vite-plugin-image-optimizer
```

**Configure in `vite.config.ts`**:

```typescript
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { quality: 80 },
    }),
  ],
});
```

**Responsive Images Component**:

```tsx
// src/components/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  sizes,
  className,
}: OptimizedImageProps) {
  const srcSet = [
    `${src}?w=400 400w`,
    `${src}?w=800 800w`,
    `${src}?w=1200 1200w`,
  ].join(", ");

  return (
    <img
      src={`${src}?w=800`}
      srcSet={srcSet}
      sizes={sizes || "(max-width: 768px) 400px, 800px"}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}
```

### Font Loading Strategy

**Preload critical fonts** in `index.html`:

```html
<head>
  <!-- Preconnect to font CDN -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

  <!-- Preload critical font -->
  <link
    rel="preload"
    href="/fonts/inter-variable.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />

  <!-- Font CSS with display swap -->
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
</head>
```

**CSS font-display**:

```css
/* src/index.css */
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-variable.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap; /* Prevents invisible text */
}
```

### React Performance Optimizations

**Memoization**:

```tsx
import { memo, useMemo, useCallback } from "react";

// Memoize expensive components
const ProjectCard = memo(({ project }) => {
  return <div>...</div>;
});

// Memoize expensive calculations
function ProjectList({ projects }) {
  const sortedProjects = useMemo(
    () => projects.sort((a, b) => b.date - a.date),
    [projects]
  );

  const handleClick = useCallback((id) => {
    // Stable callback reference
  }, []);

  return sortedProjects.map((p) => (
    <ProjectCard key={p.id} project={p} onClick={handleClick} />
  ));
}
```

**Virtual Scrolling for Long Lists**:

```bash
npm install @tanstack/react-virtual
```

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function LongList({ items }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  return (
    <div ref={parentRef} style={{ height: "600px", overflow: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Backend Optimization (Node.js/Fastify)

### Connection Pooling for PostgreSQL

**Configure in `portfolio-api/src/config/database.ts`**:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

// Connection pool settings via environment
// DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=20
```

**Update `.env`**:

```bash
# Optimized for production
DATABASE_URL=postgresql://user:pass@host:5432/portfolio_db?connection_limit=20&pool_timeout=20&connect_timeout=10

# Redis connection pool
REDIS_MAX_CLIENTS=50
```

### Redis Caching Strategy

**Create `portfolio-api/src/services/cache.service.ts`**:

```typescript
import { redis } from "../config/redis";

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // For cache invalidation
}

export class CacheService {
  /**
   * Get cached value with automatic JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Set cache with TTL
   */
  async set(
    key: string,
    value: any,
    options: CacheOptions = {}
  ): Promise<void> {
    const { ttl = 3600 } = options;
    await redis.setex(key, ttl, JSON.stringify(value));

    // Store tags for invalidation
    if (options.tags) {
      for (const tag of options.tags) {
        await redis.sadd(`tag:${tag}`, key);
      }
    }
  }

  /**
   * Invalidate by tag
   */
  async invalidateTag(tag: string): Promise<void> {
    const keys = await redis.smembers(`tag:${tag}`);
    if (keys.length > 0) {
      await redis.del(...keys);
      await redis.del(`tag:${tag}`);
    }
  }

  /**
   * Cache aside pattern
   */
  async remember<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const value = await fetcher();
    await this.set(key, value, options);
    return value;
  }
}

export const cacheService = new CacheService();
```

**Use in routes**:

```typescript
// portfolio-api/src/routes/v1/project.routes.ts
import { cacheService } from "../../services/cache.service";

fastify.get("/projects", async (request, reply) => {
  const cacheKey = "projects:published";

  const projects = await cacheService.remember(
    cacheKey,
    async () => {
      return prisma.project.findMany({
        where: { status: "PUBLISHED" },
        select: { id: true, title: true, slug: true, thumbnail: true },
        orderBy: { publishedAt: "desc" },
      });
    },
    { ttl: 600, tags: ["projects"] } // 10 minutes
  );

  return { success: true, data: projects };
});

// Invalidate on update
fastify.post("/projects", async (request, reply) => {
  const project = await prisma.project.create({ data: request.body });

  // Invalidate cache
  await cacheService.invalidateTag("projects");

  return { success: true, data: project };
});
```

### Query Optimization

**Use select to limit fields**:

```typescript
// ❌ Bad - fetches all fields
const projects = await prisma.project.findMany();

// ✅ Good - only needed fields
const projects = await prisma.project.findMany({
  select: {
    id: true,
    title: true,
    slug: true,
    thumbnail: true,
  },
});
```

**Use pagination**:

```typescript
fastify.get("/projects", async (request) => {
  const { page = 1, limit = 10 } = request.query;
  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      skip,
      take: limit,
      where: { status: "PUBLISHED" },
    }),
    prisma.project.count({ where: { status: "PUBLISHED" } }),
  ]);

  return {
    success: true,
    data: projects,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
});
```

**Avoid N+1 queries with include**:

```typescript
// ❌ Bad - N+1 queries
const projects = await prisma.project.findMany();
for (const project of projects) {
  project.tags = await prisma.projectTag.findMany({
    where: { projectId: project.id },
  });
}

// ✅ Good - single query with joins
const projects = await prisma.project.findMany({
  include: {
    tags: {
      include: {
        tag: true,
      },
    },
  },
});
```

### Response Compression

**Install compression**:

```bash
npm install --save @fastify/compress
```

**Configure in `portfolio-api/src/index.ts`**:

```typescript
import compress from "@fastify/compress";

await app.register(compress, {
  global: true,
  threshold: 1024, // Only compress responses > 1KB
  encodings: ["gzip", "deflate", "br"], // Brotli for best compression
});
```

### Response Streaming for Large Data

```typescript
import { Readable } from "stream";

fastify.get("/analytics/export", async (request, reply) => {
  const stream = new Readable({
    async read() {
      // Fetch data in chunks
      const chunk = await prisma.analyticsEvent.findMany({
        skip: this.offset,
        take: 1000,
      });

      if (chunk.length === 0) {
        this.push(null); // End stream
      } else {
        this.push(JSON.stringify(chunk));
        this.offset += 1000;
      }
    },
  });

  stream.offset = 0;
  reply.type("application/json").send(stream);
});
```

---

## Database Optimization (PostgreSQL)

### Index Optimization

**Analyze slow queries** in `portfolio-api/prisma/schema.prisma`:

```prisma
model Project {
  id        String  @id @default(uuid())
  slug      String  @unique
  status    ProjectStatus
  featured  Boolean @default(false)

  // Add indexes for frequently queried fields
  @@index([status])              // For filtering by status
  @@index([featured])            // For featured projects
  @@index([publishedAt])         // For sorting
  @@index([status, featured])    // Composite for combined queries
  @@map("projects")
}

model Article {
  id     String @id @default(uuid())
  slug   String @unique
  status ArticleStatus

  @@index([status, publishedAt(sort: Desc)]) // Optimized for common query
  @@map("articles")
}
```

**Create indexes in SQL** for full-text search:

```sql
-- Create GIN index for full-text search on articles
CREATE INDEX idx_articles_search ON articles
USING GIN(to_tsvector('english', title || ' ' || content));

-- Create partial index for published projects only
CREATE INDEX idx_projects_published ON projects (published_at DESC)
WHERE status = 'PUBLISHED';
```

### Query Plan Analysis

**Enable query logging** in `.env`:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db?log_statements=all
```

**Analyze slow queries**:

```typescript
// Add to prisma client
const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});

prisma.$on("query", (e) => {
  if (e.duration > 100) {
    // Log queries taking > 100ms
    console.warn(`Slow query (${e.duration}ms): ${e.query}`);
  }
});
```

**Run EXPLAIN in development**:

```sql
EXPLAIN ANALYZE
SELECT * FROM projects
WHERE status = 'PUBLISHED' AND featured = true
ORDER BY published_at DESC
LIMIT 10;
```

### Connection Management

**Configure PgBouncer** for connection pooling (production):

```ini
# pgbouncer.ini
[databases]
portfolio_db = host=localhost port=5432 dbname=portfolio_db

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
```

**Update `DATABASE_URL`**:

```bash
# Connect through PgBouncer
DATABASE_URL=postgresql://user:pass@pgbouncer:6432/portfolio_db
```

### Partitioning for Analytics

**Partition analytics table by date**:

```sql
-- Create partitioned table
CREATE TABLE analytics_events_partitioned (
    id UUID,
    event_type VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    -- other fields
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE analytics_events_2024_01
PARTITION OF analytics_events_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE analytics_events_2024_02
PARTITION OF analytics_events_partitioned
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

---

## Network & Caching

### CDN Configuration for Vite Build

**Add cache headers in production server** (Vercel example):

```json
// vercel.json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

**Cloudflare CDN configuration**:

- Enable "Auto Minify" for HTML, CSS, JS
- Enable "Brotli" compression
- Set Browser Cache TTL: "Respect Existing Headers"
- Enable "Always Online"

### HTTP/2 Server Push (Fastify)

**Configure in `portfolio-api/src/index.ts`**:

```typescript
import fastifyHttp2 from "@fastify/http2";

const app = Fastify({
  http2: true,
  https: {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
  },
});
```

### API Response Caching Headers

```typescript
fastify.get("/api/v1/projects", async (request, reply) => {
  const projects = await getProjects();

  // Cache for 5 minutes
  reply.header("Cache-Control", "public, max-age=300, s-maxage=600");
  reply.header("ETag", generateETag(projects));

  return { success: true, data: projects };
});

// Handle conditional requests
fastify.addHook("onRequest", async (request, reply) => {
  const ifNoneMatch = request.headers["if-none-match"];
  if (ifNoneMatch) {
    // Check if content hasn't changed
    const currentETag = await getCurrentETag(request.url);
    if (ifNoneMatch === currentETag) {
      reply.code(304).send();
      return;
    }
  }
});
```

---

## Monitoring & Profiling

### Lighthouse CI Integration

**Install**:

```bash
npm install --save-dev @lhci/cli
```

**Create `lighthouserc.js`**:

```javascript
module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:5173/", "http://localhost:5173/projects"],
      numberOfRuns: 3,
    },
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "first-contentful-paint": ["error", { maxNumericValue: 2000 }],
        interactive: ["error", { maxNumericValue: 3500 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
```

**Add to CI pipeline** (`.github/workflows/performance.yml`):

```yaml
name: Performance CI

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run preview &
      - run: npx @lhci/cli@latest autorun
```

### Backend Performance Monitoring

**Install monitoring packages**:

```bash
npm install --save @fastify/metrics prom-client
```

**Configure in `portfolio-api/src/index.ts`**:

```typescript
import fastifyMetrics from "@fastify/metrics";

await app.register(fastifyMetrics, {
  endpoint: "/metrics",
  defaultMetrics: { enabled: true },
  routeMetrics: { enabled: true },
});
```

**Custom metrics**:

```typescript
import { Counter, Histogram } from "prom-client";

const projectViewCounter = new Counter({
  name: "project_views_total",
  help: "Total number of project views",
  labelNames: ["project_id"],
});

const dbQueryDuration = new Histogram({
  name: "db_query_duration_seconds",
  help: "Database query duration",
  labelNames: ["operation"],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
});

// Use in routes
fastify.get("/projects/:id", async (request) => {
  projectViewCounter.inc({ project_id: request.params.id });

  const end = dbQueryDuration.startTimer({ operation: "findProject" });
  const project = await prisma.project.findUnique({
    where: { id: request.params.id },
  });
  end();

  return project;
});
```

### Database Query Logging

**Create `portfolio-api/src/utils/query-logger.ts`**:

```typescript
import { Prisma } from "@prisma/client";

export const queryLogger: Prisma.LogDefinition = {
  level: "query",
  emit: "event",
};

export function setupQueryLogging(prisma: PrismaClient) {
  prisma.$on("query", async (e: Prisma.QueryEvent) => {
    console.log("Query: " + e.query);
    console.log("Duration: " + e.duration + "ms");

    // Alert on slow queries
    if (e.duration > 1000) {
      console.warn(`🐌 Slow query detected (${e.duration}ms):`, e.query);

      // Send to monitoring service
      await sendToMonitoring({
        type: "slow_query",
        duration: e.duration,
        query: e.query,
      });
    }
  });
}
```

### Real User Monitoring (RUM)

**Install web-vitals**:

```bash
npm install web-vitals
```

**Create `portfolio-ui/src/utils/vitals.ts`**:

```typescript
import { onCLS, onFID, onFCP, onLCP, onTTFB } from "web-vitals";

function sendToAnalytics(metric: any) {
  // Send to your analytics endpoint
  fetch("/api/v1/analytics/vitals", {
    method: "POST",
    body: JSON.stringify(metric),
    headers: { "Content-Type": "application/json" },
  });
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

**Use in `main.tsx`**:

```tsx
import { reportWebVitals } from "./utils/vitals";

if (import.meta.env.PROD) {
  reportWebVitals();
}
```

---

## Build Optimization

### Vite Build Configuration

**Complete optimized `vite.config.ts`**:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer(),
    visualizer({ open: false, filename: "dist/stats.html" }),
  ],
  build: {
    target: "es2020",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            if (id.includes("@radix-ui")) {
              return "ui-vendor";
            }
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
```

### Docker Layer Caching

**Optimized `Dockerfile` for `portfolio-api`**:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (cached layer)
COPY package*.json ./
COPY portfolio-api/package*.json ./portfolio-api/

# Install dependencies (cached layer)
RUN npm ci --workspace=portfolio-api

# Copy source code
COPY portfolio-api ./portfolio-api
COPY shared ./shared

# Build
RUN npm run build --workspace=portfolio-api

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only production dependencies
COPY --from=builder /app/portfolio-api/package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/portfolio-api/dist ./dist
COPY --from=builder /app/portfolio-api/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### CI/CD Pipeline Optimization

**Optimized GitHub Actions** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Cache dependencies
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Cache node modules
        uses: actions/cache@v3
        with:
          path: |
            node_modules
            portfolio-api/node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

      - run: npm ci
      - run: npm run build --workspace=portfolio-api

      # Only deploy if build succeeds
      - name: Deploy
        run: railway deploy
```

### Asset Preloading

**In `index.html`**:

```html
<head>
  <!-- Preload critical assets -->
  <link rel="preload" href="/assets/critical.css" as="style" />
  <link rel="preload" href="/assets/app.js" as="script" />

  <!-- Prefetch likely navigation -->
  <link rel="prefetch" href="/projects" />

  <!-- DNS prefetch for API -->
  <link rel="dns-prefetch" href="https://api.yourportfolio.com" />
  <link rel="preconnect" href="https://api.yourportfolio.com" />
</head>
```

---

## Mobile Performance

### Responsive Image Loading

**Use modern formats**:

```tsx
export function ResponsiveImage({ src, alt }: ImageProps) {
  return (
    <picture>
      <source type="image/avif" srcSet={`${src}.avif 1x, ${src}@2x.avif 2x`} />
      <source type="image/webp" srcSet={`${src}.webp 1x, ${src}@2x.webp 2x`} />
      <img src={`${src}.jpg`} alt={alt} loading="lazy" decoding="async" />
    </picture>
  );
}
```

### Touch Interaction Optimization

**Prevent touch delay**:

```css
/* src/index.css */
* {
  touch-action: manipulation; /* Removes 300ms tap delay */
}

button,
a {
  -webkit-tap-highlight-color: transparent; /* Remove tap highlight */
}
```

**Optimize for touch targets**:

```css
.touch-target {
  min-height: 44px; /* Minimum touch target size */
  min-width: 44px;
  padding: 12px;
}
```

### Network-aware Loading

```tsx
import { useNetworkState } from "react-use";

function AdaptiveContent() {
  const { effectiveType } = useNetworkState();

  // Show lower quality on slow connections
  const imageQuality = effectiveType === "4g" ? "high" : "low";

  return <img src={`/image-${imageQuality}.jpg`} alt="Adaptive" />;
}
```

---

## Production Readiness

### Load Testing with k6

**Install**:

```bash
# See: https://k6.io/docs/getting-started/installation/
```

**Create `tests/load/basic.js`**:

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 20 }, // Ramp up
    { duration: "3m", target: 20 }, // Stay at 20 users
    { duration: "1m", target: 100 }, // Spike test
    { duration: "3m", target: 100 }, // Stay at peak
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests < 500ms
    http_req_failed: ["rate<0.01"], // Error rate < 1%
  },
};

export default function () {
  const res = http.get("http://localhost:3000/api/v1/projects");

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Run load test**:

```bash
k6 run tests/load/basic.js
```

### Performance Budget

**Create `performance-budget.json`**:

```json
{
  "budgets": [
    {
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 300
        },
        {
          "resourceType": "stylesheet",
          "budget": 100
        },
        {
          "resourceType": "image",
          "budget": 500
        },
        {
          "resourceType": "total",
          "budget": 1000
        }
      ],
      "metrics": [
        {
          "metric": "first-contentful-paint",
          "budget": 2000
        },
        {
          "metric": "largest-contentful-paint",
          "budget": 2500
        },
        {
          "metric": "time-to-interactive",
          "budget": 3500
        }
      ]
    }
  ]
}
```

### Checklist

**Before Production Deployment**:

- [ ] Run Lighthouse CI (score > 90)
- [ ] Execute load tests (handle 100+ concurrent users)
- [ ] Check bundle size (< 300KB gzipped)
- [ ] Verify image optimization (WebP/AVIF)
- [ ] Enable response compression (Brotli)
- [ ] Configure CDN caching
- [ ] Set up database indexes
- [ ] Enable Redis caching
- [ ] Configure connection pooling
- [ ] Add monitoring (Prometheus/Grafana)
- [ ] Enable error tracking (Sentry)
- [ ] Test on slow 3G network
- [ ] Verify mobile performance
- [ ] Check Core Web Vitals
- [ ] Review security headers

---

## Quick Wins Checklist

Start with these high-impact, low-effort optimizations:

### Frontend

1. ✅ Add lazy loading to routes
2. ✅ Enable Vite's code splitting
3. ✅ Add `loading="lazy"` to images
4. ✅ Preload critical fonts
5. ✅ Memoize expensive components

### Backend

1. ✅ Add Redis caching to frequently accessed data
2. ✅ Enable response compression
3. ✅ Use `select` in Prisma queries
4. ✅ Add pagination to list endpoints
5. ✅ Configure connection pooling

### Database

1. ✅ Add indexes to frequently queried columns
2. ✅ Analyze slow queries (> 100ms)
3. ✅ Use composite indexes for common filters
4. ✅ Enable query logging in development

### Monitoring

1. ✅ Set up Lighthouse CI
2. ✅ Add Web Vitals tracking
3. ✅ Configure slow query alerts
4. ✅ Monitor memory usage

---

## Resources

- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Fastify Performance Tips](https://www.fastify.io/docs/latest/Guides/Performance/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Web Vitals](https://web.dev/vitals/)
