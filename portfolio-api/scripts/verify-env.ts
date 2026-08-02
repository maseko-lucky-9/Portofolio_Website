/**
 * Environment Verification Script
 *
 * Run this script to verify that all environment variables are configured correctly.
 * Usage: npx ts-node scripts/verify-env.ts
 */

import { config } from '../src/config/index.js';

console.log('\n🔍 Portfolio API - Environment Verification\n');
console.log('='.repeat(50));

// Check required configurations
const checks: { name: string; value: unknown; required: boolean; sensitive?: boolean }[] = [
  // Application
  { name: 'NODE_ENV', value: config.nodeEnv, required: true },
  { name: 'PORT', value: config.port, required: true },
  { name: 'APP_URL', value: config.appUrl, required: true },

  // Database
  { name: 'DATABASE_URL', value: config.database.url, required: true, sensitive: true },

  // Redis
  { name: 'REDIS_URL', value: config.redis.url, required: true, sensitive: true },

  // Authentication
  { name: 'JWT_SECRET', value: config.auth.jwtSecret, required: true, sensitive: true },

  // CORS
  { name: 'CORS_ORIGIN', value: config.cors.origin, required: true },
];

let hasErrors = false;

checks.forEach(({ name, value, required, sensitive }) => {
  const displayValue = sensitive
    ? value
      ? `${String(value).substring(0, 10)}...`
      : 'NOT SET'
    : String(value);

  if (!value && required) {
    console.log(`❌ ${name}: NOT SET (Required)`);
    hasErrors = true;
  } else if (!value) {
    console.log(`⚠️  ${name}: NOT SET (Optional)`);
  } else {
    console.log(`✅ ${name}: ${displayValue}`);
  }
});

console.log('\n' + '='.repeat(50));

// Test database connection
console.log('\n🗄️  Testing Database Connection...');
import { prisma, connectDatabase } from '../src/config/database.js';

connectDatabase()
  .then(async () => {
    console.log('✅ Database connection successful');

    // Test Redis connection
    console.log('\n📦 Testing Redis Connection...');
    const { redis } = await import('../src/config/redis.js');

    try {
      const pong = await redis.ping();
      console.log(`✅ Redis connection successful (PING: ${pong})`);
    } catch (error) {
      console.log('❌ Redis connection failed:', error);
      hasErrors = true;
    }

    // Cleanup
    await prisma.$disconnect();
    await redis.quit();

    console.log('\n' + '='.repeat(50));

    if (hasErrors) {
      console.log('\n❌ Environment verification failed. Please check the errors above.\n');
      process.exit(1);
    } else {
      console.log('\n✅ All environment checks passed!\n');
      process.exit(0);
    }
  })
  .catch((error) => {
    console.log('❌ Database connection failed:', error.message);
    process.exit(1);
  });
