// scripts/init-redis.ts
/**
 * Redis Initialization Script
 * 
 * Warms up Redis cache with frequently accessed data and configures
 * session storage, rate limiting, and pub/sub channels.
 * 
 * Usage:
 *   tsx scripts/init-redis.ts
 */

import { PrismaClient, ProjectStatus, ArticleStatus } from '@prisma/client';
import Redis from 'ioredis';
import { config } from '../src/config';

const prisma = new PrismaClient();
const redis = new Redis(config.redis.url);

// ==========================================
// Cache Key Patterns
// ==========================================

const CACHE_KEYS = {
  project: (slug: string) => `project:${slug}`,
  projectList: (params: string) => `projects:list:${params}`,
  article: (slug: string) => `article:${slug}`,
  articleList: (params: string) => `articles:list:${params}`,
  tag: (slug: string) => `tag:${slug}`,
  tagList: () => 'tags:list',
  featured: (type: 'project' | 'article') => `featured:${type}`,
  stats: () => 'stats:global',
} as const;

// ==========================================
// Cache TTL (Time To Live) in seconds
// ==========================================

const CACHE_TTL = {
  project: 3600,        // 1 hour
  article: 3600,        // 1 hour
  featured: 1800,       // 30 minutes
  tag: 7200,            // 2 hours
  stats: 300,           // 5 minutes
  rateLimit: 60,        // 1 minute
} as const;

// ==========================================
// Cache Warmup Functions
// ==========================================

async function warmupProjects(): Promise<void> {
  console.log('📁 Warming up project cache...');
  
  // Cache published projects list
  const projects = await prisma.project.findMany({
    where: { status: ProjectStatus.PUBLISHED },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
    take: 20,
  });
  
  // Cache full list
  const listKey = CACHE_KEYS.projectList('published');
  await redis.setex(listKey, CACHE_TTL.project, JSON.stringify(projects));
  console.log(`   ✅ Cached ${projects.length} projects`);
  
  // Cache individual projects
  for (const project of projects) {
    const key = CACHE_KEYS.project(project.slug);
    await redis.setex(key, CACHE_TTL.project, JSON.stringify(project));
  }
  console.log(`   ✅ Cached individual project pages`);
  
  // Cache featured projects
  const featured = projects.filter(p => p.featured).slice(0, 3);
  const featuredKey = CACHE_KEYS.featured('project');
  await redis.setex(featuredKey, CACHE_TTL.featured, JSON.stringify(featured));
  console.log(`   ✅ Cached ${featured.length} featured projects\n`);
}

async function warmupArticles(): Promise<void> {
  console.log('📝 Warming up article cache...');
  
  const articles = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });
  
  // Cache full list
  const listKey = CACHE_KEYS.articleList('published');
  await redis.setex(listKey, CACHE_TTL.article, JSON.stringify(articles));
  console.log(`   ✅ Cached ${articles.length} articles`);
  
  // Cache individual articles
  for (const article of articles) {
    const key = CACHE_KEYS.article(article.slug);
    await redis.setex(key, CACHE_TTL.article, JSON.stringify(article));
  }
  console.log(`   ✅ Cached individual article pages`);
  
  // Cache featured articles
  const featured = articles.filter(a => a.featured).slice(0, 3);
  const featuredKey = CACHE_KEYS.featured('article');
  await redis.setex(featuredKey, CACHE_TTL.featured, JSON.stringify(featured));
  console.log(`   ✅ Cached ${featured.length} featured articles\n`);
}

async function warmupTags(): Promise<void> {
  console.log('🏷️  Warming up tags cache...');
  
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          projects: true,
          articles: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
  
  // Cache full tag list
  const listKey = CACHE_KEYS.tagList();
  await redis.setex(listKey, CACHE_TTL.tag, JSON.stringify(tags));
  console.log(`   ✅ Cached ${tags.length} tags`);
  
  // Cache individual tags
  for (const tag of tags) {
    const key = CACHE_KEYS.tag(tag.slug);
    await redis.setex(key, CACHE_TTL.tag, JSON.stringify(tag));
  }
  console.log(`   ✅ Cached individual tag pages\n`);
}

async function cacheGlobalStats(): Promise<void> {
  console.log('📊 Caching global statistics...');
  
  const stats = {
    projects: {
      total: await prisma.project.count({ where: { status: ProjectStatus.PUBLISHED } }),
      views: await prisma.project.aggregate({
        where: { status: ProjectStatus.PUBLISHED },
        _sum: { views: true },
      }),
      likes: await prisma.project.aggregate({
        where: { status: ProjectStatus.PUBLISHED },
        _sum: { likes: true },
      }),
    },
    articles: {
      total: await prisma.article.count({ where: { status: ArticleStatus.PUBLISHED } }),
      views: await prisma.article.aggregate({
        where: { status: ArticleStatus.PUBLISHED },
        _sum: { views: true },
      }),
      likes: await prisma.article.aggregate({
        where: { status: ArticleStatus.PUBLISHED },
        _sum: { likes: true },
      }),
    },
    tags: {
      total: await prisma.tag.count(),
    },
    lastUpdated: new Date().toISOString(),
  };
  
  const key = CACHE_KEYS.stats();
  await redis.setex(key, CACHE_TTL.stats, JSON.stringify(stats));
  console.log(`   ✅ Cached global statistics\n`);
}

// ==========================================
// Session Storage Setup
// ==========================================

