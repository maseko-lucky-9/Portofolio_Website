# Database Seeding Guide - Portfolio API

> Complete guide for seeding PostgreSQL and Redis with portfolio data using Prisma and TypeScript

## Table of Contents

1. [PostgreSQL Seeding with Prisma](#postgresql-seeding-with-prisma)
2. [Data Structure Design](#data-structure-design)
3. [Redis Initialization](#redis-initialization)
4. [Type Safety](#type-safety)
5. [Seed Execution Workflow](#seed-execution-workflow)
6. [Data Verification](#data-verification)
7. [Data Update Strategy](#data-update-strategy)

---

## PostgreSQL Seeding with Prisma

### 1. Current Seed File Structure

Your existing `prisma/seed.ts` follows a good pattern. Let's enhance it:

```typescript
// prisma/seed.ts
import { PrismaClient, Role, ProjectStatus, ArticleStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

// ==========================================
// Validation Schemas
// ==========================================

const UserSeedSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.nativeEnum(Role),
  bio: z.string().optional(),
});

const ProjectSeedSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  description: z.string().min(10),
  techStack: z.array(z.string()).min(1),
  status: z.nativeEnum(ProjectStatus),
});

const TagSeedSchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
});

// ==========================================
// Seed Data with Type Safety
// ==========================================

interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  bio?: string;
  avatar?: string;
}

interface SeedProject {
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  content: string;
  excerpt?: string;
  techStack: string[];
  category?: string;
  year?: number;
  duration?: string;
  githubUrl?: string;
  liveUrl?: string;
  thumbnail?: string;
  images?: string[];
  featured?: boolean;
  sortOrder?: number;
  views?: number;
  likes?: number;
  status: ProjectStatus;
  publishedAt?: Date;
  tags: string[]; // Tag slugs
}

interface SeedArticle {
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  featured?: boolean;
  status: ArticleStatus;
  publishedAt?: Date;
  tags: string[];
}

interface SeedTag {
  name: string;
  slug: string;
  description?: string;
  color: string;
}

// ==========================================
// Seed Data Definitions
// ==========================================

const SEED_USERS: SeedUser[] = [
  {
    email: 'admin@portfolio.dev',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: Role.ADMIN,
    bio: 'Full-stack developer specializing in TypeScript, React, and Node.js.',
  },
  {
    email: 'editor@portfolio.dev',
    password: 'editor123',
    firstName: 'Editor',
    lastName: 'User',
    role: Role.EDITOR,
  },
];

const SEED_TAGS: SeedTag[] = [
  { name: 'TypeScript', slug: 'typescript', color: '#3178C6', description: 'TypeScript programming language' },
  { name: 'React', slug: 'react', color: '#61DAFB', description: 'React JavaScript library' },
  { name: 'Node.js', slug: 'nodejs', color: '#339933', description: 'Node.js runtime' },
  { name: 'PostgreSQL', slug: 'postgresql', color: '#4169E1', description: 'PostgreSQL database' },
  { name: 'Docker', slug: 'docker', color: '#2496ED', description: 'Docker containerization' },
  { name: 'AWS', slug: 'aws', color: '#FF9900', description: 'Amazon Web Services' },
  { name: 'GraphQL', slug: 'graphql', color: '#E10098', description: 'GraphQL API' },
  { name: 'Redis', slug: 'redis', color: '#DC382D', description: 'Redis cache' },
  { name: 'Python', slug: 'python', color: '#3776AB', description: 'Python programming' },
  { name: 'Go', slug: 'go', color: '#00ADD8', description: 'Go programming language' },
  { name: 'Kubernetes', slug: 'kubernetes', color: '#326CE5', description: 'Kubernetes orchestration' },
  { name: 'CI/CD', slug: 'cicd', color: '#4A154B', description: 'Continuous Integration/Deployment' },
  { name: 'Testing', slug: 'testing', color: '#15C213', description: 'Software testing' },
  { name: 'API Design', slug: 'api-design', color: '#6B7280', description: 'RESTful API design' },
  { name: 'Microservices', slug: 'microservices', color: '#FF6B6B', description: 'Microservices architecture' },
];

const SEED_PROJECTS: SeedProject[] = [
  {
    slug: 'portfolio-website',
    title: 'Portfolio Website',
    subtitle: 'Personal portfolio with blog and project showcase',
    description: 'A modern portfolio website built with TypeScript, React, and Node.js.',
    content: `
# Portfolio Website

## Overview
A full-stack portfolio application showcasing projects, blog posts, and professional experience.

## Features
- **Project Showcase**: Interactive project cards with filtering
- **Blog Platform**: Markdown-based blog with syntax highlighting
- **Contact Form**: Validated contact submissions with email notifications
- **Admin Dashboard**: CMS for managing content
- **Analytics**: Real-time visitor tracking and engagement metrics

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, shadcn-ui, TailwindCSS
- **Backend**: Node.js, Fastify, Prisma, PostgreSQL, Redis
- **DevOps**: Docker, GitHub Actions, AWS

## Architecture
\`\`\`typescript
// Type-safe API client
const projects = await projectsService.getProjects({
  status: 'PUBLISHED',
  limit: 10,
});
\`\`\`

## Performance
- Lighthouse Score: 98/100
- First Contentful Paint: < 1.2s
- Time to Interactive: < 2.5s
    `.trim(),
    excerpt: 'Modern portfolio website with React, TypeScript, and Node.js backend.',
    techStack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
    category: 'Web Application',
    year: 2026,
    duration: '2 months',
    githubUrl: 'https://github.com/yourusername/portfolio',
    liveUrl: 'https://yourportfolio.com',
    thumbnail: '/images/projects/portfolio-thumbnail.jpg',
    images: [
      '/images/projects/portfolio-1.jpg',
      '/images/projects/portfolio-2.jpg',
      '/images/projects/portfolio-3.jpg',
    ],
    featured: true,
    sortOrder: 1,
    views: 1250,
    likes: 45,
    status: ProjectStatus.PUBLISHED,
    publishedAt: new Date('2026-01-01'),
    tags: ['typescript', 'react', 'nodejs', 'postgresql', 'docker'],
  },
  {
    slug: 'e-commerce-platform',
    title: 'E-Commerce Platform',
    subtitle: 'Full-stack marketplace with real-time inventory',
    description: 'Enterprise e-commerce solution with microservices architecture.',
    content: `
# E-Commerce Platform

## Overview
Scalable e-commerce platform processing $1M+ in transactions.

## Key Features
- Real-time inventory management
- Payment processing (Stripe)
- Order tracking and fulfillment
- Admin dashboard with analytics
- Customer reviews and ratings

## Technical Highlights
\`\`\`typescript
// Event-driven order processing
class OrderProcessor {
  async processOrder(order: Order): Promise<OrderResult> {
    await this.validateInventory(order);
    await this.processPayment(order);
    await this.createShipment(order);
    await this.sendNotifications(order);
    
    return { success: true, orderId: order.id };
  }
}
\`\`\`

## Metrics
- **Orders/Day**: 500+
- **Response Time**: < 200ms p99
- **Uptime**: 99.9%
    `.trim(),
    excerpt: 'Scalable e-commerce platform with microservices and real-time features.',
    techStack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'AWS', 'Docker', 'Kubernetes'],
    category: 'E-Commerce',
    year: 2025,
    duration: '6 months',
    githubUrl: 'https://github.com/yourusername/ecommerce',
    featured: true,
    sortOrder: 2,
    views: 890,
    likes: 32,
    status: ProjectStatus.PUBLISHED,
    publishedAt: new Date('2025-06-15'),
    tags: ['typescript', 'react', 'nodejs', 'microservices', 'aws', 'kubernetes'],
  },
  {
    slug: 'api-gateway',
    title: 'API Gateway & Microservices',
    subtitle: 'Production-ready backend architecture',
    description: 'Scalable API gateway with microservices patterns.',
    content: `
# API Gateway & Microservices

## Architecture
Implements modern backend patterns:
- API Gateway for routing
- Service mesh with Istio
- Circuit breakers
- Rate limiting
- Distributed tracing

## Services
1. User Service
2. Product Service
3. Order Service
4. Notification Service

\`\`\`go
// Go implementation
type CircuitBreaker struct {
    state        State
    maxFailures  int
    timeout      time.Duration
}

func (cb *CircuitBreaker) Execute(fn func() error) error {
    if cb.state == StateOpen {
        if time.Since(cb.lastFailure) > cb.timeout {
            cb.state = StateHalfOpen
        } else {
            return ErrCircuitOpen
        }
    }
    return fn()
}
\`\`\`
    `.trim(),
    excerpt: 'Production API gateway with microservices, circuit breakers, and service mesh.',
    techStack: ['Go', 'gRPC', 'Kubernetes', 'PostgreSQL', 'Redis'],
    category: 'Backend',
    year: 2024,
    duration: '5 months',
    githubUrl: 'https://github.com/yourusername/api-gateway',
    featured: true,
    sortOrder: 3,
    views: 720,
    likes: 28,
    status: ProjectStatus.PUBLISHED,
    publishedAt: new Date('2024-11-10'),
    tags: ['go', 'kubernetes', 'microservices', 'api-design', 'redis'],
  },
];

const SEED_ARTICLES: SeedArticle[] = [
  {
    slug: 'typescript-best-practices-2026',
    title: 'TypeScript Best Practices in 2026',
    subtitle: 'Modern patterns for type-safe applications',
    content: `
# TypeScript Best Practices in 2026

## Introduction
TypeScript has evolved significantly. Here are the latest best practices.

## 1. Strict Mode Configuration

Always enable strict mode:

\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
\`\`\`

## 2. Type Guards

Use type guards for runtime safety:

\`\`\`typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  );
}
\`\`\`

## 3. Generics with Constraints

\`\`\`typescript
function findById<T extends { id: string }>(
  items: T[],
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}
\`\`\`

## 4. Discriminated Unions

\`\`\`typescript
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

function handleResponse<T>(response: ApiResponse<T>) {
  if (response.success) {
    // TypeScript knows response.data exists
    console.log(response.data);
  } else {
    // TypeScript knows response.error exists
    console.error(response.error);
  }
}
\`\`\`

## Conclusion
These patterns will help you write more maintainable TypeScript code.
    `.trim(),
    excerpt: 'Learn modern TypeScript patterns and best practices for building type-safe applications.',
    coverImage: '/images/articles/typescript-best-practices.jpg',
    featured: true,
    status: ArticleStatus.PUBLISHED,
    publishedAt: new Date('2026-01-05'),
    tags: ['typescript', 'testing'],
  },
  {
    slug: 'building-scalable-apis',
    title: 'Building Scalable REST APIs',
    subtitle: 'Performance patterns for Node.js backends',
    content: `
# Building Scalable REST APIs

## Introduction
Learn how to build APIs that scale to millions of requests.

## Performance Patterns

### 1. Database Connection Pooling

\`\`\`typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool configuration
  log: ['query', 'info', 'warn', 'error'],
});
\`\`\`

### 2. Caching Strategy

\`\`\`typescript
async function getProject(slug: string): Promise<Project> {
  const cacheKey = \`project:\${slug}\`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch from database
  const project = await prisma.project.findUnique({
    where: { slug },
  });
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(project));
  
  return project;
}
\`\`\`

### 3. Rate Limiting

\`\`\`typescript
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes',
  redis: redisClient,
});
\`\`\`

## Monitoring
Use Prometheus and Grafana for metrics.
    `.trim(),
    excerpt: 'Performance patterns and best practices for building scalable Node.js REST APIs.',
    coverImage: '/images/articles/scalable-apis.jpg',
    featured: true,
    status: ArticleStatus.PUBLISHED,
    publishedAt: new Date('2025-12-20'),
    tags: ['nodejs', 'api-design', 'postgresql', 'redis'],
  },
];

// ==========================================
// Helper Functions
// ==========================================

async function validateSeedData(): Promise<void> {
  console.log('✅ Validating seed data...');
  
  try {
    SEED_USERS.forEach((user, i) => {
      UserSeedSchema.parse(user);
    });
    
    SEED_PROJECTS.forEach((project, i) => {
      ProjectSeedSchema.parse(project);
    });
    
    SEED_TAGS.forEach((tag, i) => {
      TagSeedSchema.parse(tag);
    });
    
    console.log('   ✅ All seed data is valid\n');
  } catch (error) {
    console.error('   ❌ Seed data validation failed:', error);
    throw error;
  }
}

async function cleanDatabase(): Promise<void> {
  console.log('🧹 Cleaning existing data...');
  
  const deleteOrder = [
    'analyticsEvent',
    'analyticsSummary',
    'codeExecution',
    'auditLog',
    'contactSubmission',
    'newsletterSubscriber',
    'demoRequest',
    'projectTag',
    'articleTag',
    'project',
    'article',
    'tag',
    'apiKey',
    'refreshToken',
    'siteSetting',
    'availability',
    'user',
  ] as const;
  
  for (const model of deleteOrder) {
    await (prisma[model] as any).deleteMany();
  }
  
  console.log('   ✅ Database cleaned\n');
}

async function seedUsers(): Promise<Map<string, any>> {
  console.log('👤 Seeding users...');
  
  const users = new Map();
  
  for (const userData of SEED_USERS) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        bio: userData.bio,
        avatar: userData.avatar,
        isActive: true,
      },
    });
    
    users.set(userData.email, user);
    console.log(`   ✅ Created user: ${user.email}`);
  }
  
  console.log('');
  return users;
}

async function seedTags(): Promise<Map<string, any>> {
  console.log('🏷️  Seeding tags...');
  
  const tags = new Map();
  
  for (const tagData of SEED_TAGS) {
    const tag = await prisma.tag.create({
      data: tagData,
    });
    
    tags.set(tag.slug, tag);
    console.log(`   ✅ Created tag: ${tag.name}`);
  }
  
  console.log('');
  return tags;
}

async function seedProjects(
  adminUser: any,
  tags: Map<string, any>
): Promise<void> {
  console.log('📁 Seeding projects...');
  
  for (const projectData of SEED_PROJECTS) {
    const { tags: projectTags, ...projectFields } = projectData;
    
    const project = await prisma.project.create({
      data: {
        ...projectFields,
        authorId: adminUser.id,
      },
    });
    
    // Add tags
    const tagConnections = projectTags
      .map(tagSlug => {
        const tag = tags.get(tagSlug);
        if (!tag) {
          console.warn(`   ⚠️  Tag not found: ${tagSlug}`);
          return null;
        }
        return { projectId: project.id, tagId: tag.id };
      })
      .filter(Boolean) as any[];
    
    if (tagConnections.length > 0) {
      await prisma.projectTag.createMany({
        data: tagConnections,
      });
    }
    
    console.log(`   ✅ Created project: ${project.title} (${project.slug})`);
  }
  
  console.log('');
}

