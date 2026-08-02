import Redis from 'ioredis';

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

export async function setup(): Promise<void> {
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
