# Backend API Deployment Guide

Complete guide for deploying the Portfolio Backend API to Kubernetes.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Deployment Methods](#deployment-methods)
- [Environment Configuration](#environment-configuration)
- [Database Management](#database-management)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **kubectl** (v1.28+): Kubernetes CLI
- **kustomize** (v5.0+): Kubernetes configuration management
- **helm** (v3.12+): Kubernetes package manager (optional)
- **argocd** CLI (v2.8+): GitOps deployment (optional)
- **docker**: Container runtime
- **git**: Version control

### Cluster Requirements

- Kubernetes 1.27+
- Storage class available (`hostpath` for MicroK8s)
- Ingress controller installed (nginx-ingress recommended)
- At least 2 CPU cores and 4GB RAM available

### Access Requirements

- Kubernetes cluster admin access
- Container registry access (ghcr.io)
- DNS configured for ingress hostnames

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/maseko-lucky-9/Portofolio_Website.git
cd Portofolio_Website/portfolio-api
```

### 2. Create Secrets

```bash
# Development
kubectl create namespace dev
kubectl create secret generic backend-secrets \
  --from-literal=database-url='postgresql://user:pass@postgres:5432/portfolio' \
  --from-literal=redis-url='redis://redis:6379' \
  --from-literal=jwt-secret='your-secret-key' \
  --from-literal=jwt-access-expiry='15m' \
  --from-literal=jwt-refresh-expiry='7d' \
  --namespace=dev
```

### 3. Deploy with Kustomize

```bash
# Deploy to development
kubectl apply -k k8s/overlays/dev

# Wait for rollout
kubectl rollout status deployment/backend-api -n dev
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -n dev -l app=backend-api

# Check health
kubectl port-forward -n dev svc/backend-api 3000:3000
curl http://localhost:3000/api/v1/health
```

## Deployment Methods

### Method 1: Kustomize (Recommended)

**Advantages:**
- Simple and fast
- Direct control
- No additional dependencies

**Usage:**

```bash
# Development
kubectl apply -k k8s/overlays/dev

# Staging
kubectl apply -k k8s/overlays/staging

# Production
kubectl apply -k k8s/overlays/prod
```

### Method 2: Helm

**Advantages:**
- Templating and values management
- Release management
- Easy rollbacks

**Usage:**

```bash
# Install/upgrade development
helm upgrade --install backend-api ./helm/backend-api \
  --namespace dev \
  --create-namespace \
  --values helm/backend-api/values-dev.yaml

# Install/upgrade staging
helm upgrade --install backend-api ./helm/backend-api \
  --namespace staging \
  --create-namespace \
  --values helm/backend-api/values-staging.yaml

# Install/upgrade production
helm upgrade --install backend-api ./helm/backend-api \
  --namespace prod \
  --create-namespace \
  --values helm/backend-api/values-prod.yaml
```

### Method 3: ArgoCD (GitOps)

**Advantages:**
- Automated deployments
- Git as source of truth
- Self-healing
- Audit trail

**Setup:**

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Deploy app-of-apps
kubectl apply -f k8s/argocd/backend-app-of-apps.yaml

# Access ArgoCD UI
kubectl port-forward -n argocd svc/argocd-server 8080:443
```

### Method 4: Deployment Scripts

**Usage:**

```bash
# Deploy to development
./scripts/deploy.sh -e dev -t develop

# Deploy to staging
./scripts/deploy.sh -e staging -t main

# Deploy to production
./scripts/deploy.sh -e prod -t v1.0.0

# Dry run
./scripts/deploy.sh -e staging -t main --dry-run

# Skip migrations
./scripts/deploy.sh -e dev -t develop --skip-migrations
```

## Environment Configuration

### Development Environment

```yaml
# k8s/overlays/dev/kustomization.yaml
namespace: dev
replicas: 1
image: ghcr.io/.../backend:develop

# Lower resource limits
resources:
  requests:
    memory: 128Mi
    cpu: 100m
  limits:
    memory: 256Mi
    cpu: 250m

# Debug logging
config:
  logLevel: debug
  demoMode: true
```

### Staging Environment

```yaml
# k8s/overlays/staging/kustomization.yaml
namespace: staging
replicas: 2
image: ghcr.io/.../backend:main

# Standard resource limits
resources:
  requests:
    memory: 200Mi
    cpu: 150m
  limits:
    memory: 400Mi
    cpu: 400m

# Info logging
config:
  logLevel: info
```

### Production Environment

```yaml
# k8s/overlays/prod/kustomization.yaml
namespace: prod
replicas: 3
image: ghcr.io/.../backend:latest

# Production resource limits
resources:
  requests:
    memory: 256Mi
    cpu: 200m
  limits:
    memory: 512Mi
    cpu: 500m

# Warn logging only
config:
  logLevel: warn

# Higher HPA limits
autoscaling:
  minReplicas: 3
  maxReplicas: 15
```

## Database Management

### Running Migrations

```bash
# Deploy migrations
./scripts/migrate.sh deploy -e dev

# Generate new migration (local)
./scripts/migrate.sh generate

# Check migration status
./scripts/migrate.sh status -e prod

# Reset database (dev only)
./scripts/migrate.sh reset -e dev
```

### Database Backups

```bash
# Create backup
./scripts/backup-db.sh -e prod

# Custom backup location
./scripts/backup-db.sh -e prod -d /backups

# Custom retention
./scripts/backup-db.sh -e prod -r 30
```

### Database Restore

```bash
# From SQL backup
gunzip -c backup_20240113.sql.gz | psql -h <host> -U <user> -d <database>

# From custom format
pg_restore -h <host> -U <user> -d <database> backup_20240113.dump
```

## Rollback Procedures

### Application Rollback

```bash
# Automatic rollback to previous version
./scripts/rollback.sh -e staging

# Rollback to specific revision
./scripts/rollback.sh -e prod --revision 5

# Check rollout history
kubectl rollout history deployment/backend-api -n prod
```

### Database Rollback

Since Prisma doesn't support automatic rollbacks:

1. Restore database from backup
2. Delete problematic migration folder
3. Revert `schema.prisma` changes
4. Re-deploy migrations

## Health Checks

### Using Health Check Script

```bash
# Check development
./scripts/health-check.sh -u https://api-dev.example.com

# Check production with verbose output
./scripts/health-check.sh -u https://api.example.com --verbose
```

### Manual Health Checks

```bash
# Liveness
curl https://api.example.com/api/v1/health/live

# Readiness
curl https://api.example.com/api/v1/health/ready

# Detailed health
curl https://api.example.com/api/v1/health/detailed
```

## Monitoring

### Logs

```bash
# View logs
kubectl logs -n prod -l app=backend-api

# Follow logs
kubectl logs -f -n prod -l app=backend-api

# Previous pod logs
kubectl logs -n prod -l app=backend-api --previous
```

### Metrics

```bash
# Port forward to metrics endpoint
kubectl port-forward -n prod svc/backend-api 3000:3000

# Query metrics
curl http://localhost:3000/api/v1/metrics
```

### Pod Status

```bash
# Get pods
kubectl get pods -n prod -l app=backend-api

# Describe pod
kubectl describe pod <pod-name> -n prod

# Get events
kubectl get events -n prod --sort-by=.metadata.creationTimestamp
```

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl get pods -n dev -l app=backend-api

# Check pod events
kubectl describe pod <pod-name> -n dev

# Check logs
kubectl logs <pod-name> -n dev

# Common causes:
# - Image pull errors (check image tag)
# - Resource limits too low
# - Missing secrets
# - Database connection failed
```

#### 2. Health Checks Failing

```bash
# Check readiness probe
kubectl get pods -n dev -l app=backend-api -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}'

# Check service endpoints
kubectl get endpoints -n dev backend-api

# Common causes:
# - Database not accessible
# - Redis not accessible
# - Wrong health check path
```

#### 3. Database Connection Issues

```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:16-alpine --restart=Never -n dev -- \
  psql -h postgres -U portfolio_user -d portfolio

# Check database service
kubectl get svc -n dev postgres

# Check database pods
kubectl get pods -n dev -l app=postgres
```

#### 4. Migration Failures

```bash
# Check migration job logs
kubectl logs -n dev job/migrate-<timestamp>

# Manually run migrations
kubectl exec -it -n dev <backend-pod> -- npm run db:migrate:prod

# Check database schema version
kubectl exec -it -n dev <backend-pod> -- npx prisma migrate status
```

### Debug Commands

```bash
# Shell into pod
kubectl exec -it -n dev <pod-name> -- /bin/sh

# Port forward for local testing
kubectl port-forward -n dev svc/backend-api 3000:3000

# Check resource usage
kubectl top pods -n dev -l app=backend-api

# Check HPA status
kubectl get hpa -n dev backend-api
```

## Security Considerations

### Secrets Management

- Never commit secrets to Git
- Use Kubernetes Secrets or external secret managers
- Rotate secrets regularly
- Use different secrets per environment

### Network Security

- Enable NetworkPolicies
- Restrict ingress/egress
- Use TLS for all external communication
- Enable CORS selectively

### Image Security

- Scan images for vulnerabilities (Trivy)
- Use specific image tags, not `latest`
- Run containers as non-root user
- Use minimal base images

## Performance Tuning

### Resource Optimization

```yaml
# Adjust based on load
resources:
  requests:
    memory: "256Mi"  # Minimum needed
    cpu: "200m"      # Minimum needed
  limits:
    memory: "512Mi"  # Maximum allowed
    cpu: "500m"      # Maximum allowed
```

### Autoscaling

```yaml
# HPA configuration
autoscaling:
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

### Database Connection Pool

```yaml
# ConfigMap settings
config:
  database:
    poolMin: 2
    poolMax: 10
    connectionTimeout: 30000
```

## Next Steps

- Set up monitoring with Prometheus/Grafana
- Configure log aggregation (ELK/Loki)
- Implement distributed tracing (Jaeger)
- Set up alerting (AlertManager)
- Configure backups automation
- Implement disaster recovery procedures

## Support

For issues or questions:
- Check logs: `kubectl logs -n <namespace> -l app=backend-api`
- Review events: `kubectl get events -n <namespace>`
- Check health: `./scripts/health-check.sh -u <api-url>`
