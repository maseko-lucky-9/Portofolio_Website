import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',

    // Tests live in tests/, NOT colocated under src/. tsconfig.json has
    // `include: ["src/**/*"]` with `outDir: "./dist"`, so a src/**/*.test.ts
    // would be compiled into the shipped build and dist/ would carry test code
    // that tries to resolve vitest at runtime. `tests` is already in the
    // tsconfig `exclude` list, so this arrangement needs no tsconfig change.
    //
    // This deliberately diverges from portfolio-ui, which colocates under src/
    // -- it is a Vite app and emits no tsc build.
    include: ['tests/**/*.test.ts'],

    // config/index.ts calls process.exit(1) at IMPORT TIME when env validation
    // fails, so any test that transitively reaches it would kill the run before
    // a single assertion. DATABASE_URL and JWT_SECRET (min 32) are the only two
    // fields with no default.
    //
    // Set here rather than in the workflow so a local `npm test` behaves
    // identically to CI, and so a future job that forgets the env still works.
    // Nothing connects to either service in a unit test: PrismaClient is
    // constructed at module scope but connects lazily, and config/redis.ts --
    // which DOES open a socket on import -- is not reachable from anything
    // under tests/. Adding a test that imports it needs vi.mock('ioredis').
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://localhost:5432/unit_tests_never_connect',
      JWT_SECRET: 'unit-test-jwt-secret-at-least-32-chars-long',
      // Several tests deliberately drive error paths that log a warning. The
      // logger is still constructed and still called -- this only raises the
      // threshold above them so a passing run is readable. Tests assert on
      // thrown values, never on log output.
      LOG_LEVEL: 'fatal',
      LOG_PRETTY: 'false',
    },

    coverage: {
      provider: 'v8',
      // `json` is REQUIRED, not decorative: the codecov step in backend-ci.yml
      // uploads ./portfolio-api/coverage/coverage-final.json, which only the
      // json reporter emits. portfolio-ui declares ["text", "lcov"] and would
      // upload nothing -- do not copy that here.
      reporter: ['text', 'json', 'lcov'],
      // No threshold on purpose. None exists today; adding one would make this
      // PR's green status depend on a number nobody has agreed to.
      exclude: ['tests/**', 'dist/**', 'prisma/**', '*.config.ts'],
    },
  },
});
