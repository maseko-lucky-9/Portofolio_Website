// scripts/backup-database.ts
/**
 * Database Backup Script
 * 
 * Creates timestamped backups of PostgreSQL database and Redis data
 * 
 * Usage:
 *   tsx scripts/backup-database.ts
 *   tsx scripts/backup-database.ts --restore=backup-2026-01-11.sql
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { config } from '../src/config';

const execAsync = promisify(exec);
const prisma = new PrismaClient();
const redis = new Redis(config.redis.url);

const BACKUP_DIR = path.join(__dirname, '../backups');

// ==========================================
// Helper Functions
// ==========================================

async function ensureBackupDir(): Promise<void> {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}\n`);
  }
}

function getTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '');
}

// ==========================================
// PostgreSQL Backup
// ==========================================

async function backupPostgreSQL(): Promise<string> {
  console.log('💾 Backing up PostgreSQL database...');
  
  const timestamp = getTimestamp();
  const filename = `postgres-backup-${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);
  
  try {
    // Parse DATABASE_URL to get connection parameters
    const dbUrl = new URL(process.env.DATABASE_URL!);
    const host = dbUrl.hostname;
    const port = dbUrl.port || '5432';
    const database = dbUrl.pathname.slice(1).split('?')[0];
    const username = dbUrl.username;
    const password = dbUrl.password;
    
    // Set PGPASSWORD environment variable for authentication
    const env = { ...process.env, PGPASSWORD: password };
    
    // Create pg_dump command
    const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${filepath}"`;
    
    await execAsync(command, { env });
    
    // Get file size
    const stats = await fs.stat(filepath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`   ✅ PostgreSQL backup created: ${filename}`);
    console.log(`   📊 Size: ${sizeInMB} MB\n`);
    
    return filepath;
  } catch (error) {
    console.error('   ❌ PostgreSQL backup failed:', error);
    throw error;
  }
}

async function restorePostgreSQL(filepath: string): Promise<void> {
  console.log(`🔄 Restoring PostgreSQL database from: ${path.basename(filepath)}`);
  
  try {
    // Parse DATABASE_URL
    const dbUrl = new URL(process.env.DATABASE_URL!);
    const host = dbUrl.hostname;
    const port = dbUrl.port || '5432';
    const database = dbUrl.pathname.slice(1).split('?')[0];
    const username = dbUrl.username;
    const password = dbUrl.password;
    
    const env = { ...process.env, PGPASSWORD: password };
    
    // Drop and recreate database
    console.log('   🧹 Dropping existing database...');
    await execAsync(
      `psql -h ${host} -p ${port} -U ${username} -d postgres -c "DROP DATABASE IF EXISTS ${database}"`,
      { env }
    );
    
    console.log('   🔨 Creating new database...');
    await execAsync(
      `psql -h ${host} -p ${port} -U ${username} -d postgres -c "CREATE DATABASE ${database}"`,
      { env }
    );
    
    // Restore from backup
    console.log('   📦 Restoring data...');
    const command = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${filepath}"`;
    await execAsync(command, { env });
    
    console.log('   ✅ PostgreSQL restore complete\n');
  } catch (error) {
    console.error('   ❌ PostgreSQL restore failed:', error);
    throw error;
  }
}

// ==========================================
// Redis Backup
// ==========================================

async function backupRedis(): Promise<string> {
  console.log('💾 Backing up Redis data...');
  
  const timestamp = getTimestamp();
  const filename = `redis-backup-${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);
  
  try {
    // Get all keys
    const keys = await redis.keys('*');
    
    if (keys.length === 0) {
      console.log('   ⚠️  No Redis keys to backup\n');
      return '';
    }
    
    // Backup all keys with their values and TTL
    const backup: Record<string, { value: string; ttl: number }> = {};
    
    for (const key of keys) {
      const value = await redis.get(key);
      const ttl = await redis.ttl(key);
      
      if (value !== null) {
        backup[key] = { value, ttl };
      }
    }
    
    // Write to file
    await fs.writeFile(filepath, JSON.stringify(backup, null, 2));
    
    // Get file size
    const stats = await fs.stat(filepath);
    const sizeInKB = (stats.size / 1024).toFixed(2);
    
    console.log(`   ✅ Redis backup created: ${filename}`);
    console.log(`   📊 Keys: ${keys.length}`);
    console.log(`   📊 Size: ${sizeInKB} KB\n`);
    
    return filepath;
  } catch (error) {
    console.error('   ❌ Redis backup failed:', error);
    throw error;
  }
}

async function restoreRedis(filepath: string): Promise<void> {
  console.log(`🔄 Restoring Redis data from: ${path.basename(filepath)}`);
  
  try {
    // Read backup file
    const content = await fs.readFile(filepath, 'utf-8');
    const backup: Record<string, { value: string; ttl: number }> = JSON.parse(content);
    
    // Clear existing data
    console.log('   🧹 Flushing existing Redis data...');
    await redis.flushdb();
    
    // Restore keys
    console.log('   📦 Restoring keys...');
    let restored = 0;
    
    for (const [key, data] of Object.entries(backup)) {
      if (data.ttl > 0) {
        await redis.setex(key, data.ttl, data.value);
      } else {
        await redis.set(key, data.value);
      }
      restored++;
    }
    
    console.log(`   ✅ Redis restore complete (${restored} keys)\n`);
  } catch (error) {
    console.error('   ❌ Redis restore failed:', error);
    throw error;
  }
}

// ==========================================
// Database Statistics Backup
// ==========================================

async function backupStatistics(): Promise<string> {
  console.log('📊 Backing up database statistics...');
  
  const timestamp = getTimestamp();
  const filename = `stats-backup-${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);
  
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      counts: {
        users: await prisma.user.count(),
        projects: await prisma.project.count(),
        articles: await prisma.article.count(),
        tags: await prisma.tag.count(),
        projectTags: await prisma.projectTag.count(),
        articleTags: await prisma.articleTag.count(),
        analyticsEvents: await prisma.analyticsEvent.count(),
        contactSubmissions: await prisma.contactSubmission.count(),
      },
      aggregates: {
        totalProjectViews: await prisma.project.aggregate({
          _sum: { views: true },
        }),
        totalArticleViews: await prisma.article.aggregate({
          _sum: { views: true },
        }),
        publishedProjects: await prisma.project.count({
          where: { status: 'PUBLISHED' },
        }),
        publishedArticles: await prisma.article.count({
          where: { status: 'PUBLISHED' },
        }),
      },
    };
    
    await fs.writeFile(filepath, JSON.stringify(stats, null, 2));
    
    console.log(`   ✅ Statistics backup created: ${filename}\n`);
    
    return filepath;
  } catch (error) {
    console.error('   ❌ Statistics backup failed:', error);
    throw error;
  }
}

// ==========================================
// List and Clean Backups
// ==========================================

async function listBackups(): Promise<void> {
  console.log('📋 Available Backups:\n');
  
  const files = await fs.readdir(BACKUP_DIR);
  const backups = files.filter(f => f.endsWith('.sql') || f.endsWith('.json'));
  
  if (backups.length === 0) {
    console.log('   No backups found\n');
    return;
  }
  
  for (const file of backups.sort().reverse()) {
    const filepath = path.join(BACKUP_DIR, file);
    const stats = await fs.stat(filepath);
    const size = (stats.size / (1024 * 1024)).toFixed(2);
    const date = stats.mtime.toLocaleString();
    
    console.log(`   ${file}`);
    console.log(`      Size: ${size} MB`);
    console.log(`      Date: ${date}\n`);
  }
}

async function cleanOldBackups(keepDays: number = 7): Promise<void> {
  console.log(`🧹 Cleaning backups older than ${keepDays} days...\n`);
  
  const files = await fs.readdir(BACKUP_DIR);
  const now = Date.now();
  const maxAge = keepDays * 24 * 60 * 60 * 1000;
  
  let deleted = 0;
  
  for (const file of files) {
    const filepath = path.join(BACKUP_DIR, file);
    const stats = await fs.stat(filepath);
    const age = now - stats.mtime.getTime();
    
    if (age > maxAge) {
      await fs.unlink(filepath);
      console.log(`   🗑️  Deleted: ${file}`);
      deleted++;
    }
  }
  
  if (deleted === 0) {
    console.log('   No old backups to delete');
  }
  
  console.log('');
}

// ==========================================
// Complete Backup
// ==========================================

async function createCompleteBackup(): Promise<void> {
  console.log('\n🎯 Creating Complete Backup\n');
  console.log('='.repeat(60) + '\n');
  
  await ensureBackupDir();
  
  const backups = {
    postgres: '',
    redis: '',
    stats: '',
  };
  
  try {
    // Backup PostgreSQL
    backups.postgres = await backupPostgreSQL();
    
    // Backup Redis
    backups.redis = await backupRedis();
    
    // Backup statistics
    backups.stats = await backupStatistics();
    
    // Create manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      backups,
      version: '1.0.0',
    };
    
    const manifestPath = path.join(
      BACKUP_DIR,
      `manifest-${getTimestamp()}.json`
    );
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('='.repeat(60));
    console.log('\n✅ Complete backup finished successfully!\n');
    console.log('📁 Backup location:', BACKUP_DIR);
    console.log('📄 Manifest:', path.basename(manifestPath));
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Backup failed:', error);
    process.exit(1);
  }
}

// ==========================================
// Complete Restore
// ==========================================

async function restoreFromBackup(manifestFile: string): Promise<void> {
  console.log('\n🔄 Restoring from Backup\n');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Read manifest
    const manifestPath = path.join(BACKUP_DIR, manifestFile);
    const content = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);
    
    console.log(`📄 Using manifest: ${manifestFile}`);
    console.log(`⏰ Backup created: ${manifest.timestamp}\n`);
    
    // Confirm restoration
    console.log('⚠️  WARNING: This will replace all current data!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Restore PostgreSQL
    if (manifest.backups.postgres) {
      await restorePostgreSQL(manifest.backups.postgres);
    }
    
    // Restore Redis
    if (manifest.backups.redis) {
      await restoreRedis(manifest.backups.redis);
    }
    
    console.log('='.repeat(60));
    console.log('\n✅ Restore completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Restore failed:', error);
    process.exit(1);
  }
}

// ==========================================
// Main Function
// ==========================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--list')) {
    await listBackups();
  } else if (args.includes('--clean')) {
    const keepDays = parseInt(args.find(a => a.startsWith('--keep='))?.split('=')[1] || '7');
    await cleanOldBackups(keepDays);
  } else if (args.find(a => a.startsWith('--restore='))) {
    const manifestFile = args.find(a => a.startsWith('--restore='))!.split('=')[1];
    await restoreFromBackup(manifestFile);
  } else {
    await createCompleteBackup();
  }
}

// Run backup
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });
