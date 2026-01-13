#!/bin/bash
# ==============================================
# Backend API Deployment Script
# Deploys backend to specified environment
# ==============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
ENVIRONMENT=""
NAMESPACE=""
IMAGE_TAG=""
DRY_RUN=false
SKIP_MIGRATIONS=false

# Print colored message
print_message() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Print usage
usage() {
    cat << EOF
Usage: $0 -e <environment> -t <tag> [options]

Deploy backend API to Kubernetes cluster.

Required arguments:
    -e, --environment    Target environment (dev/staging/prod)
    -t, --tag           Docker image tag to deploy

Optional arguments:
    -n, --namespace     Kubernetes namespace (defaults to environment)
    -d, --dry-run       Perform dry run without applying changes
    -s, --skip-migrations    Skip database migrations
    -h, --help          Show this help message

Examples:
    $0 -e dev -t develop
    $0 -e staging -t main --skip-migrations
    $0 -e prod -t v1.2.3 --dry-run

EOF
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -s|--skip-migrations)
            SKIP_MIGRATIONS=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            print_message "$RED" "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate required arguments
if [[ -z "$ENVIRONMENT" ]]; then
    print_message "$RED" "Error: Environment is required"
    usage
fi

if [[ -z "$IMAGE_TAG" ]]; then
    print_message "$RED" "Error: Image tag is required"
    usage
fi

# Set namespace if not provided
if [[ -z "$NAMESPACE" ]]; then
    NAMESPACE="$ENVIRONMENT"
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_message "$RED" "Error: Invalid environment. Must be dev, staging, or prod"
    exit 1
fi

print_message "$GREEN" "=============================================="
print_message "$GREEN" "Backend API Deployment"
print_message "$GREEN" "=============================================="
echo "Environment: $ENVIRONMENT"
echo "Namespace: $NAMESPACE"
echo "Image Tag: $IMAGE_TAG"
echo "Dry Run: $DRY_RUN"
echo "Skip Migrations: $SKIP_MIGRATIONS"
print_message "$GREEN" "=============================================="
echo

# Check prerequisites
print_message "$YELLOW" "Checking prerequisites..."
if ! command -v kubectl &> /dev/null; then
    print_message "$RED" "Error: kubectl is not installed"
    exit 1
fi

if ! command -v kustomize &> /dev/null; then
    print_message "$RED" "Warning: kustomize is not installed, using kubectl kustomize"
fi

# Check cluster connectivity
if ! kubectl cluster-info &> /dev/null; then
    print_message "$RED" "Error: Cannot connect to Kubernetes cluster"
    exit 1
fi

print_message "$GREEN" "✓ Prerequisites check passed"
echo

# Navigate to overlay directory
OVERLAY_DIR="$PROJECT_ROOT/k8s/overlays/$ENVIRONMENT"
if [[ ! -d "$OVERLAY_DIR" ]]; then
    print_message "$RED" "Error: Overlay directory not found: $OVERLAY_DIR"
    exit 1
fi

cd "$OVERLAY_DIR"

# Update image tag
print_message "$YELLOW" "Updating image tag..."
if [[ -f kustomization.yaml ]]; then
    # Create temporary kustomization with new image tag
    kubectl kustomize edit set image "ghcr.io/maseko-lucky-9/portofolio_website/backend=$IMAGE_TAG"
    print_message "$GREEN" "✓ Image tag updated"
else
    print_message "$RED" "Error: kustomization.yaml not found"
    exit 1
fi
echo

# Run database migrations (unless skipped)
if [[ "$SKIP_MIGRATIONS" == false ]]; then
    print_message "$YELLOW" "Running database migrations..."
    
    if [[ "$DRY_RUN" == false ]]; then
        # Create migration job
        MIGRATION_JOB="migrate-$(date +%Y%m%d-%H%M%S)"
        
        cat <<EOF | kubectl apply -f - -n "$NAMESPACE"
apiVersion: batch/v1
kind: Job
metadata:
  name: $MIGRATION_JOB
  labels:
    app: backend-api
    component: migration
