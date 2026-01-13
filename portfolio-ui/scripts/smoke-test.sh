#!/bin/bash
# ==============================================
# Smoke Test Script
# Validates deployment health
# ==============================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ENVIRONMENT=""
NAMESPACE=""
MAX_RETRIES=30
RETRY_DELAY=2

# Usage
usage() {
  cat << EOF
Usage: $0 -e ENVIRONMENT [-n NAMESPACE]

Run smoke tests against deployed frontend

Options:
  -e, --environment    Environment (dev, staging, prod) [REQUIRED]
  -n, --namespace      Namespace [default: same as environment]
  -h, --help           Show this help message

EOF
  exit 1
}

log_info() { echo -e "${GREEN}[TEST]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; }

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--environment) ENVIRONMENT="$2"; shift 2 ;;
    -n|--namespace) NAMESPACE="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) log_error "Unknown option: $1"; usage ;;
  esac
done

if [[ -z "$ENVIRONMENT" ]]; then
  log_error "Environment is required"
  usage
fi

if [[ -z "$NAMESPACE" ]]; then
  NAMESPACE="$ENVIRONMENT"
fi

# Get service endpoint
get_service_endpoint() {
  local service_type
  service_type=$(kubectl get svc -n "$NAMESPACE" -l app.kubernetes.io/name=frontend-portfolio -o jsonpath='{.items[0].spec.type}' 2>/dev/null || echo "")
  
  if [[ -z "$service_type" ]]; then
    log_error "Service not found in namespace $NAMESPACE"
    return 1
  fi
  
  case "$service_type" in
    LoadBalancer)
      kubectl get svc -n "$NAMESPACE" -l app.kubernetes.io/name=frontend-portfolio -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}'
      ;;
    NodePort)
      local node_ip node_port
      node_ip=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
      node_port=$(kubectl get svc -n "$NAMESPACE" -l app.kubernetes.io/name=frontend-portfolio -o jsonpath='{.items[0].spec.ports[0].nodePort}')
      echo "$node_ip:$node_port"
      ;;
    *)
      # Use port-forward for ClusterIP
      echo "localhost:8080"
      ;;
  esac
}

# Test pod health
test_pod_health() {
  log_info "Testing pod health..."
  
  local ready_pods
  ready_pods=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=frontend-portfolio -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o "True" | wc -l)
  
  if [[ "$ready_pods" -eq 0 ]]; then
    log_error "No ready pods found"
    kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=frontend-portfolio
    return 1
  fi
  
  log_info "✓ Found $ready_pods ready pod(s)"
  return 0
}

# Test health endpoint
test_health_endpoint() {
  log_info "Testing /health endpoint..."
  
  local endpoint
  endpoint=$(get_service_endpoint)
  
  # Start port-forward if needed
  local port_forward_pid=""
  if [[ "$endpoint" == "localhost:8080" ]]; then
    kubectl port-forward -n "$NAMESPACE" svc/frontend-portfolio 8080:80 &>/dev/null &
    port_forward_pid=$!
    sleep 3
  fi
  
  local url="http://${endpoint}/health"
  local retry=0
  
  while [[ $retry -lt $MAX_RETRIES ]]; do
    if curl -sf "$url" -o /dev/null; then
      log_info "✓ Health endpoint responding"
      [[ -n "$port_forward_pid" ]] && kill $port_forward_pid 2>/dev/null || true
      return 0
    fi
    
    retry=$((retry + 1))
    sleep $RETRY_DELAY
  done
  
  log_error "Health endpoint not responding after $MAX_RETRIES retries"
  [[ -n "$port_forward_pid" ]] && kill $port_forward_pid 2>/dev/null || true
  return 1
}

# Test main routes
test_main_routes() {
  log_info "Testing main application routes..."
  
  local endpoint
  endpoint=$(get_service_endpoint)
  
  local port_forward_pid=""
  if [[ "$endpoint" == "localhost:8080" ]]; then
    kubectl port-forward -n "$NAMESPACE" svc/frontend-portfolio 8080:80 &>/dev/null &
    port_forward_pid=$!
    sleep 3
  fi
  
  local base_url="http://${endpoint}"
  local routes=("/" "/projects" "/about")
  
  for route in "${routes[@]}"; do
    local url="${base_url}${route}"
    
    if curl -sf "$url" -o /dev/null; then
      log_info "✓ Route $route accessible"
    else
      log_error "Route $route not accessible"
      [[ -n "$port_forward_pid" ]] && kill $port_forward_pid 2>/dev/null || true
      return 1
    fi
  done
  
  [[ -n "$port_forward_pid" ]] && kill $port_forward_pid 2>/dev/null || true
  return 0
}

# Test response time
test_response_time() {
  log_info "Testing response time..."
  
  local endpoint
  endpoint=$(get_service_endpoint)
  
  local port_forward_pid=""
  if [[ "$endpoint" == "localhost:8080" ]]; then
    kubectl port-forward -n "$NAMESPACE" svc/frontend-portfolio 8080:80 &>/dev/null &
    port_forward_pid=$!
    sleep 3
  fi
  
  local url="http://${endpoint}/"
  local response_time
  response_time=$(curl -o /dev/null -s -w '%{time_total}\n' "$url" 2>/dev/null || echo "999")
  
  [[ -n "$port_forward_pid" ]] && kill $port_forward_pid 2>/dev/null || true
  
  if (( $(echo "$response_time < 2.0" | bc -l) )); then
    log_info "✓ Response time: ${response_time}s"
    return 0
  else
    log_warn "Slow response time: ${response_time}s (expected < 2s)"
    return 0  # Warning only
  fi
}

# Test security headers
test_security_headers() {
  log_info "Testing security headers..."
  
  local endpoint
  endpoint=$(get_service_endpoint)
  
  local port_forward_pid=""
  if [[ "$endpoint" == "localhost:8080" ]]; then
    kubectl port-forward -n "$NAMESPACE" svc/frontend-portfolio 8080:80 &>/dev/null &
    port_forward_pid=$!
    sleep 3
  fi
  
  local url="http://${endpoint}/"
  local headers
  headers=$(curl -sI "$url" 2>/dev/null || echo "")
  
  [[ -n "$port_forward_pid" ]] && kill $port_forward_pid 2>/dev/null || true
  
  local required_headers=("X-Frame-Options" "X-Content-Type-Options")
  local missing=false
  
  for header in "${required_headers[@]}"; do
    if echo "$headers" | grep -qi "$header"; then
      log_info "✓ Header present: $header"
    else
      log_warn "Missing security header: $header"
      missing=true
    fi
  done
  
  [[ "$missing" == "false" ]] && return 0 || return 0  # Warning only
}

# Main execution
main() {
  log_info "Starting smoke tests for $ENVIRONMENT environment"
  
  local failed=0
  
  test_pod_health || failed=$((failed + 1))
  test_health_endpoint || failed=$((failed + 1))
  test_main_routes || failed=$((failed + 1))
  test_response_time || true
  test_security_headers || true
  
  if [[ $failed -eq 0 ]]; then
    log_info "All smoke tests passed! ✓"
    exit 0
  else
    log_error "$failed test(s) failed"
    exit 1
  fi
}

main
