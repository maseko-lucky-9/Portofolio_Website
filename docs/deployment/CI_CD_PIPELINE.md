# Frontend CI/CD Pipeline

Production-ready CI/CD infrastructure for the portfolio frontend application with Kubernetes deployment, GitOps via ArgoCD, and multi-environment support.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Deployment Methods](#deployment-methods)
- [Environments](#environments)
- [CI/CD Pipelines](#cicd-pipelines)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This infrastructure provides:

- **Multi-stage Docker builds** with production-optimized Nginx serving
- **Comprehensive CI pipeline** with quality gates, security scanning, and performance testing
- **Automated CD pipeline** with multi-architecture builds and environment-based deployments
- **Kubernetes manifests** with Kustomize overlays for dev/staging/prod
- **Helm charts** for parameterized deployments
- **ArgoCD integration** for GitOps workflows
- **Security hardening** (non-root, read-only filesystem, network policies, Pod Security Standards)

## 🏗️ Architecture

```
portfolio-ui/
├── docker/                    # Docker configuration
│   ├── Dockerfile            # Multi-stage build (Node → Vite → Nginx)
│   ├── nginx.conf            # Nginx worker configuration
│   ├── default.conf          # Server block with SPA routing
│   └── docker-compose.yml    # Local testing
│
├── k8s/                      # Kubernetes manifests
│   ├── base/                 # Base resources (8 files)
│   ├── overlays/             # Environment-specific configs
│   │   ├── dev/             # Development environment
│   │   ├── staging/         # Staging environment
│   │   └── prod/            # Production environment
│   └── argocd/              # ArgoCD applications
│
├── helm/                     # Helm chart
│   └── frontend-portfolio/
│       ├── Chart.yaml
│       ├── values.yaml       # Default values
│       ├── values-*.yaml     # Environment values
│       └── templates/        # 9 resource templates
│
└── scripts/                  # Deployment automation
    ├── deploy.sh            # Main deployment script
    ├── smoke-test.sh        # Post-deployment validation
    └── setup-microk8s.sh    # MicroK8s cluster setup
```

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+
- kubectl 1.28+
- Kubernetes cluster (MicroK8s recommended for local)
- (Optional) Helm 3.12+
- (Optional) ArgoCD CLI

### 1. Setup MicroK8s Cluster (Linux)

```bash
cd portfolio-ui/scripts
chmod +x setup-microk8s.sh
./setup-microk8s.sh
```

This installs:
- MicroK8s 1.28
- DNS, Storage, Ingress, MetalLB addons
- cert-manager
- ArgoCD
- Required namespaces (dev, staging, prod)

### 2. Deploy to Development

```bash
cd portfolio-ui/scripts
chmod +x deploy.sh smoke-test.sh
./deploy.sh -e dev
```

### 3. Verify Deployment

```bash
kubectl get all -n dev
kubectl logs -f deployment/frontend-portfolio-dev -n dev
```

### 4. Access Application

```bash
# Port-forward to access locally
kubectl port-forward -n dev svc/frontend-portfolio 8080:80

# Open browser
open http://localhost:8080
```

## 🔧 Deployment Methods

### Method 1: Kustomize (Recommended)

**Simplest approach, good for GitOps:**

```bash
# Apply directly
kubectl apply -k k8s/overlays/dev

# Or use deployment script
./scripts/deploy.sh -e dev -m kustomize
```

**Dry run:**
```bash
kubectl kustomize k8s/overlays/dev
./scripts/deploy.sh -e dev -d
```

### Method 2: Helm

**Flexible, parameterized deployments:**

```bash
# Install/upgrade
helm upgrade --install frontend-dev \
  ./helm/frontend-portfolio \
  -f helm/frontend-portfolio/values-dev.yaml \
  -n dev --create-namespace

# Or use deployment script
./scripts/deploy.sh -e dev -m helm
```

**Customize values:**
```bash
helm install frontend-dev ./helm/frontend-portfolio \
  -f values-dev.yaml \
  --set replicaCount=3 \
  --set image.tag=v1.2.3
```

### Method 3: ArgoCD (GitOps)

**Automated, declarative deployments:**

```bash
# Deploy ArgoCD application
kubectl apply -f k8s/argocd/application-dev.yaml

# Sync application
argocd app sync frontend-dev

# Or use deployment script
./scripts/deploy.sh -e dev -m argocd
```

**App-of-Apps pattern:**
```bash
# Deploy parent app to manage all environments
kubectl apply -f k8s/argocd/app-of-apps.yaml
```

## 🌍 Environments

### Development

- **Namespace:** `dev`
- **Branch:** `develop`
- **Replicas:** 1
- **Resources:** 64Mi/50m → 128Mi/100m
- **Auto-deploy:** Yes (on push to develop)
- **URL:** dev.example.com

**Features:**
- Debug mode enabled
- Analytics disabled
- Staging TLS certificates
- Minimal resource allocation

### Staging

- **Namespace:** `staging`
- **Branch:** `main`
- **Replicas:** 2
- **Resources:** 128Mi/100m → 256Mi/200m
- **Auto-deploy:** Yes (on push to main)
- **URL:** staging.example.com

**Features:**
- Production-like environment
- All features enabled
- Production TLS certificates
- Moderate resource allocation

### Production

- **Namespace:** `prod`
- **Branch:** `main` (manual deployment)
- **Replicas:** 3 (HPA: 3-10)
- **Resources:** 256Mi/200m → 512Mi/500m
- **Auto-deploy:** No (manual approval required)
- **URL:** example.com, www.example.com

**Features:**
- All optimizations enabled
- Horizontal Pod Autoscaling
- Prometheus monitoring
- Rate limiting (100 req/s)
- Enhanced security headers
- Maximum resource allocation

## 🔄 CI/CD Pipelines

### Continuous Integration (`.github/workflows/frontend-ci.yml`)

**Triggers:** Push to `develop`, `main`, or pull requests

**Jobs:**

1. **Code Quality** (3 min)
   - ESLint linting
   - TypeScript type checking
   - Prettier formatting check

2. **Security Scanning** (2 min)
   - npm audit (dependencies)
   - Snyk vulnerability scan

3. **Build** (4 min)
   - Install dependencies
   - Vite production build
   - Upload build artifacts

4. **Bundle Size Check** (1 min)
   - Validate dist/ size < 10MB
   - Fail if exceeded

5. **Lighthouse Performance** (3 min)
   - Performance score
   - Accessibility check
   - Best practices validation

6. **CI Success Gate**
   - All jobs must pass

### Continuous Deployment (`.github/workflows/frontend-cd.yml`)

**Triggers:** 
- `develop` → dev environment
- `main` → staging environment
- Manual trigger or tag → production

**Jobs:**

1. **Build Docker Image** (5 min)
   - Multi-arch build (amd64, arm64)
   - Push to ghcr.io
   - Trivy security scan
   - Upload SARIF results

2. **Deploy to Dev**
   - Trigger: push to `develop`
   - Auto-deploy with kubectl
   - Basic smoke tests

3. **Deploy to Staging**
   - Trigger: push to `main`
   - Auto-deploy with kubectl
   - Comprehensive smoke tests

4. **Deploy to Production**
   - Trigger: Manual or release tag
   - Requires approval
   - Full smoke test suite
   - Automatic rollback on failure

## 📊 Resource Allocation

| Environment | Replicas | CPU Request | CPU Limit | Memory Request | Memory Limit | HPA |
|-------------|----------|-------------|-----------|----------------|--------------|-----|
| Dev         | 1        | 50m         | 100m      | 64Mi           | 128Mi        | No  |
| Staging     | 2        | 100m        | 200m      | 128Mi          | 256Mi        | 2-5 |
| Production  | 3        | 200m        | 500m      | 256Mi          | 512Mi        | 3-10|

## 🔒 Security Features

- **Non-root container:** User 1001
- **Read-only filesystem:** Writable volumes for /tmp, /var/cache, /var/run
- **Dropped capabilities:** All capabilities dropped
- **Network policies:** Ingress from nginx only, egress to backend/DNS/HTTPS
- **Pod Security Standards:** Restricted profile
- **Security headers:** X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **TLS termination:** cert-manager with Let's Encrypt
- **Image scanning:** Trivy vulnerability scanning in CI

## 🧪 Testing

### Smoke Tests

```bash
# Run smoke tests
./scripts/smoke-test.sh -e dev

# Tests performed:
# - Pod health (ready status)
# - /health endpoint (HTTP 200)
# - Main routes (/, /projects, /about)
# - Response time (< 2s)
# - Security headers (X-Frame-Options, etc.)
```

### Manual Testing

```bash
# Check pod status
kubectl get pods -n dev -l app.kubernetes.io/name=frontend-portfolio

# View logs
kubectl logs -f deployment/frontend-portfolio-dev -n dev

# Test health endpoint
kubectl port-forward -n dev svc/frontend-portfolio 8080:80
curl http://localhost:8080/health

# Describe resources
kubectl describe deployment frontend-portfolio-dev -n dev

# View events
kubectl get events -n dev --sort-by='.lastTimestamp'
```

## 🐛 Troubleshooting

### Pods not starting

```bash
# Check pod status
kubectl get pods -n dev

# Describe pod
kubectl describe pod <pod-name> -n dev

# View logs
kubectl logs <pod-name> -n dev

# Common issues:
# - Image pull errors: Check image tag and registry credentials
# - Resource limits: Check if node has capacity
# - Config errors: Check ConfigMap values
```

### Deployment stuck

```bash
# Check rollout status
kubectl rollout status deployment/frontend-portfolio-dev -n dev

# Restart rollout
kubectl rollout restart deployment/frontend-portfolio-dev -n dev

# Rollback
kubectl rollout undo deployment/frontend-portfolio-dev -n dev
```

### Service not accessible

```bash
# Check service endpoints
kubectl get endpoints -n dev

# Check network policies
kubectl get networkpolicy -n dev
kubectl describe networkpolicy frontend-portfolio-dev -n dev

# Test service internally
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n dev -- \
  curl http://frontend-portfolio:80/health
```

### ArgoCD sync issues

```bash
# Check application status
argocd app get frontend-dev

# View sync history
argocd app history frontend-dev

# Force sync
argocd app sync frontend-dev --force --prune

# View diff
argocd app diff frontend-dev
```

### Build failures

```bash
# Check GitHub Actions logs
gh run list --workflow=frontend-ci.yml
gh run view <run-id> --log

# Test Docker build locally
docker build -f docker/Dockerfile -t frontend:test .

# Test Kustomize
kubectl kustomize k8s/overlays/dev

# Test Helm
helm template frontend-dev ./helm/frontend-portfolio -f values-dev.yaml
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kustomize Documentation](https://kustomize.io/)
- [Helm Documentation](https://helm.sh/docs/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [MicroK8s Documentation](https://microk8s.io/docs)

## 🤝 Contributing

When making infrastructure changes:

1. Test locally with MicroK8s
2. Update relevant documentation
3. Run smoke tests
4. Create pull request with changes
5. CI pipeline must pass
6. Deploy to dev for validation
7. Promote to staging after testing
8. Production deployment requires approval

## 📄 License

MIT
