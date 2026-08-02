import Redis from 'ioredis';
import { config } from './index.js';
import { createLogger } from './logger.js';

const logger = createLogger('redis');

// Create Redis client
export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number): number {
    const delay = Math.min(times * 50, 2000);
    logger.warn({ times, delay }, 'Redis connection retry');
    return delay;
  },
  reconnectOnError(err: Error): boolean {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some((e) => err.message.includes(e));
  },
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('ready', () => {
  logger.info('Redis ready');
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis error');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

// Cache helper functions
export const cache = {
  /**
   * Get cached value or compute and cache it
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttlSeconds: number = 3600): Promise<T> {
    const cached = await redis.get(key);
    if (cached) {
      logger.debug({ key }, 'Cache hit');
      return JSON.parse(cached) as T;
    }

    logger.debug({ key }, 'Cache miss');
    const value = await fn();
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
    return value;
  },

  /**
   * Set a cached value
   */
  async set(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  },

  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? (JSON.parse(cached) as T) : null;
  },

  /**
   * Delete a cached value
   */
  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug({ pattern, count: keys.length }, 'Cache keys deleted');
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    return (await redis.exists(key)) === 1;
  },

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    return redis.incr(key);
  },

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    return redis.ttl(key);
  },
};

// Cache key generators
export const cacheKeys = {
  // The `v2` on the detail keys is a deliberate namespace bump, not decoration.
  //
  // Until this change, getProjectBySlug/getArticleBySlug were
  // `findUnique({ where: { slug } })` with no status predicate and cached
  // whatever they found -- including DRAFT and ARCHIVED rows. Those entries
  // live in redis with a one-hour TTL and are NOT removed by a deploy, so
  // without a new namespace the first request after this ships could still be
  // served an unpublished payload straight from the old key.
  //
  // The status re-check in the services is the real fix, since it also covers
  // entries written after the deploy; this just makes the carry-over window
  // zero instead of one TTL.
  project: (slug: string): string => `project:v2:${slug}`,
  projectList: (page: number, filters: string): string => `projects:list:${page}:${filters}`,
  article: (slug: string): string => `article:v2:${slug}`,
  articleList: (page: number, filters: string): string => `articles:list:${page}:${filters}`,
  analytics: (type: string, date: string): string => `analytics:${type}:${date}`,
  settings: (key: string): string => `settings:${key}`,
  availability: (): string => 'availability',
  rateLimit: (ip: string, endpoint: string): string => `ratelimit:${ip}:${endpoint}`,
  session: (id: string): string => `session:${id}`,
  codeExecution: (hash: string): string => `code:${hash}`,
};

export default redis;