spec:
  ttlSecondsAfterFinished: 300
  template:
    spec:
      restartPolicy: OnFailure
      containers:
      - name: migrate
        image: ghcr.io/maseko-lucky-9/portofolio_website/backend:$IMAGE_TAG
        command: ['npm', 'run', 'db:migrate:prod']
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: backend-secrets
              key: database-url
EOF
        
        # Wait for migration to complete
        print_message "$YELLOW" "Waiting for migration to complete..."
        kubectl wait --for=condition=complete --timeout=300s "job/$MIGRATION_JOB" -n "$NAMESPACE" || {
            print_message "$RED" "Error: Migration failed"
            kubectl logs -f "job/$MIGRATION_JOB" -n "$NAMESPACE"
            exit 1
        }
        
        print_message "$GREEN" "✓ Database migrations completed"
    else
        print_message "$YELLOW" "DRY RUN: Would run database migrations"
    fi
else
    print_message "$YELLOW" "Skipping database migrations"
fi
echo

# Deploy application
print_message "$YELLOW" "Deploying backend API..."

if [[ "$DRY_RUN" == true ]]; then
    print_message "$YELLOW" "DRY RUN: Generated manifests:"
    kubectl kustomize .
    print_message "$GREEN" "✓ Dry run completed"
else
    # Apply kustomization
    kubectl apply -k . -n "$NAMESPACE"
    
    # Wait for rollout
    print_message "$YELLOW" "Waiting for rollout to complete..."
    kubectl rollout status deployment/backend-api -n "$NAMESPACE" --timeout=600s || {
        print_message "$RED" "Error: Deployment rollout failed"
        kubectl get pods -n "$NAMESPACE" -l app=backend-api
        exit 1
    }
    
    print_message "$GREEN" "✓ Deployment completed"
fi
echo

# Run health checks (if not dry run)
if [[ "$DRY_RUN" == false ]]; then
    print_message "$YELLOW" "Running health checks..."
    
    # Get service endpoint
    SERVICE_NAME="backend-api"
    
    # Wait for pods to be ready
    sleep 10
    
    # Port forward for health check
    kubectl port-forward -n "$NAMESPACE" "svc/$SERVICE_NAME" 3000:3000 &
    PF_PID=$!
    sleep 5
    
    # Run health checks
    HEALTH_CHECK=true
    
    if curl -f http://localhost:3000/api/v1/health/live &> /dev/null; then
        print_message "$GREEN" "✓ Liveness check passed"
    else
        print_message "$RED" "✗ Liveness check failed"
        HEALTH_CHECK=false
    fi
    
    if curl -f http://localhost:3000/api/v1/health/ready &> /dev/null; then
        print_message "$GREEN" "✓ Readiness check passed"
    else
        print_message "$RED" "✗ Readiness check failed"
        HEALTH_CHECK=false
    fi
    
    # Cleanup port forward
    kill $PF_PID 2>/dev/null || true
    
    if [[ "$HEALTH_CHECK" == false ]]; then
        print_message "$RED" "Error: Health checks failed"
        print_message "$YELLOW" "Recent logs:"
        kubectl logs -n "$NAMESPACE" -l app=backend-api --tail=50
        exit 1
    fi
    
    print_message "$GREEN" "✓ Health checks passed"
fi
echo

# Display deployment status
print_message "$GREEN" "=============================================="
print_message "$GREEN" "Deployment Summary"
print_message "$GREEN" "=============================================="

if [[ "$DRY_RUN" == false ]]; then
    echo "Pods:"
    kubectl get pods -n "$NAMESPACE" -l app=backend-api
    echo
    echo "Services:"
    kubectl get svc -n "$NAMESPACE" -l app=backend-api
    echo
    echo "Ingress:"
    kubectl get ingress -n "$NAMESPACE" -l app=backend-api
fi

print_message "$GREEN" "=============================================="
print_message "$GREEN" "✓ Deployment completed successfully!"
print_message "$GREEN" "=============================================="
