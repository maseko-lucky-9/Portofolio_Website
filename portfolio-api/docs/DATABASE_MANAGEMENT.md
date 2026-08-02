# Database Management Guide

Complete guide for managing PostgreSQL database with Prisma migrations in Kubernetes.

## 📋 Table of Contents

- [Overview](#overview)
- [Migration Management](#migration-management)
- [Backup & Recovery](#backup--recovery)
- [Database Monitoring](#database-monitoring)
- [Performance Tuning](#performance-tuning)
- [Disaster Recovery](#disaster-recovery)

## Overview

### Database Architecture

```
┌─────────────────────────────────────┐
│         Application Pods            │
│   (Connect via Service Discovery)   │
└────────────┬────────────────────────┘
             │
             │ postgresql://
             │
┌────────────▼────────────────────────┐
│      PostgreSQL Service             │
│      (ClusterIP: postgres:5432)     │
└────────────┬────────────────────────┘
             │
             │
┌────────────▼────────────────────────┐
│    PostgreSQL StatefulSet           │
│    - Single replica                 │
│    - 10Gi persistent volume         │
│    - Postgres 16-alpine             │
└────────────┬────────────────────────┘
             │
             │
┌────────────▼────────────────────────┐
│    Backup CronJob (Daily 2AM)       │
│    - SQL dump + Custom format       │
│    - 7-day retention                │
└─────────────────────────────────────┘
```

### Connection Details

**Service Discovery:**
```yaml
# Internal (within cluster)
Host: postgres.<namespace>.svc.cluster.local
Port: 5432

# Short form (within namespace)
Host: postgres
Port: 5432
```

**Connection String Format:**
```
postgresql://<user>:<password>@postgres:5432/<database>
```

### Database Schema

Managed by Prisma ORM with TypeScript:

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

## Migration Management

### Prisma Migration Workflow

```
1. Modify schema.prisma
        ↓
2. Generate migration
   $ prisma migrate dev --name <name>
        ↓
3. Review migration SQL
   $ cat prisma/migrations/.../migration.sql
        ↓
4. Test locally
   $ docker-compose up -d
        ↓
5. Deploy to Kubernetes
   $ ./scripts/migrate.sh deploy -e <env>
```

### Creating Migrations

**Local Development:**

```bash
# Create new migration
npx prisma migrate dev --name add_user_profile

# Generate Prisma Client
npx prisma generate

# Seed database
npx prisma db seed
```

**Using Migration Script:**

```bash
# Generate migration (local only)
./scripts/migrate.sh generate

# The script will:
# - Run prisma migrate dev
# - Generate TypeScript types
# - Show migration SQL
```

### Deploying Migrations

**To Kubernetes:**

```bash
# Deploy to development
./scripts/migrate.sh deploy -e dev

# Deploy to staging
./scripts/migrate.sh deploy -e staging

# Deploy to production (requires confirmation)
./scripts/migrate.sh deploy -e prod
```

**What happens:**

1. Script validates environment
2. Gets database credentials from secrets
3. Runs `prisma migrate deploy`
4. Verifies migration success
5. Reports status

**Via GitHub Actions:**

Migrations run automatically via init container:

```yaml
# In deployment.yaml
initContainers:
  - name: migrate
    image: backend-api:latest
    command: ["/bin/sh", "-c"]
    args:
      - |
        npx prisma migrate deploy
        npx prisma generate
    env:
      - name: DATABASE_URL
        valueFrom:
          secretKeyRef:
            name: backend-secrets
            key: database-url
```

### Checking Migration Status

```bash
# Using script
./scripts/migrate.sh status -e prod

# Manually
kubectl exec -it -n prod <backend-pod> -- npx prisma migrate status

# Output shows:
# - Applied migrations
# - Pending migrations
# - Failed migrations
```

### Migration Rollback

**Important:** Prisma doesn't support automatic rollbacks.

**Manual Rollback Process:**

1. **Restore database backup:**
   ```bash
   # Stop application
   kubectl scale deployment/backend-api -n prod --replicas=0
   
   # Restore from backup
   gunzip -c backup_YYYYMMDD.sql.gz | kubectl exec -i -n prod postgres-0 -- \
     psql -U portfolio_user -d portfolio
   ```

2. **Revert code changes:**
   ```bash
   # Remove migration folder
   rm -rf prisma/migrations/20240113_problematic_migration
   
   # Revert schema.prisma
   git checkout HEAD~1 prisma/schema.prisma
   
   # Regenerate client
   npx prisma generate
   ```

3. **Restart application:**
   ```bash
   kubectl scale deployment/backend-api -n prod --replicas=3
   ```

### Reset Database (Development Only)

```bash
# Complete reset
./scripts/migrate.sh reset -e dev

# This will:
# - Drop all tables
# - Run all migrations
# - Seed database
```

## Backup & Recovery

### Automated Backups

**CronJob Configuration:**

```yaml
# k8s/base/database/backup-cronjob.yaml
schedule: "0 2 * * *"  # Daily at 2 AM UTC
retention: 7            # Keep 7 days
```

**Backup Types:**

1. **SQL Dump:** Plain text, human-readable
2. **Custom Format:** Binary, faster restore

### Manual Backups

**Using Backup Script:**

```bash
# Default backup (to postgres pod)
./scripts/backup-db.sh -e prod

# Custom backup directory
./scripts/backup-db.sh -e prod -d /mnt/backups

# Custom retention (30 days)
./scripts/backup-db.sh -e prod -r 30

# Include custom format dump
./scripts/backup-db.sh -e prod --custom-format
```

**Direct pg_dump:**

```bash
# SQL dump
kubectl exec -n prod postgres-0 -- \
  pg_dump -U portfolio_user -d portfolio | \
  gzip > backup_$(date +%Y%m%d).sql.gz

# Custom format
kubectl exec -n prod postgres-0 -- \
  pg_dump -U portfolio_user -d portfolio -Fc -f /tmp/backup.dump
kubectl cp prod/postgres-0:/tmp/backup.dump ./backup_$(date +%Y%m%d).dump
```

### Backup Verification

```bash
# Test restore to temporary database
gunzip -c backup.sql.gz | psql -h localhost -U test_user -d test_db

# Verify tables and data
psql -h localhost -U test_user -d test_db -c "\dt"
psql -h localhost -U test_user -d test_db -c "SELECT COUNT(*) FROM users;"
```

### Database Restore

**Pre-restore Checklist:**

- [ ] Stop application (scale to 0 replicas)
- [ ] Verify backup file integrity
- [ ] Note current database state
- [ ] Have rollback plan ready

**Restore from SQL Backup:**

```bash
# 1. Scale down application
kubectl scale deployment/backend-api -n prod --replicas=0

# 2. Restore database
gunzip -c backup_20240113.sql.gz | kubectl exec -i -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio

# 3. Verify restore
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c "\dt"

# 4. Scale up application
kubectl scale deployment/backend-api -n prod --replicas=3

# 5. Verify application
./scripts/health-check.sh -u https://api.example.com
```

**Restore from Custom Format:**

```bash
# Copy backup to pod
kubectl cp backup.dump prod/postgres-0:/tmp/backup.dump

# Restore
kubectl exec -n prod postgres-0 -- \
  pg_restore -U portfolio_user -d portfolio --clean --if-exists /tmp/backup.dump
```

### Point-in-Time Recovery

**Enable WAL Archiving:**

```yaml
# In postgres ConfigMap
data:
  wal_level: replica
  archive_mode: "on"
  archive_command: "test ! -f /archive/%f && cp %p /archive/%f"
```

**Perform PITR:**

```bash
# 1. Restore base backup
pg_basebackup -h postgres -U portfolio_user -D /var/lib/postgresql/data

# 2. Create recovery.conf
cat > recovery.conf <<EOF
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2024-01-13 14:30:00'
EOF

# 3. Start PostgreSQL
pg_ctl start -D /var/lib/postgresql/data
```

## Database Monitoring

### Connection Monitoring

```bash
# Active connections
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Connections by state
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c \
  "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"

# Long-running queries
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c \
  "SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE state = 'active' 
   ORDER BY duration DESC;"
```

### Performance Metrics

```bash
# Database size
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c \
  "SELECT pg_size_pretty(pg_database_size('portfolio'));"

# Table sizes
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c \
  "SELECT 
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Index usage
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c \
  "SELECT 
     schemaname,
     tablename,
     indexname,
     idx_scan,
     idx_tup_read,
     idx_tup_fetch
   FROM pg_stat_user_indexes
   ORDER BY idx_scan DESC;"
```

### Query Performance

**Enable pg_stat_statements:**

```sql
-- In postgres ConfigMap
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
```

**Analyze slow queries:**

```bash
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c \
  "SELECT 
     query,
     calls,
     total_exec_time,
     mean_exec_time,
     max_exec_time
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;"
```

### Lock Monitoring

```bash
# Current locks
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c \
  "SELECT 
     pg_stat_activity.pid,
     pg_stat_activity.usename,
     pg_locks.mode,
     pg_locks.locktype,
     pg_locks.relation::regclass
   FROM pg_locks
   JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
   WHERE NOT pg_locks.granted;"

# Blocking queries
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c \
  "SELECT 
     blocked_locks.pid AS blocked_pid,
     blocked_activity.usename AS blocked_user,
     blocking_locks.pid AS blocking_pid,
     blocking_activity.usename AS blocking_user,
     blocked_activity.query AS blocked_statement,
     blocking_activity.query AS blocking_statement
   FROM pg_catalog.pg_locks blocked_locks
   JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
   JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
   JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
   WHERE NOT blocked_locks.granted;"
```

## Performance Tuning

### PostgreSQL Configuration

**Tuning Parameters:**

```yaml
# k8s/base/database/configmap.yaml
data:
  # Memory settings
  shared_buffers: 256MB          # 25% of RAM
  effective_cache_size: 768MB    # 75% of RAM
  work_mem: 8MB                  # Per-operation memory
  maintenance_work_mem: 64MB     # Maintenance operations
  
  # Connection settings
  max_connections: 100           # Maximum concurrent connections
  
  # Checkpoint settings
  checkpoint_completion_target: 0.9
  wal_buffers: 16MB
  
  # Query planner
  random_page_cost: 1.1          # SSD-optimized
  effective_io_concurrency: 200  # SSD concurrent I/O
  
  # Autovacuum
  autovacuum: on
  autovacuum_max_workers: 3
  autovacuum_naptime: 60s
```

### Prisma Connection Pooling

**Configuration:**

```typescript
// src/config/database.ts
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
  errorFormat: 'pretty',
});

// Connection pool settings
const connectionLimit = parseInt(process.env.DATABASE_POOL_MAX || '10');
const connectionTimeout = parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000');
```

**Environment Variables:**

```yaml
# ConfigMap
DATABASE_POOL_MIN: "2"
DATABASE_POOL_MAX: "10"
DATABASE_CONNECTION_TIMEOUT: "30000"
```

### Index Optimization

**Identify missing indexes:**

```sql
-- Tables with sequential scans
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / seq_scan AS avg_seq_tup
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC;

-- Unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey';
```

**Add indexes via Prisma:**

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  
  @@index([email])
  @@index([createdAt])
}
```

### Query Optimization

**Use EXPLAIN ANALYZE:**

```bash
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c \
  "EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';"
```

**Prisma Query Optimization:**

```typescript
// Bad: N+1 queries
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { userId: user.id } });
}

// Good: Include relation
const users = await prisma.user.findMany({
  include: { posts: true }
});

// Good: Select specific fields
const users = await prisma.user.findMany({
  select: { id: true, email: true }
});
```

## Disaster Recovery

### Recovery Scenarios

#### 1. Data Corruption

```bash
# 1. Identify corruption
kubectl logs -n prod <backend-pod> | grep -i "error\|corrupt"

# 2. Stop application
kubectl scale deployment/backend-api -n prod --replicas=0

# 3. Restore from backup
./scripts/backup-db.sh -e prod --restore backup_20240113.sql.gz

# 4. Verify data integrity
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c "SELECT COUNT(*) FROM users;"

# 5. Restart application
kubectl scale deployment/backend-api -n prod --replicas=3
```

#### 2. Accidental Data Deletion

```bash
# 1. Immediately stop writes
kubectl scale deployment/backend-api -n prod --replicas=0

# 2. Restore to point before deletion
./scripts/backup-db.sh -e prod --restore backup_latest.sql.gz

# 3. Verify restored data
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c "SELECT * FROM users WHERE id = 'deleted-user-id';"

# 4. Resume operations
kubectl scale deployment/backend-api -n prod --replicas=3
```

#### 3. Complete Database Loss

```bash
# 1. Deploy new PostgreSQL StatefulSet
kubectl delete statefulset postgres -n prod
kubectl apply -f k8s/base/database/statefulset.yaml -n prod

# 2. Wait for pod ready
kubectl wait --for=condition=ready pod/postgres-0 -n prod --timeout=300s

# 3. Restore from backup
gunzip -c /backups/backup_latest.sql.gz | kubectl exec -i -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio

# 4. Run migrations if needed
./scripts/migrate.sh deploy -e prod

# 5. Restart application
kubectl rollout restart deployment/backend-api -n prod
```

### RTO & RPO

**Recovery Time Objective (RTO):** Target time to restore service

- Development: 1 hour
- Staging: 30 minutes
- Production: 15 minutes

**Recovery Point Objective (RPO):** Maximum acceptable data loss

- Development: 24 hours
- Staging: 12 hours
- Production: 1 hour (with daily backups)

**Improving RPO:**

- Increase backup frequency (every 4 hours)
- Enable WAL archiving for PITR
- Use database replication
- Implement application-level event sourcing

### Backup Testing

**Regular Testing Schedule:**

- **Monthly:** Test full restore to staging
- **Quarterly:** Test disaster recovery procedure
- **Annually:** Test complete system recovery

**Restore Test Procedure:**

```bash
# 1. Create test namespace
kubectl create namespace backup-test

# 2. Deploy PostgreSQL
kubectl apply -f k8s/base/database/ -n backup-test

# 3. Restore backup
gunzip -c backup_latest.sql.gz | kubectl exec -i -n backup-test postgres-0 -- \
  psql -U portfolio_user -d portfolio

# 4. Verify data
kubectl exec -n backup-test postgres-0 -- \
  psql -U portfolio_user -d portfolio -c "SELECT COUNT(*) FROM users;"

# 5. Cleanup
kubectl delete namespace backup-test
```

## Best Practices

### Migration Best Practices

- ✅ Always test migrations locally first
- ✅ Review generated SQL before deploying
- ✅ Make migrations backwards compatible when possible
- ✅ Take backup before production migrations
- ✅ Plan migrations during low-traffic periods
- ❌ Never edit existing migration files
- ❌ Never deploy untested migrations to production

### Backup Best Practices

- ✅ Automate backups with CronJobs
- ✅ Store backups in multiple locations
- ✅ Test restores regularly
- ✅ Monitor backup success/failure
- ✅ Document restore procedures
- ❌ Never rely on a single backup
- ❌ Never skip backup verification

### Security Best Practices

- ✅ Use strong database passwords
- ✅ Rotate credentials regularly
- ✅ Encrypt backups at rest
- ✅ Limit database network access
- ✅ Enable SSL/TLS connections
- ❌ Never commit database URLs to Git
- ❌ Never use default passwords

## Troubleshooting

### Connection Issues

```bash
# Test connection from pod
kubectl run -it --rm debug --image=postgres:16-alpine --restart=Never -n prod -- \
  psql -h postgres -U portfolio_user -d portfolio

# Check service
kubectl get svc -n prod postgres

# Check endpoints
kubectl get endpoints -n prod postgres
```

### Migration Failures

```bash
# Check migration status
kubectl exec -n prod <backend-pod> -- npx prisma migrate status

# View migration history
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c "SELECT * FROM _prisma_migrations;"

# Resolve failed migration
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c \
  "UPDATE _prisma_migrations SET finished_at = NOW() WHERE migration_name = 'failed-migration';"
```

### Performance Issues

```bash
# Check active queries
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c \
  "SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE state = 'active';"

# Kill long-running query
kubectl exec -n prod postgres-0 -- \
  psql -U portfolio_user -d portfolio -c "SELECT pg_terminate_backend(PID);"
```

## Next Steps

- Set up database monitoring dashboard
- Implement automated backup verification
- Configure replication for high availability
- Set up query performance monitoring
- Implement connection pooling with PgBouncer
- Configure automated failover

## Support

For database issues:
- Check logs: `kubectl logs -n <namespace> postgres-0`
- Test connection: `psql -h postgres -U portfolio_user -d portfolio`
- View metrics: `kubectl exec postgres-0 -- psql -c "SELECT * FROM pg_stat_activity;"`
