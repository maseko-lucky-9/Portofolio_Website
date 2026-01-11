"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...\n');
    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.analyticsEvent.deleteMany();
    await prisma.analyticsSummary.deleteMany();
    await prisma.codeExecution.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.contactSubmission.deleteMany();
    await prisma.newsletterSubscriber.deleteMany();
    await prisma.demoRequest.deleteMany();
    await prisma.projectTag.deleteMany();
    await prisma.articleTag.deleteMany();
    await prisma.project.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.siteSetting.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.user.deleteMany();
    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = await bcryptjs_1.default.hash('admin123', 12);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@portfolio.dev',
            passwordHash: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: client_1.Role.ADMIN,
            bio: 'Portfolio administrator and full-stack developer.',
            isActive: true,
        },
    });
    // Create demo user
    const demoPassword = await bcryptjs_1.default.hash('demo123', 12);
    const demoUser = await prisma.user.create({
        data: {
            email: 'demo@portfolio.dev',
            passwordHash: demoPassword,
            firstName: 'Demo',
            lastName: 'User',
            role: client_1.Role.VIEWER,
            isActive: true,
        },
    });
    // Create tags
    console.log('🏷️  Creating tags...');
    const tags = await Promise.all([
        prisma.tag.create({ data: { name: 'TypeScript', slug: 'typescript', color: '#3178C6' } }),
        prisma.tag.create({ data: { name: 'React', slug: 'react', color: '#61DAFB' } }),
        prisma.tag.create({ data: { name: 'Node.js', slug: 'nodejs', color: '#339933' } }),
        prisma.tag.create({ data: { name: 'PostgreSQL', slug: 'postgresql', color: '#4169E1' } }),
        prisma.tag.create({ data: { name: 'Docker', slug: 'docker', color: '#2496ED' } }),
        prisma.tag.create({ data: { name: 'AWS', slug: 'aws', color: '#FF9900' } }),
        prisma.tag.create({ data: { name: 'GraphQL', slug: 'graphql', color: '#E10098' } }),
        prisma.tag.create({ data: { name: 'Redis', slug: 'redis', color: '#DC382D' } }),
        prisma.tag.create({ data: { name: 'Python', slug: 'python', color: '#3776AB' } }),
        prisma.tag.create({ data: { name: 'Go', slug: 'go', color: '#00ADD8' } }),
        prisma.tag.create({ data: { name: 'Kubernetes', slug: 'kubernetes', color: '#326CE5' } }),
        prisma.tag.create({ data: { name: 'CI/CD', slug: 'cicd', color: '#4A154B' } }),
        prisma.tag.create({ data: { name: 'Testing', slug: 'testing', color: '#15C213' } }),
        prisma.tag.create({ data: { name: 'API Design', slug: 'api-design', color: '#6B7280' } }),
        prisma.tag.create({ data: { name: 'Microservices', slug: 'microservices', color: '#FF6B6B' } }),
    ]);
    const tagMap = Object.fromEntries(tags.map((t) => [t.slug, t]));
    // Create projects
    console.log('📁 Creating projects...');
    const project1 = await prisma.project.create({
        data: {
            slug: 'e-commerce-platform',
            title: 'E-Commerce Platform',
            subtitle: 'Full-stack marketplace with real-time inventory',
            description: 'A comprehensive e-commerce solution built with modern technologies.',
            content: `
# E-Commerce Platform

## Overview
A full-featured e-commerce platform designed for scalability and performance.

## Key Features
- **Real-time Inventory**: WebSocket-powered stock updates
- **Payment Processing**: Stripe integration with webhook handling
- **Order Management**: Complete order lifecycle tracking
- **Admin Dashboard**: Analytics and inventory management

## Technical Highlights

### Architecture
\`\`\`
┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│   API Gateway   │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌─────────┐  ┌─────────┐  ┌─────────┐
              │ Orders  │  │ Products│  │  Users  │
              │ Service │  │ Service │  │ Service │
              └─────────┘  └─────────┘  └─────────┘
\`\`\`

### Code Sample
\`\`\`typescript
// Real-time inventory update
async function updateInventory(productId: string, quantity: number) {
  const product = await prisma.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } },
  });
  
  // Broadcast to connected clients
  io.to(\`product:\${productId}\`).emit('stock-update', {
    productId,
    newStock: product.stock,
  });
  
  return product;
}
\`\`\`

## Results
- 99.9% uptime over 12 months
- 50ms average API response time
- Handles 1000+ concurrent users
`,
            excerpt: 'A full-featured e-commerce platform with real-time inventory, payment processing, and comprehensive admin tools.',
            techStack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'Stripe', 'Docker'],
            category: 'Web Application',
            year: 2025,
            duration: '6 months',
            githubUrl: 'https://github.com/portfolio/ecommerce-platform',
            liveUrl: 'https://ecommerce-demo.portfolio.dev',
            featured: true,
            sortOrder: 1,
            views: 1250,
            status: client_1.ProjectStatus.PUBLISHED,
            publishedAt: new Date('2025-06-15'),
            authorId: admin.id,
            metaTitle: 'E-Commerce Platform | Portfolio',
            metaDescription: 'A full-stack e-commerce solution demonstrating modern web development practices.',
        },
    });
    await prisma.projectTag.createMany({
        data: [
            { projectId: project1.id, tagId: tagMap['typescript'].id },
            { projectId: project1.id, tagId: tagMap['react'].id },
            { projectId: project1.id, tagId: tagMap['nodejs'].id },
            { projectId: project1.id, tagId: tagMap['postgresql'].id },
            { projectId: project1.id, tagId: tagMap['redis'].id },
            { projectId: project1.id, tagId: tagMap['docker'].id },
        ],
    });
    const project2 = await prisma.project.create({
        data: {
            slug: 'real-time-analytics-dashboard',
            title: 'Real-Time Analytics Dashboard',
            subtitle: 'High-performance data visualization platform',
            description: 'A real-time analytics dashboard processing millions of events.',
            content: `
# Real-Time Analytics Dashboard

## Overview
Enterprise-grade analytics platform with sub-second data freshness.

## Architecture
- Event streaming with Apache Kafka
- Time-series data in ClickHouse
- Real-time aggregations with Flink
- Interactive dashboards with D3.js

## Performance Metrics
- 100K events/second ingestion
- <100ms query response time
- 30-day data retention with rollups

\`\`\`typescript
// Event streaming handler
const processEvent = async (event: AnalyticsEvent) => {
  await kafka.produce('analytics-events', {
    key: event.sessionId,
    value: JSON.stringify(event),
    timestamp: Date.now(),
  });
};
\`\`\`
`,
            excerpt: 'Enterprise analytics platform processing 100K events/second with real-time visualization.',
            techStack: ['TypeScript', 'React', 'Kafka', 'ClickHouse', 'D3.js', 'Docker', 'Kubernetes'],
            category: 'Data Platform',
            year: 2025,
            duration: '4 months',
            githubUrl: 'https://github.com/portfolio/analytics-dashboard',
            featured: true,
            sortOrder: 2,
            views: 890,
            status: client_1.ProjectStatus.PUBLISHED,
            publishedAt: new Date('2025-08-20'),
            authorId: admin.id,
        },
    });
    await prisma.projectTag.createMany({
        data: [
            { projectId: project2.id, tagId: tagMap['typescript'].id },
            { projectId: project2.id, tagId: tagMap['react'].id },
            { projectId: project2.id, tagId: tagMap['docker'].id },
            { projectId: project2.id, tagId: tagMap['kubernetes'].id },
        ],
    });
    const project3 = await prisma.project.create({
        data: {
            slug: 'api-gateway-microservices',
            title: 'API Gateway & Microservices',
            subtitle: 'Scalable backend architecture pattern',
            description: 'A production-ready API gateway with microservices architecture.',
            content: `
# API Gateway & Microservices

## Overview
Demonstrates modern backend architecture patterns with:
- API Gateway for routing and authentication
- Service mesh with Istio
- Distributed tracing with Jaeger
- Circuit breakers and rate limiting

## Services
1. **User Service** - Authentication & authorization
2. **Product Service** - Catalog management
3. **Order Service** - Order processing
4. **Notification Service** - Email/SMS/Push

\`\`\`go
// Circuit breaker implementation
func (cb *CircuitBreaker) Execute(fn func() error) error {
    if cb.state == StateOpen {
        if time.Since(cb.lastFailure) > cb.timeout {
            cb.state = StateHalfOpen
        } else {
            return ErrCircuitOpen
        }
    }
    
    err := fn()
    cb.recordResult(err)
    return err
}
\`\`\`
`,
            excerpt: 'Production-ready microservices architecture with API gateway, service mesh, and distributed tracing.',
            techStack: ['Go', 'gRPC', 'Kubernetes', 'Istio', 'PostgreSQL', 'Redis', 'Jaeger'],
            category: 'Backend Architecture',
            year: 2024,
            duration: '5 months',
            githubUrl: 'https://github.com/portfolio/api-gateway',
            featured: true,
            sortOrder: 3,
            views: 720,
            status: client_1.ProjectStatus.PUBLISHED,
            publishedAt: new Date('2024-11-10'),
            authorId: admin.id,
        },
    });
    await prisma.projectTag.createMany({
        data: [
            { projectId: project3.id, tagId: tagMap['go'].id },
            { projectId: project3.id, tagId: tagMap['kubernetes'].id },
            { projectId: project3.id, tagId: tagMap['microservices'].id },
            { projectId: project3.id, tagId: tagMap['api-design'].id },
            { projectId: project3.id, tagId: tagMap['postgresql'].id },
            { projectId: project3.id, tagId: tagMap['redis'].id },
        ],
    });
    // Create articles
    console.log('📝 Creating articles...');
    const article1 = await prisma.article.create({
        data: {
            slug: 'building-scalable-apis-with-fastify',
            title: 'Building Scalable APIs with Fastify',
            subtitle: 'A comprehensive guide to high-performance Node.js APIs',
            content: `
# Building Scalable APIs with Fastify

Fastify is one of the fastest web frameworks for Node.js, and in this article, I'll share my experience building production APIs with it.

## Why Fastify?

After years of working with Express, I switched to Fastify for several reasons:

1. **Performance** - Up to 2x faster than Express
2. **Schema-based validation** - JSON Schema built-in
3. **TypeScript support** - First-class TS experience
4. **Plugin architecture** - Clean, encapsulated modules

## Getting Started

\`\`\`typescript
import Fastify from 'fastify';

const app = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      removeAdditional: 'all',
      coerceTypes: true,
    },
  },
});

// Route with schema validation
app.get<{ Params: { id: string } }>('/users/:id', {
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
      },
      required: ['id'],
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
}, async (request, reply) => {
  const user = await findUser(request.params.id);
  return user;
});
\`\`\`

## Performance Tips

### 1. Use Schema Serialization
Fastify can serialize responses 2-3x faster with schemas.

### 2. Connection Pooling
\`\`\`typescript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
\`\`\`

### 3. Enable HTTP/2
\`\`\`typescript
const app = Fastify({
  http2: true,
  https: {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
  },
});
\`\`\`

## Conclusion

Fastify's combination of speed, developer experience, and production-readiness makes it my go-to choice for Node.js APIs.
`,
            excerpt: 'Learn how to build high-performance APIs with Fastify, including schema validation, plugin architecture, and optimization tips.',
            readingTime: 8,
            wordCount: 450,
            featured: true,
            sortOrder: 1,
            views: 2340,
            status: client_1.ArticleStatus.PUBLISHED,
            publishedAt: new Date('2025-09-01'),
            authorId: admin.id,
            metaTitle: 'Building Scalable APIs with Fastify | Portfolio Blog',
            metaDescription: 'A comprehensive guide to building high-performance Node.js APIs with Fastify framework.',
        },
    });
    await prisma.articleTag.createMany({
        data: [
            { articleId: article1.id, tagId: tagMap['typescript'].id },
            { articleId: article1.id, tagId: tagMap['nodejs'].id },
            { articleId: article1.id, tagId: tagMap['api-design'].id },
        ],
    });
    const article2 = await prisma.article.create({
        data: {
            slug: 'database-optimization-postgresql',
            title: 'PostgreSQL Performance Optimization Guide',
            subtitle: 'From query analysis to indexing strategies',
            content: `
# PostgreSQL Performance Optimization Guide

## Introduction

After managing PostgreSQL databases handling billions of rows, here are my battle-tested optimization strategies.

## Query Analysis with EXPLAIN ANALYZE

\`\`\`sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT p.*, u.name as author_name
FROM projects p
JOIN users u ON p.author_id = u.id
WHERE p.status = 'PUBLISHED'
ORDER BY p.created_at DESC
LIMIT 10;
\`\`\`

## Indexing Strategies

### Partial Indexes
\`\`\`sql
CREATE INDEX idx_projects_published 
ON projects (created_at DESC) 
WHERE status = 'PUBLISHED';
\`\`\`

### Composite Indexes
\`\`\`sql
CREATE INDEX idx_analytics_session_time 
ON analytics_events (session_id, created_at DESC);
\`\`\`

## Connection Pooling with PgBouncer

\`\`\`ini
[databases]
portfolio = host=127.0.0.1 dbname=portfolio

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
\`\`\`

## Results

After implementing these optimizations:
- 95th percentile latency: 150ms → 12ms
- Throughput: 500 → 5000 queries/second
- Database CPU: 80% → 25%
`,
            excerpt: 'Battle-tested PostgreSQL optimization strategies including query analysis, indexing, and connection pooling.',
            readingTime: 12,
            wordCount: 680,
            featured: true,
            sortOrder: 2,
            views: 1890,
            status: client_1.ArticleStatus.PUBLISHED,
            publishedAt: new Date('2025-07-15'),
            authorId: admin.id,
        },
    });
    await prisma.articleTag.createMany({
        data: [
            { articleId: article2.id, tagId: tagMap['postgresql'].id },
            { articleId: article2.id, tagId: tagMap['api-design'].id },
        ],
    });
    // Create contact submissions
    console.log('📬 Creating sample contact submissions...');
    await prisma.contactSubmission.createMany({
        data: [
            {
                name: 'Sarah Chen',
                email: 'sarah.chen@techcorp.com',
                company: 'TechCorp Inc',
                subject: 'Senior Backend Developer Position',
                message: 'Hi, I came across your portfolio and was impressed by your work on the e-commerce platform. We have an opening for a Senior Backend Developer role. Would you be interested in discussing?',
                status: client_1.ContactStatus.NEW,
                referrer: 'https://linkedin.com',
            },
            {
                name: 'Mike Johnson',
                email: 'mike@startup.io',
                company: 'Startup.io',
                subject: 'Consulting Opportunity',
                message: 'We are building a real-time analytics platform and could use your expertise. Are you available for consulting work?',
                status: client_1.ContactStatus.READ,
                readAt: new Date('2025-12-20'),
            },
        ],
    });
    // Create newsletter subscribers
    console.log('📧 Creating newsletter subscribers...');
    await prisma.newsletterSubscriber.createMany({
        data: [
            {
                email: 'subscriber1@example.com',
                firstName: 'John',
                isConfirmed: true,
                confirmedAt: new Date('2025-10-01'),
                source: 'blog',
            },
            {
                email: 'subscriber2@example.com',
                firstName: 'Jane',
                isConfirmed: true,
                confirmedAt: new Date('2025-11-15'),
                source: 'homepage',
            },
            {
                email: 'pending@example.com',
                isConfirmed: false,
                confirmToken: 'abc123token',
                source: 'footer',
            },
        ],
    });
    // Create site settings
    console.log('⚙️  Creating site settings...');
    await prisma.siteSetting.createMany({
        data: [
            { key: 'site.title', value: JSON.stringify('Developer Portfolio') },
            { key: 'site.description', value: JSON.stringify('Full-stack developer specializing in scalable backend systems') },
            { key: 'site.author', value: JSON.stringify('Portfolio Developer') },
            { key: 'site.email', value: JSON.stringify('contact@portfolio.dev') },
            { key: 'social.github', value: JSON.stringify('https://github.com/portfolio') },
            { key: 'social.linkedin', value: JSON.stringify('https://linkedin.com/in/portfolio') },
            { key: 'social.twitter', value: JSON.stringify('https://twitter.com/portfolio') },
            { key: 'resume.url', value: JSON.stringify('/files/resume.pdf') },
            { key: 'analytics.enabled', value: JSON.stringify(true) },
        ],
    });
    // Create availability
    console.log('📅 Creating availability settings...');
    await prisma.availability.create({
        data: {
            isAvailable: true,
            status: 'Open to opportunities',
            availableFrom: new Date('2026-02-01'),
            preferredRoles: ['Senior Backend Engineer', 'Staff Engineer', 'Technical Lead'],
            preferredLocations: ['San Francisco', 'New York', 'Remote'],
            remoteOnly: false,
            notes: 'Interested in challenging backend/infrastructure roles at growth-stage startups or established tech companies.',
        },
    });
    // Create sample analytics events
    console.log('📊 Creating sample analytics events...');
    const sessions = ['session-1', 'session-2', 'session-3', 'session-4', 'session-5'];
    const analyticsData = [];
    for (let i = 0; i < 50; i++) {
        analyticsData.push({
            eventType: 'PAGE_VIEW',
            sessionId: sessions[Math.floor(Math.random() * sessions.length)],
            path: ['/', '/projects', '/blog', '/contact', '/about'][Math.floor(Math.random() * 5)],
            country: ['United States', 'United Kingdom', 'Germany', 'Canada', 'Australia'][Math.floor(Math.random() * 5)],
            browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
            device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
            referrer: ['https://google.com', 'https://linkedin.com', 'https://twitter.com', null][Math.floor(Math.random() * 4)],
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
        });
    }
    // Add project views
    for (let i = 0; i < 20; i++) {
        analyticsData.push({
            eventType: 'PROJECT_VIEW',
            sessionId: sessions[Math.floor(Math.random() * sessions.length)],
            projectId: [project1.id, project2.id, project3.id][Math.floor(Math.random() * 3)],
            path: '/projects/' + ['e-commerce-platform', 'real-time-analytics-dashboard', 'api-gateway-microservices'][Math.floor(Math.random() * 3)],
            country: ['United States', 'United Kingdom', 'Germany'][Math.floor(Math.random() * 3)],
            browser: 'Chrome',
            device: 'desktop',
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        });
    }
    await prisma.analyticsEvent.createMany({ data: analyticsData });
    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Users: 2 (admin: admin@portfolio.dev / admin123)`);
    console.log(`   - Tags: ${tags.length}`);
    console.log(`   - Projects: 3`);
    console.log(`   - Articles: 2`);
    console.log(`   - Contact submissions: 2`);
    console.log(`   - Newsletter subscribers: 3`);
    console.log(`   - Analytics events: ${analyticsData.length}`);
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map