// scripts/verify-database.ts
/**
 * Database Verification Script
 * 
 * Verifies database integrity, row counts, relationships, indexes,
 * and query performance after seeding.
 * 
 * Usage:
 *   tsx scripts/verify-database.ts
 */

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

interface VerificationResult {
  test: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: VerificationResult[] = [];

// ==========================================
// Helper Functions
// ==========================================

function logTest(test: string, passed: boolean, message: string, duration?: number): void {
  const icon = passed ? '✅' : '❌';
  const durationText = duration ? ` (${duration.toFixed(2)}ms)` : '';
  console.log(`${icon} ${test}${durationText}`);
  if (!passed) {
    console.log(`   ${message}`);
  }
  results.push({ test, passed, message, duration });
}

async function measureQuery<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

// ==========================================
// Row Count Verification
// ==========================================

async function verifyRowCounts(): Promise<void> {
  console.log('\n📊 Verifying Row Counts\n');
  
  const expectedCounts = {
    users: { min: 1, max: 100 },
    tags: { min: 5, max: 50 },
    projects: { min: 1, max: 1000 },
    articles: { min: 0, max: 1000 },
    projectTags: { min: 1, max: 10000 },
    articleTags: { min: 0, max: 10000 },
  };
  
  // Users
  const userCount = await prisma.user.count();
  logTest(
    `Users: ${userCount}`,
    userCount >= expectedCounts.users.min && userCount <= expectedCounts.users.max,
    `Expected ${expectedCounts.users.min}-${expectedCounts.users.max}, got ${userCount}`
  );
  
  // Tags
  const tagCount = await prisma.tag.count();
  logTest(
    `Tags: ${tagCount}`,
    tagCount >= expectedCounts.tags.min && tagCount <= expectedCounts.tags.max,
    `Expected ${expectedCounts.tags.min}-${expectedCounts.tags.max}, got ${tagCount}`
  );
  
  // Projects
  const projectCount = await prisma.project.count();
  logTest(
    `Projects: ${projectCount}`,
    projectCount >= expectedCounts.projects.min && projectCount <= expectedCounts.projects.max,
    `Expected ${expectedCounts.projects.min}-${expectedCounts.projects.max}, got ${projectCount}`
  );
  
  // Articles
  const articleCount = await prisma.article.count();
  logTest(
    `Articles: ${articleCount}`,
    articleCount >= expectedCounts.articles.min && articleCount <= expectedCounts.articles.max,
    `Expected ${expectedCounts.articles.min}-${expectedCounts.articles.max}, got ${articleCount}`
  );
  
  // Project Tags
  const projectTagCount = await prisma.projectTag.count();
  logTest(
    `Project Tags: ${projectTagCount}`,
    projectTagCount >= expectedCounts.projectTags.min && projectTagCount <= expectedCounts.projectTags.max,
    `Expected ${expectedCounts.projectTags.min}-${expectedCounts.projectTags.max}, got ${projectTagCount}`
  );
  
  // Article Tags
  const articleTagCount = await prisma.articleTag.count();
  logTest(
    `Article Tags: ${articleTagCount}`,
    articleTagCount >= expectedCounts.articleTags.min && articleTagCount <= expectedCounts.articleTags.max,
    `Expected ${expectedCounts.articleTags.min}-${expectedCounts.articleTags.max}, got ${articleTagCount}`
  );
}

// ==========================================
// Relationship Integrity
// ==========================================

async function verifyRelationships(): Promise<void> {
  console.log('\n🔗 Verifying Relationship Integrity\n');
  
  // Verify admin user exists
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });
  logTest(
    'Admin user exists',
    adminUser !== null,
    'No admin user found'
  );
}

// ==========================================
// Data Validation
// ==========================================

async function verifyDataValidation(): Promise<void> {
  console.log('\n✅ Verifying Data Validation\n');
  
  // Verify all projects have unique slugs
  const projectSlugs = await prisma.project.groupBy({
    by: ['slug'],
    _count: { slug: true },
    having: { slug: { _count: { gt: 1 } } },
  });
  logTest(
    'Project slugs are unique',
    projectSlugs.length === 0,
    `Found ${projectSlugs.length} duplicate project slugs`
  );
  
  // Verify all articles have unique slugs
  const articleSlugs = await prisma.article.groupBy({
    by: ['slug'],
    _count: { slug: true },
    having: { slug: { _count: { gt: 1 } } },
  });
  logTest(
    'Article slugs are unique',
    articleSlugs.length === 0,
    `Found ${articleSlugs.length} duplicate article slugs`
  );
  
  // Verify all tags have unique slugs
  const tagSlugs = await prisma.tag.groupBy({
    by: ['slug'],
    _count: { slug: true },
    having: { slug: { _count: { gt: 1 } } },
  });
  logTest(
    'Tag slugs are unique',
    tagSlugs.length === 0,
    `Found ${tagSlugs.length} duplicate tag slugs`
  );
  
  // Verify all users have unique emails
  const userEmails = await prisma.user.groupBy({
    by: ['email'],
    _count: { email: true },
    having: { email: { _count: { gt: 1 } } },
  });
  logTest(
    'User emails are unique',
    userEmails.length === 0,
    `Found ${userEmails.length} duplicate user emails`
  );
  
  // Verify projects have required fields
  const projectsWithoutTitle = await prisma.project.count({
    where: { title: '' },
  });
  logTest(
    'Projects have titles',
    projectsWithoutTitle === 0,
    `Found ${projectsWithoutTitle} projects without titles`
  );
  
  // Verify published projects have publishedAt date
  const publishedWithoutDate = await prisma.project.count({
    where: {
      status: 'PUBLISHED',
      publishedAt: null,
    },
  });
  logTest(
    'Published projects have publishedAt date',
    publishedWithoutDate === 0,
    `Found ${publishedWithoutDate} published projects without publishedAt date`
  );
}

// ==========================================
// Query Performance Tests
// ==========================================

async function verifyQueryPerformance(): Promise<void> {
  console.log('\n⚡ Verifying Query Performance\n');
  
  const thresholds = {
    simple: 50,    // 50ms
    complex: 200,  // 200ms
    join: 300,     // 300ms
  };
  
  // Test 1: Simple query - Find project by slug
  const { result: project1, duration: d1 } = await measureQuery(
    'Find project by slug',
    () => prisma.project.findUnique({ where: { slug: 'portfolio-website' } })
  );
  logTest(
    'Find project by slug',
    d1 < thresholds.simple,
    `Query took ${d1.toFixed(2)}ms (threshold: ${thresholds.simple}ms)`,
    d1
  );
  
  // Test 2: List projects with pagination
  const { result: projects, duration: d2 } = await measureQuery(
    'List projects (paginated)',
    () => prisma.project.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      skip: 0,
    })
  );
  logTest(
    'List projects (paginated)',
    d2 < thresholds.simple,
    `Query took ${d2.toFixed(2)}ms (threshold: ${thresholds.simple}ms)`,
    d2
  );
  
  // Test 3: Project with tags (join)
  const { result: projectWithTags, duration: d3 } = await measureQuery(
    'Project with tags',
    () => prisma.project.findFirst({
      where: { status: 'PUBLISHED' },
      include: {
        tags: {
          include: { tag: true },
        },
        author: true,
      },
    })
  );
  logTest(
    'Project with tags (join)',
    d3 < thresholds.join,
    `Query took ${d3.toFixed(2)}ms (threshold: ${thresholds.join}ms)`,
    d3
  );
  
  // Test 4: Count queries
  const { result: count, duration: d4 } = await measureQuery(
    'Count projects',
    () => prisma.project.count({ where: { status: 'PUBLISHED' } })
  );
  logTest(
    'Count projects',
    d4 < thresholds.simple,
    `Query took ${d4.toFixed(2)}ms (threshold: ${thresholds.simple}ms)`,
    d4
  );
  
  // Test 5: Full-text search (if implemented)
  const { result: searchResults, duration: d5 } = await measureQuery(
    'Search projects',
    () => prisma.project.findMany({
      where: {
        OR: [
          { title: { contains: 'API', mode: 'insensitive' } },
          { description: { contains: 'API', mode: 'insensitive' } },
        ],
      },
      take: 10,
    })
  );
  logTest(
    'Search projects',
    d5 < thresholds.complex,
    `Query took ${d5.toFixed(2)}ms (threshold: ${thresholds.complex}ms)`,
    d5
  );
  
  // Test 6: Aggregation query
  const { result: stats, duration: d6 } = await measureQuery(
    'Aggregate views',
    () => prisma.project.aggregate({
      where: { status: 'PUBLISHED' },
      _sum: { views: true },
      _avg: { views: true },
      _max: { views: true },
    })
  );
  logTest(
    'Aggregate views',
    d6 < thresholds.complex,
    `Query took ${d6.toFixed(2)}ms (threshold: ${thresholds.complex}ms)`,
    d6
  );
}

// ==========================================
// Index Verification
// ==========================================

async function verifyIndexes(): Promise<void> {
  console.log('\n🔍 Verifying Indexes\n');
  
  // Query PostgreSQL to check indexes
  const indexes = await prisma.$queryRaw<Array<{
    tablename: string;
    indexname: string;
    indexdef: string;
  }>>`
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `;
  
  const expectedIndexes = [
    'projects_slug_key',
    'projects_status_idx',
    'projects_featured_idx',
    'articles_slug_key',
    'articles_status_idx',
    'articles_featured_idx',
    'tags_slug_key',
    'tags_name_key',
    'users_email_key',
  ];
  
  const existingIndexNames = indexes.map(idx => idx.indexname);
  
  for (const expectedIndex of expectedIndexes) {
    const exists = existingIndexNames.includes(expectedIndex);
    logTest(
      `Index exists: ${expectedIndex}`,
      exists,
      `Index ${expectedIndex} not found`
    );
  }
  
  console.log(`\n   Total indexes: ${indexes.length}`);
}

// ==========================================
// Database Statistics
// ==========================================

async function showStatistics(): Promise<void> {
  console.log('\n📈 Database Statistics\n');
  
  // Table sizes
  const tableSizes = await prisma.$queryRaw<Array<{
    table_name: string;
    row_count: number;
    total_size: string;
    table_size: string;
    indexes_size: string;
  }>>`
    SELECT
      schemaname || '.' || relname AS table_name,
      n_live_tup AS row_count,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS total_size,
      pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) AS table_size,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname) - pg_relation_size(schemaname||'.'||relname)) AS indexes_size
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
    LIMIT 10;
  `;
  
  console.log('Table Sizes (Top 10):');
  tableSizes.forEach(table => {
    console.log(`   ${table.table_name}`);
    console.log(`      Rows: ${table.row_count}`);
    console.log(`      Total: ${table.total_size}`);
    console.log(`      Table: ${table.table_size}`);
    console.log(`      Indexes: ${table.indexes_size}`);
  });
  
  // Database size
  const dbSize = await prisma.$queryRaw<Array<{ size: string }>>`
    SELECT pg_size_pretty(pg_database_size(current_database())) as size;
  `;
  
  console.log(`\nTotal Database Size: ${dbSize[0].size}`);
}

// ==========================================
// Summary Report
// ==========================================

function printSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(2)}%\n`);
  
  if (failed > 0) {
    console.log('Failed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`   ❌ ${r.test}`);
        console.log(`      ${r.message}`);
      });
    console.log('');
  }
  
  // Performance summary
  const perfResults = results.filter(r => r.duration !== undefined);
  if (perfResults.length > 0) {
    const avgDuration = perfResults.reduce((sum, r) => sum + (r.duration || 0), 0) / perfResults.length;
    const maxDuration = Math.max(...perfResults.map(r => r.duration || 0));
    
    console.log('Performance Summary:');
    console.log(`   Average Query Time: ${avgDuration.toFixed(2)}ms`);
    console.log(`   Slowest Query: ${maxDuration.toFixed(2)}ms`);
    console.log('');
  }
}

// ==========================================
// Main Function
// ==========================================

async function main(): Promise<void> {
  console.log('\n🔍 Starting Database Verification...\n');
  
  try {
    await verifyRowCounts();
    await verifyRelationships();
    await verifyDataValidation();
    await verifyQueryPerformance();
    await verifyIndexes();
    await showStatistics();
    
    printSummary();
    
    const failed = results.filter(r => !r.passed).length;
    
    if (failed === 0) {
      console.log('✅ All verification tests passed!\n');
      process.exit(0);
    } else {
      console.log('❌ Some verification tests failed.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run verification
main().finally(async () => {
  await prisma.$disconnect();
});
