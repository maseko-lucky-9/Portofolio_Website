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

    // Every spec shares ONE database and ONE redis, so files must not run
    // concurrently: an admin spec that unpublishes a project while another
    // file is reading the project list produces a failure that has nothing to
    // do with the code under test.
    //
    // This MUST be `fileParallelism`, not `poolOptions.forks.singleFork`.
    // Vitest 4 removed poolOptions and silently ignores it -- it only prints a
    // DEPRECATED line and carries on running files in parallel, so the
    // serialisation this config claimed was never in effect. The observable
    // check is wall-clock: with parallelism the run finishes in less time than
    // the summed per-file test time; serialised, it takes longer than either.
    pool: 'forks',
    fileParallelism: false,

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

      // Every app.inject() resolves to the same request.ip, so the WHOLE suite
      // draws on one rate-limit bucket -- default 100 per 60s. The suite is
      // already at ~45 requests and will only grow, and exhaustion would not
      // fail cleanly: several specs assert `>= 400` or "body has no <script>",
      // both of which a 429 satisfies. That is a false green, which is worse
      // than a red. Raised here so the limiter never silently shapes results.
      //
      // The limiter itself deserves its own spec that sets a low ceiling and
      // asserts the TOO_MANY_REQUESTS envelope; noted as a follow-up rather
      // than bolted on here, because it needs its own app instance.
      RATE_LIMIT_MAX: '100000',
    },

    // No coverage block. Coverage is vitest.config.ts's job; merging two v8
    // runs over the same src/ produces a number that describes neither suite.
  },
});
