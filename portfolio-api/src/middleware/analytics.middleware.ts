import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import UAParser from 'ua-parser-js';
import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import { createLogger } from '../config/logger.js';
import { config } from '../config/index.js';
import { generateSessionId, generateVisitorId } from '../utils/crypto.js';
import { EventType, Prisma } from '@prisma/client';

const logger = createLogger('analytics');

// What getGeoFromIp stores in Redis and returns: all three fields always set.
const geoSchema = z.object({
  country: z.string(),
  region: z.string(),
  city: z.string(),
});

// What ipinfo.io actually sends. Every field is optional -- the API omits
// `city` and `region` for some IP ranges, which the caller already defaults to
// 'Unknown'.
const ipinfoResponseSchema = z.object({
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
});

// Analytics context attached to request
export interface AnalyticsContext {
  sessionId: string;
  visitorId: string;
  ipAddress: string;
  userAgent: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

export interface RequestWithAnalytics extends FastifyRequest {
  analytics: AnalyticsContext;
}

// Get or create session/visitor IDs from cookies
const getOrCreateIds = (request: FastifyRequest): { sessionId: string; visitorId: string } => {
  // Try to get from headers (for API clients)
  let sessionId = request.headers['x-session-id'] as string;
  let visitorId = request.headers['x-visitor-id'] as string;

  // Generate if not provided
  if (!sessionId) {
    sessionId = generateSessionId();
  }

  if (!visitorId) {
    visitorId = generateVisitorId();
  }

  return { sessionId, visitorId };
};

// Parse user agent
const parseUserAgent = (
  ua: string
): {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
} => {
  const parser = new UAParser(ua);
  const result = parser.getResult();

  return {
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || '',
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || '',
    device: result.device.type || 'desktop',
  };
};

// Get client IP address
const getClientIp = (request: FastifyRequest): string => {
  const xForwardedFor = request.headers['x-forwarded-for'];
  const xRealIp = request.headers['x-real-ip'];

  if (xForwardedFor) {
    const ips = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    return ips.split(',')[0].trim();
  }

  if (xRealIp) {
    return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  }

  return request.ip;
};

// Get UTM parameters from query string
const getUtmParams = (
  query: Record<string, unknown>
): { utmSource: string | null; utmMedium: string | null; utmCampaign: string | null } => {
  return {
    utmSource: (query.utm_source as string) || null,
    utmMedium: (query.utm_medium as string) || null,
    utmCampaign: (query.utm_campaign as string) || null,
  };
};

// Analytics middleware - attaches tracking context
export const analyticsMiddleware = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  if (!config.analytics.enabled) {
    return;
  }

  const { sessionId, visitorId } = getOrCreateIds(request);
  const userAgent = request.headers['user-agent'] || '';
  const referrer = (request.headers.referer as string) || null;
  const ipAddress = getClientIp(request);
  const uaInfo = parseUserAgent(userAgent);
  const utmParams = getUtmParams(request.query as Record<string, unknown>);

  (request as RequestWithAnalytics).analytics = {
    sessionId,
    visitorId,
    ipAddress,
    userAgent,
    ...uaInfo,
    referrer,
    ...utmParams,
  };
};

// Geo lookup from IP (using ipinfo.io)
export const getGeoFromIp = async (
  ip: string
): Promise<{ country: string; region: string; city: string } | null> => {
  if (!config.analytics.ipinfoToken) {
    return null;
  }

  // Skip local IPs
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: 'Local', region: 'Local', city: 'Local' };
  }

  // Check cache
  const cacheKey = `geo:${ip}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    // Redis hands back a string this process wrote days ago -- or that some
    // other writer did. Treat anything that does not round-trip as a cache
    // miss and fall through to the live lookup, rather than letting a poisoned
    // or legacy entry throw inside analytics middleware.
    let raw: unknown = null;
    try {
      raw = JSON.parse(cached) as unknown;
    } catch {
      // fall through to the live lookup
    }

    const parsed = geoSchema.safeParse(raw);
    if (parsed.success) {
      return parsed.data;
    }

    logger.warn({ ip }, 'Discarding unparseable cached geo entry');
  }

  try {
    const response = await fetch(`https://ipinfo.io/${ip}?token=${config.analytics.ipinfoToken}`);
    if (!response.ok) {
      return null;
    }

    const data = ipinfoResponseSchema.parse(await response.json());
    const geo = {
      // `||`, not `??`: ipinfo returns '' as well as omitting the key, and an
      // empty string is not a usable region name.
      country: data.country || 'Unknown',
      region: data.region || 'Unknown',
      city: data.city || 'Unknown',
    };

    // Cache for 24 hours
    await redis.setex(cacheKey, 86400, JSON.stringify(geo));
    return geo;
  } catch (error) {
    logger.warn({ error, ip }, 'Failed to get geo data');
    return null;
  }
};

// Track an analytics event
export const trackEvent = async (
  request: RequestWithAnalytics,
  eventType: EventType,
  data?: {
    projectId?: string;
    articleId?: string;
    path?: string;
    eventData?: Record<string, unknown>;
    duration?: number;
  }
): Promise<void> => {
  if (!config.analytics.enabled) {
    return;
  }

  const analytics = request.analytics;
  if (!analytics) {
    return;
  }

  try {
    // Get geo data asynchronously
    const geo = await getGeoFromIp(analytics.ipAddress);

    await prisma.analyticsEvent.create({
      data: {
        eventType,
        sessionId: analytics.sessionId,
        visitorId: analytics.visitorId,
        ipAddress: analytics.ipAddress,
        userAgent: analytics.userAgent,
        browser: analytics.browser,
        browserVersion: analytics.browserVersion,
        os: analytics.os,
        osVersion: analytics.osVersion,
        device: analytics.device,
        referrer: analytics.referrer,
        utmSource: analytics.utmSource,
        utmMedium: analytics.utmMedium,
        utmCampaign: analytics.utmCampaign,
        country: geo?.country,
        region: geo?.region,
        city: geo?.city,
        path: data?.path,
        projectId: data?.projectId,
        articleId: data?.articleId,
        eventData: data?.eventData as Prisma.InputJsonValue | undefined,
        duration: data?.duration,
      },
    });

    // Update real-time visitor count
    await redis.incr('realtime:visitors');
    await redis.expire('realtime:visitors', 300); // 5 min TTL

    logger.debug({ eventType, sessionId: analytics.sessionId }, 'Event tracked');
  } catch (error) {
    logger.error({ error, eventType }, 'Failed to track event');
  }
};

// Get real-time visitor count
export const getRealtimeVisitors = async (): Promise<number> => {
  const count = await redis.get('realtime:visitors');
  return parseInt(count || '0', 10);
};
