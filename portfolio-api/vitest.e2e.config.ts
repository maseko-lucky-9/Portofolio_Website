import { defineConfig } from 'vitest/config';

// End-to-end suite. Unlike vitest.config.ts (pure unit tests, no I/O), every
// spec here builds the REAL Fastify app via buildApp() and drives it with
// app.inject(), against a live postgres and redis.
//
// The `Integration Tests` job in backend-ci.yml runs this via `npm run test:e2e`.
// That job has never once passed, for the single reason that this file did not
// exist -- `git log --all -- portfolio-api/vitest.e2e.config.ts` returns nothing.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',

    // Scoped to tests/e2e/ specifically, and vitest.config.ts is scoped to
    // tests/unit/. The two globs must stay disjoint: the unit job has no
    // `services:` block, so if it ever collected these specs it would try to
    // reach a database that is not there and take `build` and `api-contract`
    // down with it (both are needs-gated behind it).
    include: ['tests/e2e/**/*.test.ts'],

    // Every spec shares ONE database. The default worker pool would run files
    // in parallel and let one spec's writes land in the middle of another's
    // reads. singleFork serialises them. Correct trade at this suite size --
    // revisit only if the job gets slow, and then by giving each file its own
    // schema rather than by removing this.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },

    // Clears this app's cached reads before the suite. The services cache list
    // responses in redis, so without this a second local run can be served a
    // response built from an older dataset. See the file for why it is scoped
    // rather than a flushall.
    globalSetup: ['./tests/e2e/global-setup.ts'],

    // Booting the app connects to postgres and redis, so the first spec pays a
    // real connection cost. The 5s default is enough on a warm machine and not
    // on a cold CI runner pulling two service containers.
    testTimeout: 30_000,
    hookTimeout: 30_000,

    // NODE_ENV only. DATABASE_URL / REDIS_URL / JWT_SECRET come from the
    // environment -- the workflow supplies them (backend-ci.yml:237-243), and
    // locally they come from the shell. This deliberately diverges from
    // vitest.config.ts, which hardcodes a DATABASE_URL precisely BECAUSE
    // nothing there is allowed to connect. Hardcoding a URL here would either
    // point at the wrong database or silently override CI's.
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'fatal',
      LOG_PRETTY: 'false',
    },

    // No coverage block. Coverage is vitest.config.ts's job; merging two v8
    // runs over the same src/ produces a number that describes neither suite.
  },
});
