// prisma/seed.ts
/**
 * Database seed.
 *
 * Creates the minimum dataset `scripts/verify-database.ts` asserts, and nothing
 * more: 1 ADMIN user, 5 tags, 1 PUBLISHED project with a publishedAt date, and
 * 1 project->tag link. Those are exactly the five assertions that fail on a
 * migrate-only database; every other check in that script (the 9 index
 * assertions, the uniqueness checks, the perf thresholds) already passes.
 *
 * Usage:
 *   npm run db:seed
 *
 * Two deliberate differences from the compiled `seed.js` this replaces (a build
 * artifact whose TypeScript source was never committed):
 *
 * 1. IDEMPOTENT, NOT DESTRUCTIVE. seed.js opened with 17 `deleteMany()` calls --
 *    a full wipe of every table. `db:seed` is chained from `setup:dev`, and it
 *    has been broken (pointing at this missing file) for its whole life, so
 *    nothing depends on wipe semantics. Re-running this is a no-op.
 *
 * 2. NO COMMITTED CREDENTIAL. The admin password comes from
 *    SEED_ADMIN_PASSWORD. If unset, a random one is generated and discarded --
 *    the account exists to satisfy the "an ADMIN exists" check and to own the
 *    project row, not to be logged into. Set the env var if you want to log in.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Matches the app default (config.auth.bcryptRounds). Imported literally rather
// than via src/config, which process.exit(1)s at import unless the FULL env
// schema validates -- the seed only needs DATABASE_URL.
const BCRYPT_ROUNDS = 10;

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';

const TAGS: Array<{ name: string; slug: string; color: string }> = [
  { name: 'TypeScript', slug: 'typescript', color: '#3178C6' },
  { name: 'React', slug: 'react', color: '#61DAFB' },
  { name: 'Node.js', slug: 'nodejs', color: '#339933' },
  { name: 'PostgreSQL', slug: 'postgresql', color: '#4169E1' },
  { name: 'Kubernetes', slug: 'kubernetes', color: '#326CE5' },
];

const PROJECT_SLUG = 'portfolio-website';
const ARTICLE_SLUG = 'hello-world';

// A SECOND published row of each kind exists so page-size assertions can
// actually fail. With one row, `data.length <= 1` holds even if `limit` is
// ignored outright, so the test proves nothing.
const PROJECT_SLUG_2 = 'api-platform';
const ARTICLE_SLUG_2 = 'second-post';

// An unpublished row of each kind, so the e2e suite can assert that anonymous
// callers cannot read DRAFT content. Without a DRAFT fixture the access-control
// tests would pass against a service with no status filter at all -- which is
// exactly the regression they exist to catch.
const DRAFT_PROJECT_SLUG = 'unannounced-project';
const DRAFT_ARTICLE_SLUG = 'unpublished-post';

// ARCHIVED fixtures matter at least as much as DRAFT ones: deleteProject and
// deleteArticle are SOFT deletes that just set status = ARCHIVED, so ARCHIVED
// is how retracted content actually exists in production. Without these rows,
// relaxing the filter to `status: { not: 'DRAFT' }` -- a natural-looking
// refactor -- would pass every access-control test while re-exposing
// everything an admin has ever deleted.
const ARCHIVED_PROJECT_SLUG = 'retracted-project';
const ARCHIVED_ARTICLE_SLUG = 'retracted-post';

async function main(): Promise<void> {
  console.log('\n🌱 Seeding database...\n');

  // The seed takes its target purely from DATABASE_URL, and `db:seed` is chained
  // from `setup:dev`, so an inherited or mistyped env var is all it takes to
  // create a dormant ADMIN principal in a real database. It would not be
  // loginable (the password is random and discarded), but an unowned ADMIN row
  // is standing attack surface for any future account-takeover bug, and
  // `update: {}` means no later seed run would ever clean it up.
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_ADMIN_EMAIL) {
    throw new Error(
      'Refusing to seed a default admin into a production environment. ' +
        'Set SEED_ADMIN_EMAIL explicitly if this is really what you want.'
    );
  }

  // --- Admin user -----------------------------------------------------------
  const password = process.env.SEED_ADMIN_PASSWORD ?? randomBytes(24).toString('hex');
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // `update: {}` on purpose: re-running must not silently rotate the password
  // of an existing admin. Only the create path sets the hash.
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      firstName: 'Portfolio',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log('   (random password generated and discarded — set SEED_ADMIN_PASSWORD to log in)');
  }

  // --- Tags -----------------------------------------------------------------
  const tags = [];
  for (const tag of TAGS) {
    tags.push(
      await prisma.tag.upsert({
        where: { slug: tag.slug },
        update: {},
        create: tag,
      })
    );
  }
  console.log(`✅ Tags: ${tags.length}`);

  // --- Project --------------------------------------------------------------
  // publishedAt must be non-null whenever status is PUBLISHED, or
  // verify-database.ts:200-211 fails.
  const project = await prisma.project.upsert({
    where: { slug: PROJECT_SLUG },
    update: {},
    create: {
      slug: PROJECT_SLUG,
      title: 'Portfolio Website',
      description: 'A full-stack developer portfolio with a Fastify API and a React front end.',
      content: '# Portfolio Website\n\nSeeded project used by the integration suite.',
      techStack: ['TypeScript', 'Fastify', 'React', 'PostgreSQL'],
      status: 'PUBLISHED',
      publishedAt: new Date(),
      featured: true,
      authorId: admin.id,
    },
  });
  console.log(`✅ Project: ${project.slug}`);

  // --- Project -> tag link --------------------------------------------------
  // The compound unique ([projectId, tagId]) makes this idempotent.
  await prisma.projectTag.upsert({
    where: {
      projectId_tagId: { projectId: project.id, tagId: tags[0].id },
    },
    update: {},
    create: { projectId: project.id, tagId: tags[0].id },
  });
  console.log(`✅ Project tag: ${project.slug} -> ${tags[0].slug}`);

  // --- Article --------------------------------------------------------------
  // Strictly speaking db:verify does not need this (articles and articleTags
  // both have min: 0). It exists so tests/e2e/articles.test.ts can pin the
  // response-serialisation fix on the ARTICLE routes as well as the project
  // ones -- the two files had the identical `200: { type: 'object' }` defect,
  // and fixing both while testing only one is how the second regresses.
  const article = await prisma.article.upsert({
    where: { slug: ARTICLE_SLUG },
    update: {},
    create: {
      slug: ARTICLE_SLUG,
      title: 'Hello World',
      content: '# Hello World\n\nSeeded article used by the integration suite.',
      excerpt: 'Seeded article used by the integration suite.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId: admin.id,
    },
  });
  console.log(`✅ Article: ${article.slug}`);

  await prisma.articleTag.upsert({
    where: {
      articleId_tagId: { articleId: article.id, tagId: tags[0].id },
    },
    update: {},
    create: { articleId: article.id, tagId: tags[0].id },
  });
  console.log(`✅ Article tag: ${article.slug} -> ${tags[0].slug}`);

  // --- Second published row of each kind ------------------------------------
  await prisma.project.upsert({
    where: { slug: PROJECT_SLUG_2 },
    update: {},
    create: {
      slug: PROJECT_SLUG_2,
      title: 'API Platform',
      description: 'A second published project, so page-size assertions can fail.',
      content: '# API Platform\n\nSeeded project used by the integration suite.',
      techStack: ['TypeScript', 'Fastify'],
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId: admin.id,
    },
  });
  await prisma.article.upsert({
    where: { slug: ARTICLE_SLUG_2 },
    update: {},
    create: {
      slug: ARTICLE_SLUG_2,
      title: 'Second Post',
      content: '# Second Post\n\nSeeded article used by the integration suite.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId: admin.id,
    },
  });
  console.log('✅ Second published project + article');

  // --- Unpublished fixtures -------------------------------------------------
  // publishedAt stays null, which is what verify-database.ts:200-211 requires
  // of anything that is not PUBLISHED.
  await prisma.project.upsert({
    where: { slug: DRAFT_PROJECT_SLUG },
    update: {},
    create: {
      slug: DRAFT_PROJECT_SLUG,
      title: 'Unannounced Project',
      description: 'DRAFT fixture. Must never be readable by an anonymous caller.',
      content: '# Unannounced\n\nUNPUBLISHED-ONLY-CONTENT-MARKER',
      client: 'UNPUBLISHED-ONLY-CLIENT-MARKER',
      status: 'DRAFT',
      authorId: admin.id,
    },
  });
  await prisma.article.upsert({
    where: { slug: DRAFT_ARTICLE_SLUG },
    update: {},
    create: {
      slug: DRAFT_ARTICLE_SLUG,
      title: 'Unpublished Post',
      content: '# Unpublished\n\nUNPUBLISHED-ONLY-CONTENT-MARKER',
      status: 'DRAFT',
      authorId: admin.id,
    },
  });
  console.log('✅ DRAFT fixtures (project + article)');

  await prisma.project.upsert({
    where: { slug: ARCHIVED_PROJECT_SLUG },
    update: {},
    create: {
      slug: ARCHIVED_PROJECT_SLUG,
      title: 'Retracted Project',
      description: 'ARCHIVED fixture. Must never be readable by an anonymous caller.',
      content: '# Retracted\n\nUNPUBLISHED-ONLY-CONTENT-MARKER',
      status: 'ARCHIVED',
      archivedAt: new Date(),
      authorId: admin.id,
    },
  });
  await prisma.article.upsert({
    where: { slug: ARCHIVED_ARTICLE_SLUG },
    update: {},
    create: {
      slug: ARCHIVED_ARTICLE_SLUG,
      title: 'Retracted Post',
      content: '# Retracted\n\nUNPUBLISHED-ONLY-CONTENT-MARKER',
      status: 'ARCHIVED',
      authorId: admin.id,
    },
  });
  console.log('✅ ARCHIVED fixtures (project + article)');

  console.log('\n🌱 Seed complete.\n');
}

main()
  .catch((error: unknown) => {
    // Prisma's known-request errors carry a code worth surfacing (P2002 unique
    // violation, P1001 unreachable) -- a bare stack makes CI failures guesswork.
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`\n❌ Seed failed [${error.code}]: ${error.message}\n`);
    } else {
      console.error('\n❌ Seed failed:', error);
    }
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
