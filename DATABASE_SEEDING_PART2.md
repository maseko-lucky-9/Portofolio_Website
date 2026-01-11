# Database Seeding Guide - Part 2

## Data Structure Design

### 1. Portfolio Project Schema

Your Prisma schema is well-designed. Here's the optimal structure:

```prisma
model Project {
  id          String   @id @default(uuid())
  slug        String   @unique        // URL-friendly identifier
  title       String                  // Display title
  subtitle    String?                 // Optional tagline
  description String   @db.Text       // Short description
  content     String   @db.Text       // Full markdown content
  excerpt     String?  @db.Text       // SEO excerpt
  
  // Technical
  techStack   String[]                // Array of technologies
  category    String?                 // Project category
  year        Int?                    // Completion year
  duration    String?                 // e.g., "3 months"
  
  // Links
  githubUrl   String?  @map("github_url")
  liveUrl     String?  @map("live_url")
  demoUrl     String?  @map("demo_url")
  
  // Media
  thumbnail   String?                 // Main image
  images      String[] @default([])   // Gallery images
  videoUrl    String?  @map("video_url")
  
  // Metrics
  featured    Boolean  @default(false)
  sortOrder   Int      @default(0) @map("sort_order")
  views       Int      @default(0)
  likes       Int      @default(0)
  
  // Status
  status      ProjectStatus @default(DRAFT)
  publishedAt DateTime?     @map("published_at")
  
  // Relationships
  authorId    String   @map("author_id")
  author      User     @relation(fields: [authorId], references: [id])
  tags        ProjectTag[]
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([slug])
  @@index([status])
  @@index([featured])
  @@map("projects")
}
```

**Design Decisions:**

1. **UUID Primary Keys**: Better for distributed systems
2. **Slug for URLs**: SEO-friendly, human-readable URLs
3. **Text Fields**: Use `@db.Text` for unlimited content
4. **Arrays**: PostgreSQL native array support for tags/images
5. **Indexes**: On frequently queried fields (slug, status, featured)
6. **Timestamps**: Automatic `createdAt` and `updatedAt`
7. **Soft Delete**: Use status field instead of deleting

### 2. Skill Categorization

```typescript
// types/skills.ts
export interface Skill {
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  yearsOfExperience?: number;
  icon?: string;
}

export enum SkillCategory {
  FRONTEND = 'Frontend',
  BACKEND = 'Backend',
  DATABASE = 'Database',
  DEVOPS = 'DevOps',
  TESTING = 'Testing',
  TOOLS = 'Tools',
}

export enum SkillLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  EXPERT = 'Expert',
}

// Seed data
const SKILLS: Skill[] = [
  // Frontend
  {
    name: 'TypeScript',
    category: SkillCategory.FRONTEND,
    level: SkillLevel.EXPERT,
    yearsOfExperience: 5,
    icon: 'typescript-icon.svg',
  },
  {
    name: 'React',
    category: SkillCategory.FRONTEND,
    level: SkillLevel.EXPERT,
    yearsOfExperience: 6,
    icon: 'react-icon.svg',
  },
  
  // Backend
  {
    name: 'Node.js',
    category: SkillCategory.BACKEND,
    level: SkillLevel.EXPERT,
    yearsOfExperience: 6,
    icon: 'nodejs-icon.svg',
  },
  {
    name: 'Fastify',
    category: SkillCategory.BACKEND,
    level: SkillLevel.ADVANCED,
    yearsOfExperience: 3,
    icon: 'fastify-icon.svg',
  },
  
  // Database
  {
    name: 'PostgreSQL',
    category: SkillCategory.DATABASE,
    level: SkillLevel.ADVANCED,
    yearsOfExperience: 5,
    icon: 'postgresql-icon.svg',
  },
  {
    name: 'Redis',
    category: SkillCategory.DATABASE,
    level: SkillLevel.ADVANCED,
    yearsOfExperience: 4,
    icon: 'redis-icon.svg',
  },
  
  // DevOps
  {
    name: 'Docker',
    category: SkillCategory.DEVOPS,
    level: SkillLevel.ADVANCED,
    yearsOfExperience: 4,
    icon: 'docker-icon.svg',
  },
  {
    name: 'Kubernetes',
    category: SkillCategory.DEVOPS,
    level: SkillLevel.INTERMEDIATE,
    yearsOfExperience: 2,
    icon: 'kubernetes-icon.svg',
  },
];
```

### 3. Blog Post Structure

```prisma
model Article {
  id          String   @id @default(uuid())
  slug        String   @unique
  title       String
  subtitle    String?
  content     String   @db.Text       // Markdown
  excerpt     String?  @db.Text       // For listings
  
  // Reading metrics
  readingTime Int      @default(0) @map("reading_time") // minutes
  wordCount   Int      @default(0) @map("word_count")
  
  // Media
  coverImage  String?  @map("cover_image")
  
  // Display
  featured    Boolean  @default(false)
  views       Int      @default(0)
  likes       Int      @default(0)
  
  // Status
  status      ArticleStatus @default(DRAFT)
  publishedAt DateTime?     @map("published_at")
  
  // SEO
  metaTitle       String? @map("meta_title")
  metaDescription String? @map("meta_description")
  canonicalUrl    String? @map("canonical_url")
  
  // Relations
  authorId    String   @map("author_id")
  author      User     @relation(fields: [authorId], references: [id])
  tags        ArticleTag[]
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([slug])
  @@index([status])
  @@index([featured])
  @@map("articles")
}
```

**Helper Function for Word Count:**

```typescript
function calculateReadingTime(content: string): {
  wordCount: number;
  readingTime: number;
} {
  // Remove markdown syntax
  const plainText = content
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/`[^`]*`/g, '')         // Inline code
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
    .replace(/[#*_~]/g, '');         // Markdown syntax
  
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200); // 200 words/min
  
  return { wordCount, readingTime };
}
```

### 4. Analytics Event Tracking

```prisma
model AnalyticsEvent {
  id         String    @id @default(uuid())
  eventType  EventType
  
  // Context
  userId     String?   @map("user_id")
  sessionId  String?   @map("session_id")
  ip         String?
  userAgent  String?   @map("user_agent")
  
  // Resource
  projectId  String?   @map("project_id")
  articleId  String?   @map("article_id")
  
  // Event data
  metadata   Json?     // Flexible event data
  
  // Geo
  country    String?
  city       String?
  
  timestamp  DateTime  @default(now())

  project    Project?  @relation(fields: [projectId], references: [id])
  article    Article?  @relation(fields: [articleId], references: [id])

  @@index([eventType])
  @@index([sessionId])
  @@index([projectId])
  @@index([articleId])
  @@index([timestamp])
  @@map("analytics_events")
}

enum EventType {
  PAGE_VIEW
  PROJECT_VIEW
  ARTICLE_VIEW
  LIKE
  SHARE
  CONTACT_SUBMIT
  NEWSLETTER_SUBSCRIBE
  DEMO_REQUEST
}
```

**Analytics Seed Data:**

```typescript
async function seedAnalytics(projects: Project[], articles: Article[]): Promise<void> {
  console.log('📊 Seeding analytics events...');
  
  const sessionId = crypto.randomUUID();
  
  // Generate realistic view patterns
  const events = [];
  
  // Page views
  for (let i = 0; i < 100; i++) {
    events.push({
      eventType: EventType.PAGE_VIEW,
      sessionId: crypto.randomUUID(),
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0...',
      metadata: { path: '/', referrer: 'https://google.com' },
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    });
  }
  
  // Project views
  for (const project of projects) {
    const views = Math.floor(Math.random() * 500) + 100;
    for (let i = 0; i < views; i++) {
      events.push({
        eventType: EventType.PROJECT_VIEW,
        projectId: project.id,
        sessionId: crypto.randomUUID(),
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }
  }
  
  await prisma.analyticsEvent.createMany({ data: events });
  console.log(`   ✅ Created ${events.length} analytics events\n`);
}
```

---

## Redis Initialization

See `scripts/init-redis.ts` for complete implementation.

### 1. Cache Warmup Strategies

```typescript
// Strategy 1: Eager Loading (on startup)
async function warmupCache(): Promise<void> {
  // Load most popular content
  const popularProjects = await prisma.project.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { views: 'desc' },
    take: 10,
  });
  
  for (const project of popularProjects) {
    await redis.setex(
      `project:${project.slug}`,
      3600,
      JSON.stringify(project)
    );
  }
}

