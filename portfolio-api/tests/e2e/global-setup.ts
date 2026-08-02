import Redis from 'ioredis';
import dotenv from 'dotenv';

// The specs resolve their database through src/config/index.ts, which calls
// dotenv.config() at import. This file is loaded by vitest OUTSIDE that module
// graph, so without loading .env here too the guard below would evaluate a
// different (empty) environment than the one the specs actually connect with --
// it would abort on a machine where the suite is perfectly well configured,
// and, worse, it would never inspect the value that is really used.
//
// dotenv does not overwrite an already-set variable, so an explicit export
// still wins, exactly as it does for the app.
dotenv.config();

/**
 * Clear the app's cached reads once, before the e2e suite runs.
 *
 * Not hygiene theatre -- this was hit twice while writing the suite. The
 * services cache list responses in redis, so a run that executed against an
 * older dataset leaves entries that the next run happily serves: after adding
 * an article to the seed, `GET /api/v1/articles` kept returning the previously
 * cached empty list and the spec failed for a reason that had nothing to do
 * with the code under test.
 *
 * CI never sees this (its redis container is new every job), which is exactly
 * what makes it worth handling: the failure only ever appears on a developer's
 * second local run, where it looks like a real regression.
 *
 * Deliberately NOT `flushall`. Local redis is usually shared with other
 * projects, and a test suite that wipes someone's unrelated data has done far
 * more damage than the flake it prevented. Only this app's own namespaces are
 * removed, via SCAN rather than KEYS so a large keyspace is not blocked.
 */
const NAMESPACES = [
  'projects:list:*',
  'articles:list:*',
  'project:*',
  'article:*',
  'rl:*', // rate-limit buckets; a previous run must not exhaust this run's quota
];

/**
 * Refuse to run against anything that does not look like a throwaway database.
 *
 * This suite is not read-only and this guard is not paranoia. It registers
 * users, promotes one of them to ADMIN with a direct prisma call, creates and
 * deletes project rows, and the seed it depends on writes DRAFT fixtures. The
 * target comes entirely from DATABASE_URL, and .env supplies it whenever the
 * shell does not -- so `npm run test:e2e` with nothing exported runs against
 * whatever .env points at, which on a developer machine is usually their real
 * development database.
 *
 * One guard here covers every spec, rather than each file re-implementing it.
 * Set E2E_ALLOW_ANY_DATABASE=1 to override deliberately.
 */
function assertDisposableDatabase(): void {
  if (process.env.E2E_ALLOW_ANY_DATABASE === '1') return;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('e2e: DATABASE_URL is not set. Refusing to guess a target.');
  }

  let host: string;
  let name: string;
  try {
    const parsed = new URL(url);
    host = parsed.hostname;
    name = parsed.pathname.replace(/^\//, '');
  } catch {
    throw new Error('e2e: DATABASE_URL is not a parseable URL.');
  }

  // The database NAME is the discriminator, deliberately -- not the host.
  //
  // "it's only localhost" is not a safety property: a developer's primary
  // development database usually lives there, and .env points at exactly that
  // (portfolio_db). Accepting any local host would let `npm run test:e2e` with
  // no exported variable promote an account to ADMIN and delete rows in the
  // database they actually work in.
  //
  // Both real callers already satisfy this: CI uses portfolio_test, and the
  // documented local setup uses a dedicated *_e2e database. The cost is one
  // explicit export; the alternative is a suite that can quietly eat your work.
  if (!/(^|[_-])(test|e2e)([_-]|$)/i.test(name)) {
    throw new Error(
      `e2e: refusing to run against database "${name}" (host "${host}"). ` +
        'This suite registers users, promotes one to ADMIN and deletes rows, ' +
        'so it only runs against a database whose name marks it disposable ' +
        '(e.g. portfolio_test, portfolio_e2e). Export DATABASE_URL at such a ' +
        'database, or set E2E_ALLOW_ANY_DATABASE=1 to override deliberately.'
    );
  }
}

export async function setup(): Promise<void> {
  assertDisposableDatabase();

  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  try {
    await redis.connect();
  } catch {
    // No redis: let the specs themselves report it. Failing here would blame
    // the setup for what is really an environment problem, and the health spec
    // gives a far clearer message.
    redis.disconnect();
    return;
  }

  let removed = 0;
  for (const pattern of NAMESPACES) {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 250);
      cursor = next;
      if (keys.length > 0) {
        await redis.del(...keys);
        removed += keys.length;
      }
    } while (cursor !== '0');
  }

  if (removed > 0) {
    console.log(`[e2e setup] cleared ${removed} cached key(s) from previous runs`);
  }

  await redis.quit();
}