async function seedArticles(
  adminUser: any,
  tags: Map<string, any>
): Promise<void> {
  console.log('📝 Seeding articles...');
  
  for (const articleData of SEED_ARTICLES) {
    const { tags: articleTags, ...articleFields } = articleData;
    
    // Calculate reading time and word count
    const wordCount = articleData.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // ~200 words per minute
    
    const article = await prisma.article.create({
      data: {
        ...articleFields,
        wordCount,
        readingTime,
        authorId: adminUser.id,
      },
    });
    
    // Add tags
    const tagConnections = articleTags
      .map(tagSlug => {
        const tag = tags.get(tagSlug);
        if (!tag) {
          console.warn(`   ⚠️  Tag not found: ${tagSlug}`);
          return null;
        }
        return { articleId: article.id, tagId: tag.id };
      })
      .filter(Boolean) as any[];
    
    if (tagConnections.length > 0) {
      await prisma.articleTag.createMany({
        data: tagConnections,
      });
    }
    
    console.log(`   ✅ Created article: ${article.title} (${article.slug})`);
  }
  
  console.log('');
}

async function seedSiteSettings(adminUser: any): Promise<void> {
  console.log('⚙️  Seeding site settings...');
  
  await prisma.siteSetting.createMany({
    data: [
      {
        key: 'site_name',
        value: 'My Portfolio',
        type: 'string',
        description: 'Site name displayed in header',
        isPublic: true,
        updatedBy: adminUser.id,
      },
      {
        key: 'site_description',
        value: 'Full-stack developer portfolio and blog',
        type: 'string',
        description: 'Site description for SEO',
        isPublic: true,
        updatedBy: adminUser.id,
      },
      {
        key: 'contact_email',
        value: 'contact@yourportfolio.com',
        type: 'string',
        description: 'Contact email address',
        isPublic: true,
        updatedBy: adminUser.id,
      },
      {
        key: 'analytics_enabled',
        value: 'true',
        type: 'boolean',
        description: 'Enable analytics tracking',
        isPublic: false,
        updatedBy: adminUser.id,
      },
    ],
  });
  
  console.log('   ✅ Site settings created\n');
}