// Strategy 2: Lazy Loading (on first request)
async function getProject(slug: string): Promise<Project> {
  const cacheKey = `project:${slug}`;
  
  // Try cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Miss - fetch from DB
  const project = await prisma.project.findUnique({ where: { slug } });
  
  if (project) {
    // Cache for future requests
    await redis.setex(cacheKey, 3600, JSON.stringify(project));
  }
  
  return project;
}

// Strategy 3: Predictive Loading (based on patterns)
async function predictiveWarmup(): Promise<void> {
  // Load content likely to be accessed next
  const trendingTags = await getTrendingTags();
  
  for (const tag of trendingTags) {
    const projects = await prisma.project.findMany({
      where: {
        tags: { some: { tagId: tag.id } },
      },
      take: 5,
    });
    
    await redis.setex(
      `projects:tag:${tag.slug}`,
      1800,
      JSON.stringify(projects)
    );
  }
}
```

### 2. Session Storage Setup

```typescript
// Session manager
class SessionManager {
  private redis: Redis;
  private prefix = 'sess:';
  private ttl = 86400; // 24 hours
  
  async create(userId: string, data: any): Promise<string> {
    const sessionId = crypto.randomUUID();
    const key = `${this.prefix}${sessionId}`;
    
    await this.redis.setex(
      key,
      this.ttl,
      JSON.stringify({ userId, ...data, createdAt: Date.now() })
    );
    
    return sessionId;
  }
  
