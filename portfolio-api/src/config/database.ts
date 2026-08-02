import { PrismaClient } from '@prisma/client';
import { createLogger } from './logger.js';
import { config } from './index.js';

const logger = createLogger('database');

// Prisma client singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isDevelopment
      ? [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'stdout' },
          { level: 'warn', emit: 'stdout' },
        ]
      : [{ level: 'error', emit: 'stdout' }],
  });

// Log queries in development
if (config.isDevelopment) {
  prisma.$on('query' as never, (e: { query: string; duration: number; params: string }) => {
    logger.debug(
      {
        query: e.query,
        duration: `${e.duration}ms`,
        params: e.params,
      },
      'Database query'
    );
  });
}

// Prevent multiple instances in development
if (config.isDevelopment) {
  globalForPrisma.prisma = prisma;
}

// Connection helper
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to database');
    throw error;
  }
};

// Disconnect helper
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};

// Health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};

export default prisma;