// ==========================================
// Main Seed Function
// ==========================================

async function main(): Promise<void> {
  console.log('\n🌱 Starting database seed...\n');
  
  try {
    // Validate seed data
    await validateSeedData();
    
    // Clean database
    await cleanDatabase();
    
    // Seed users
    const users = await seedUsers();
    const adminUser = users.get('admin@portfolio.dev');
    
    if (!adminUser) {
      throw new Error('Admin user not created');
    }
    
    // Seed tags
    const tags = await seedTags();
    
    // Seed projects
    await seedProjects(adminUser, tags);
    
    // Seed articles
    await seedArticles(adminUser, tags);
    
    // Seed site settings
    await seedSiteSettings(adminUser);
    
    console.log('✅ Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Users:     ${users.size}`);
    console.log(`   Tags:      ${tags.size}`);
    console.log(`   Projects:  ${SEED_PROJECTS.length}`);
    console.log(`   Articles:  ${SEED_ARTICLES.length}\n`);
    
    console.log('🔐 Login credentials:');
    console.log('   Email:    admin@portfolio.dev');
    console.log('   Password: admin123\n');
    
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  }
}

// Run seed
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 2. Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio",
    
    "redis:init": "tsx scripts/init-redis.ts",
    "db:verify": "tsx scripts/verify-database.ts",
    "db:backup": "tsx scripts/backup-database.ts",
    
    "setup:dev": "npm run db:migrate && npm run db:seed && npm run redis:init"
  }
}