  async get(sessionId: string): Promise<any | null> {
    const key = `${this.prefix}${sessionId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async refresh(sessionId: string): Promise<void> {
    const key = `${this.prefix}${sessionId}`;
    await this.redis.expire(key, this.ttl);
  }
  
  async destroy(sessionId: string): Promise<void> {
    const key = `${this.prefix}${sessionId}`;
    await this.redis.del(key);
  }
}
```

### 3. Rate Limiting Configuration

```typescript
// Rate limiter using Redis
class RateLimiter {
  private redis: Redis;
  
  async checkLimit(
    key: string,
    max: number,
    window: number // seconds
  ): Promise<{ allowed: boolean; remaining: number }> {
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      // First request - set expiration
      await this.redis.expire(key, window);
    }
    
    const allowed = current <= max;
    const remaining = Math.max(0, max - current);
    
    return { allowed, remaining };
  }
}

// Usage
const limiter = new RateLimiter(redis);

fastify.addHook('preHandler', async (request, reply) => {
  const key = `ratelimit:${request.ip}:${request.routerPath}`;
  const { allowed, remaining } = await limiter.checkLimit(key, 100, 60);
  
  reply.header('X-RateLimit-Remaining', remaining);
  
  if (!allowed) {
    reply.code(429).send({ error: 'Too many requests' });
  }
});
```

### 4. Pub/Sub Channels

```typescript
// Publisher
const publisher = new Redis(config.redis.url);

await publisher.publish('cache:invalidate', JSON.stringify({
  pattern: 'project:*',
  reason: 'project_updated',
  projectId: '123',
}));

// Subscriber
const subscriber = new Redis(config.redis.url);

await subscriber.subscribe('cache:invalidate');

subscriber.on('message', async (channel, message) => {
  const { pattern, reason, projectId } = JSON.parse(message);
  
  console.log(`Cache invalidation: ${pattern} (${reason})`);
  
  // Invalidate matching keys
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
});
```

---

## Type Safety

### 1. Database Model TypeScript Types

Prisma automatically generates types:

```typescript
import { Project, Article, Tag, User } from '@prisma/client';

// Full model type
const project: Project = await prisma.project.findUnique({
  where: { slug: 'my-project' },
});

// With relations
type ProjectWithTags = Project & {
  tags: Array<{ tag: Tag }>;
  author: User;
};

const project: ProjectWithTags = await prisma.project.findUnique({
  where: { slug: 'my-project' },
  include: {
    tags: { include: { tag: true } },
    author: true,
  },
});

// Partial types
type CreateProjectData = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

// Pick specific fields
type ProjectSummary = Pick<Project, 'id' | 'slug' | 'title' | 'excerpt'>;
```

### 2. Seed Data Type Definitions

```typescript
// seed-types.ts
import { Role, ProjectStatus, ArticleStatus } from '@prisma/client';

export interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  bio?: string;
}

export interface SeedProject {
  slug: string;
  title: string;
  description: string;
  content: string;
  techStack: string[];
  status: ProjectStatus;
  featured?: boolean;
  tags: string[]; // tag slugs
}

export interface SeedTag {
  name: string;
  slug: string;
  color: string;
  description?: string;
}

// Validation with Zod
import { z } from 'zod';

export const SeedProjectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  content: z.string().min(100),
  techStack: z.array(z.string()).min(1),
  status: z.nativeEnum(ProjectStatus),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).min(1),
});

// Usage
const validatedProject = SeedProjectSchema.parse(projectData);
```

### 3. Migration Type Safety

```typescript
// prisma/migrations/custom-migration.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function up(): Promise<void> {
  // Type-safe migration
  await prisma.project.updateMany({
    where: { status: 'DRAFT' as const },
    data: { views: 0 },
  });
}

export async function down(): Promise<void> {
  // Rollback logic
}
```

### 4. Enum Handling

```typescript
// Using Prisma enums
import { ProjectStatus, ArticleStatus, Role } from '@prisma/client';

// Type-safe enum usage
const status: ProjectStatus = ProjectStatus.PUBLISHED;

// Enum values array
const statuses = Object.values(ProjectStatus);
// ['DRAFT', 'PUBLISHED', 'ARCHIVED']

// Type guard
function isValidStatus(value: string): value is ProjectStatus {
  return Object.values(ProjectStatus).includes(value as ProjectStatus);
}

// Usage in validation
const statusSchema = z.nativeEnum(ProjectStatus);
```

---

## Seed Execution Workflow

### 1. Development Seeding

```bash
# Complete development setup
npm run setup:dev

# Or step by step:
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run redis:init      # Warmup Redis cache
npm run db:verify       # Verify data
```

### 2. Test Data Generation

```typescript
// tests/factories/project.factory.ts
import { faker } from '@faker-js/faker';
import { ProjectStatus } from '@prisma/client';

export function createTestProject(overrides?: Partial<Project>): Project {
  return {
    id: faker.string.uuid(),
    slug: faker.helpers.slugify(faker.lorem.words(3)).toLowerCase(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    content: faker.lorem.paragraphs(5),
    techStack: faker.helpers.arrayElements([
      'TypeScript',
      'React',
      'Node.js',
    ], 3),
    status: ProjectStatus.PUBLISHED,
    featured: faker.datatype.boolean(),
    views: faker.number.int({ min: 0, max: 1000 }),
    likes: faker.number.int({ min: 0, max: 100 }),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

// Usage in tests
import { createTestProject } from './factories/project.factory';

test('should list projects', async () => {
  const project = await prisma.project.create({
    data: createTestProject({ status: ProjectStatus.PUBLISHED }),
  });
  
  const response = await app.inject({
    method: 'GET',
    url: '/v1/projects',
  });
  
  expect(response.statusCode).toBe(200);
});
```

### 3. Production Data Migration

```typescript
// scripts/migrate-production.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateProduction(): Promise<void> {
  console.log('🚀 Starting production migration...\n');
  
  // Backup first
  await backupDatabase();
  
  try {
    // Run migrations
    await prisma.$executeRaw`SELECT 1`; // Test connection
    
    console.log('✅ Database connection verified');
    
    // Apply migrations
    // (Prisma Migrate will handle this)
    
    console.log('✅ Migrations complete\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await restoreDatabase();
    throw error;
  }
}
```

### 4. Data Backup Procedures

```bash
# PostgreSQL backup
pg_dump -h localhost -U postgres -d portfolio_db > backup.sql

# Restore
psql -h localhost -U postgres -d portfolio_db < backup.sql

# Redis backup
redis-cli --rdb dump.rdb

# Restore
redis-cli --rdb dump.rdb
```

```typescript
// scripts/backup-database.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

async function backupDatabase(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `backup-${timestamp}.sql`;
  const filepath = path.join(__dirname, '../backups', filename);
  
  console.log(`📦 Creating backup: ${filename}`);
  
  const command = `pg_dump ${process.env.DATABASE_URL} > ${filepath}`;
  
  try {
    await execAsync(command);
    console.log(`✅ Backup created: ${filepath}`);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}
```

---

## Data Verification

See `scripts/verify-database.ts` for complete implementation.

### Quick Verification Commands

```bash
# Run all verifications
npm run db:verify

# Check specific tables
psql -d portfolio_db -c "SELECT COUNT(*) FROM projects;"
psql -d portfolio_db -c "SELECT COUNT(*) FROM articles;"

# Check Redis keys
redis-cli KEYS "project:*" | wc -l
redis-cli KEYS "article:*" | wc -l

# Check database size
psql -d portfolio_db -c "SELECT pg_size_pretty(pg_database_size('portfolio_db'));"
```

---

## Data Update Strategy

### 1. Incremental Updates

```typescript
// scripts/update-projects.ts
async function incrementalUpdate(): Promise<void> {
  // Update only modified records
  const updatedProjects = [
    { slug: 'project-1', views: 150 },
    { slug: 'project-2', likes: 45 },
  ];
  
  for (const update of updatedProjects) {
    await prisma.project.update({
      where: { slug: update.slug },
      data: update,
    });
    
    // Invalidate cache
    await redis.del(`project:${update.slug}`);
  }
}
```

### 2. Versioned Data Changes

```typescript
// migrations/data/v1.0.0-to-v1.1.0.ts
export async function migrateData(): Promise<void> {
  console.log('Migrating data from v1.0.0 to v1.1.0');
  
  // Add new field with default values
  await prisma.project.updateMany({
    where: { excerpt: null },
    data: {
      excerpt: prisma.$queryRaw`LEFT(description, 200)`,
    },
  });
  
  console.log('✅ Data migration complete');
}
```

### 3. Rollback Procedures

```bash
# Prisma rollback
prisma migrate resolve --rolled-back <migration_name>

# Manual rollback
psql -d portfolio_db -f rollback-v1.1.0.sql
```

```typescript
// rollback.ts
async function rollback(version: string): Promise<void> {
  console.log(`Rolling back to version ${version}`);
  
  // Restore from backup
  await restoreDatabase(`backup-${version}.sql`);
  
  // Clear Redis cache
  await redis.flushdb();
  
  // Reinitialize
  await initRedis();
  
  console.log('✅ Rollback complete');
}
```

---

## Complete Workflow

```bash
# 1. Initial setup
npm install
docker-compose -f docker-compose.dev.yml up -d

# 2. Generate Prisma client
npm run db:generate

# 3. Run migrations
npm run db:migrate

# 4. Seed database
npm run db:seed

# 5. Initialize Redis
npm run redis:init

# 6. Verify everything
npm run db:verify

# 7. Start development
npm run dev
```

---

## Troubleshooting

### Common Issues

1. **"Table already exists" error**
   ```bash
   npm run db:reset  # WARNING: Deletes all data
   npm run db:seed
   ```

2. **Redis connection failed**
   ```bash
   docker ps  # Check if Redis container is running
   docker logs portfolio-redis-dev
   ```

3. **Seed data validation failed**
   - Check your seed data against schemas
   - Ensure all required fields are present
   - Verify enum values match schema

4. **Slow queries**
   ```bash
   npm run db:verify  # Check query performance
   # Add indexes if needed
   ```

---

## Next Steps

1. ✅ Run initial seed: `npm run db:seed`
2. ✅ Initialize Redis: `npm run redis:init`
3. ✅ Verify data: `npm run db:verify`
4. ✅ Create backup: `npm run db:backup`
5. ✅ Start development: `npm run dev`

Your database is now ready for development! 🎉
