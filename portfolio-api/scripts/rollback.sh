#!/bin/bash
# ==============================================
# Deployment Rollback Script
# Rollback to previous deployment
# ==============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Default values
ENVIRONMENT=""
NAMESPACE=""
REVISION=""

# Print colored message
print_message() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Print usage
usage() {
    cat << EOF
Usage: $0 -e <environment> [options]

Rollback backend API deployment.

Required arguments:
    -e, --environment    Target environment (dev/staging/prod)

Optional arguments:
    -n, --namespace      Kubernetes namespace
    -r, --revision       Specific revision to rollback to
    -h, --help           Show this help message

Examples:
    $0 -e staging
    $0 -e prod --revision 5

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
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -r|--revision)
            REVISION="$2"
            shift 2
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

# Validate environment
if [[ -z "$ENVIRONMENT" ]]; then
    print_message "$RED" "Error: Environment is required"
    usage
fi

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_message "$RED" "Error: Invalid environment"
    exit 1
fi

# Set namespace
if [[ -z "$NAMESPACE" ]]; then
    NAMESPACE="$ENVIRONMENT"
fi

print_message "$GREEN" "=============================================="
print_message "$GREEN" "Deployment Rollback"
print_message "$GREEN" "=============================================="
echo "Environment: $ENVIRONMENT"
echo "Namespace: $NAMESPACE"
[[ -n "$REVISION" ]] && echo "Target Revision: $REVISION"
print_message "$GREEN" "=============================================="
echo

# Check cluster connectivity
if ! kubectl cluster-info &> /dev/null; then
    print_message "$RED" "Error: Cannot connect to Kubernetes cluster"
    exit 1
fi

# Show rollout history
print_message "$YELLOW" "Deployment history:"
kubectl rollout history deployment/backend-api -n "$NAMESPACE"
echo

# Confirm rollback
print_message "$RED" "WARNING: This will rollback the deployment!"
read -p "Continue with rollback? (yes/no): " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
    print_message "$YELLOW" "Rollback cancelled"
    exit 0
fi

# Perform rollback
print_message "$YELLOW" "Rolling back deployment..."

if [[ -n "$REVISION" ]]; then
    kubectl rollout undo deployment/backend-api --to-revision="$REVISION" -n "$NAMESPACE"
else
    kubectl rollout undo deployment/backend-api -n "$NAMESPACE"
fi

# Wait for rollback to complete
print_message "$YELLOW" "Waiting for rollback to complete..."
kubectl rollout status deployment/backend-api -n "$NAMESPACE" --timeout=300s

if [[ $? -eq 0 ]]; then
    print_message "$GREEN" "✓ Rollback completed successfully"
else
    print_message "$RED" "Error: Rollback failed"
    exit 1
fi

# Run health checks
print_message "$YELLOW" "Running health checks..."
sleep 10

kubectl port-forward -n "$NAMESPACE" svc/backend-api 3000:3000 &
PF_PID=$!
sleep 5

if curl -f http://localhost:3000/api/v1/health/live &> /dev/null; then
    print_message "$GREEN" "✓ Health check passed"
else
    print_message "$RED" "✗ Health check failed"
fi

kill $PF_PID 2>/dev/null || true

# Show current status
echo
print_message "$GREEN" "=============================================="
print_message "$GREEN" "Current Status"
print_message "$GREEN" "=============================================="
kubectl get pods -n "$NAMESPACE" -l app=backend-api
echo
print_message "$GREEN" "✓ Rollback completed!"