async function setupSessionStorage(): Promise<void> {
  console.log('🔐 Setting up session storage...');
  
  // Session configuration
  const sessionConfig = {
    prefix: 'sess:',
    ttl: 86400, // 24 hours
  };
  
  // Store session config
  await redis.set('config:session', JSON.stringify(sessionConfig));
  
  console.log('   ✅ Session storage configured');
  console.log(`   - Prefix: ${sessionConfig.prefix}`);
  console.log(`   - TTL: ${sessionConfig.ttl}s (24 hours)\n`);
}

// ==========================================
// Rate Limiting Configuration
// ==========================================

async function setupRateLimiting(): Promise<void> {
  console.log('⚡ Setting up rate limiting...');
  
  // Rate limit configurations
  const rateLimits = [
    {
      name: 'api:default',
      max: 100,
      window: 60, // 1 minute
      description: 'Default API rate limit',
    },
    {
      name: 'api:auth',
      max: 5,
      window: 60,
      description: 'Authentication endpoints',
    },
    {
      name: 'api:contact',
      max: 3,
      window: 3600, // 1 hour
      description: 'Contact form submissions',
    },
    {
      name: 'api:analytics',
      max: 1000,
      window: 60,
      description: 'Analytics events',
    },
  ];
  
  for (const limit of rateLimits) {
    const key = `ratelimit:config:${limit.name}`;
    await redis.set(key, JSON.stringify(limit));
    console.log(`   ✅ ${limit.name}: ${limit.max} req/${limit.window}s`);
  }
  
  console.log('');
}

// ==========================================
// Pub/Sub Channels Setup
// ==========================================

async function setupPubSubChannels(): Promise<void> {
  console.log('📡 Setting up Pub/Sub channels...');
  
  const channels = [
    {
      name: 'analytics:events',
      description: 'Real-time analytics events',
    },
    {
      name: 'cache:invalidate',
      description: 'Cache invalidation events',
    },
    {
      name: 'notifications:email',
      description: 'Email notification queue',
    },
    {
      name: 'admin:updates',
      description: 'Admin dashboard updates',
    },
  ];
  
  // Store channel config
  await redis.set('config:channels', JSON.stringify(channels));
  
  for (const channel of channels) {
    console.log(`   ✅ ${channel.name}`);
  }
  
  console.log('');
}

// ==========================================
// Cache Invalidation Patterns
// ==========================================

async function setupCacheInvalidation(): Promise<void> {
  console.log('🔄 Setting up cache invalidation patterns...');
  
  const patterns = {
    project: {
      onCreate: ['projects:list:*', 'featured:project', 'stats:global'],
      onUpdate: ['project:{slug}', 'projects:list:*', 'featured:project'],
      onDelete: ['project:{slug}', 'projects:list:*', 'featured:project', 'stats:global'],
    },
    article: {
      onCreate: ['articles:list:*', 'featured:article', 'stats:global'],
      onUpdate: ['article:{slug}', 'articles:list:*', 'featured:article'],
      onDelete: ['article:{slug}', 'articles:list:*', 'featured:article', 'stats:global'],
    },
    tag: {
      onCreate: ['tags:list', 'stats:global'],
      onUpdate: ['tag:{slug}', 'tags:list'],
      onDelete: ['tag:{slug}', 'tags:list', 'projects:list:*', 'articles:list:*'],
    },
  };
  
  await redis.set('config:cache-invalidation', JSON.stringify(patterns));
  console.log('   ✅ Cache invalidation patterns configured\n');
}

// ==========================================
// Health Check Data
// ==========================================

async function setupHealthCheck(): Promise<void> {
  console.log('🏥 Setting up health check data...');
  
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
  };
  
  await redis.setex('health:check', 30, JSON.stringify(healthData));
  console.log('   ✅ Health check data initialized\n');
}

// ==========================================
// Cleanup Old Keys
// ==========================================

async function cleanupOldKeys(): Promise<void> {
  console.log('🧹 Cleaning up old cache keys...');
  
  const patterns = [
    'project:*',
    'projects:*',
    'article:*',
    'articles:*',
    'tag:*',
    'tags:*',
    'featured:*',
    'stats:*',
  ];
  
  let totalDeleted = 0;
  
  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      totalDeleted += keys.length;
    }
  }
  
  console.log(`   ✅ Deleted ${totalDeleted} old keys\n`);
}

// ==========================================
// Main Function
// ==========================================

async function main(): Promise<void> {
  console.log('\n🚀 Initializing Redis...\n');
  
  try {
    // Test connection
    await redis.ping();
    console.log('✅ Connected to Redis\n');
    
    // Cleanup old keys
    await cleanupOldKeys();
    
    // Warmup cache
    await warmupProjects();
    await warmupArticles();
    await warmupTags();
    await cacheGlobalStats();
    
    // Setup features
    await setupSessionStorage();
    await setupRateLimiting();
    await setupPubSubChannels();
    await setupCacheInvalidation();
    await setupHealthCheck();
    
    // Get Redis info
    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:(.+)/);
    const memory = memoryMatch ? memoryMatch[1].trim() : 'unknown';
    
    const keyCount = await redis.dbsize();
    
    console.log('✅ Redis initialization complete!\n');
    console.log('📊 Redis Status:');
    console.log(`   Keys:   ${keyCount}`);
    console.log(`   Memory: ${memory}\n`);
    
    console.log('🔑 Cache Keys Created:');
    console.log('   - Projects (list + individual)');
    console.log('   - Articles (list + individual)');
    console.log('   - Tags (list + individual)');
    console.log('   - Featured content');
    console.log('   - Global statistics\n');
    
  } catch (error) {
    console.error('\n❌ Redis initialization failed:', error);
    throw error;
  }
}

// Run initialization
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });
