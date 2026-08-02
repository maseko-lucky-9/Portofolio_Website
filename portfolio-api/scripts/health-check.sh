#!/bin/bash
# ==============================================
# Health Check Script
# Comprehensive API health verification
# ==============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Default values
API_URL=""
ENVIRONMENT="dev"
VERBOSE=false

# Print colored message
print_message() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Print usage
usage() {
    cat << EOF
Usage: $0 -u <url> [options]

Run comprehensive health checks on the API.

Required arguments:
    -u, --url            API base URL

Optional arguments:
    -e, --environment    Environment name for display
    -v, --verbose        Verbose output
    -h, --help           Show this help message

Examples:
    $0 -u https://api-dev.example.com
    $0 -u http://localhost:3000 --verbose

EOF
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            API_URL="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
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

# Validate URL
if [[ -z "$API_URL" ]]; then
    print_message "$RED" "Error: API URL is required"
    usage
fi

print_message "$GREEN" "=============================================="
print_message "$GREEN" "API Health Check - $ENVIRONMENT"
print_message "$GREEN" "=============================================="
echo "API URL: $API_URL"
echo "Verbose: $VERBOSE"
print_message "$GREEN" "=============================================="
echo

# Track results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Run a health check
run_check() {
    local name="$1"
    local endpoint="$2"
    local expected_status="${3:-200}"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "[$TOTAL_CHECKS] $name... "
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint" 2>/dev/null || echo "FAILED")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [[ "$HTTP_CODE" == "$expected_status" ]]; then
        print_message "$GREEN" "✓ PASS"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        
        if [[ "$VERBOSE" == true ]]; then
            echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        fi
    else
        print_message "$RED" "✗ FAIL (HTTP $HTTP_CODE)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        
        if [[ "$VERBOSE" == true ]]; then
            echo "$BODY"
        fi
    fi
    
    echo
}

# Basic health checks
print_message "$YELLOW" "=== Basic Health Checks ==="
run_check "Liveness probe" "/api/v1/health/live"
run_check "Readiness probe" "/api/v1/health/ready"
run_check "Basic health" "/api/v1/health"
run_check "Detailed health" "/api/v1/health/detailed"

# API endpoints
print_message "$YELLOW" "=== API Endpoints ==="
run_check "API documentation" "/api/v1/documentation"
run_check "API metrics" "/api/v1/metrics"

# Performance check
print_message "$YELLOW" "=== Performance Check ==="
echo -n "Response time... "
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$API_URL/api/v1/health")

if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    print_message "$GREEN" "✓ PASS (${RESPONSE_TIME}s)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    print_message "$YELLOW" "⚠ SLOW (${RESPONSE_TIME}s)"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
echo

# SSL/TLS check (if HTTPS)
if [[ "$API_URL" == https* ]]; then
    print_message "$YELLOW" "=== SSL/TLS Check ==="
    echo -n "SSL certificate... "
    
    CERT_INFO=$(echo | openssl s_client -servername "$(echo $API_URL | cut -d'/' -f3)" -connect "$(echo $API_URL | cut -d'/' -f3):443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [[ -n "$CERT_INFO" ]]; then
        print_message "$GREEN" "✓ VALID"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        
        if [[ "$VERBOSE" == true ]]; then
            echo "$CERT_INFO"
        fi
    else
        print_message "$RED" "✗ INVALID"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo
fi

# Summary
print_message "$GREEN" "=============================================="
print_message "$GREEN" "Health Check Summary"
print_message "$GREEN" "=============================================="
echo "Total Checks: $TOTAL_CHECKS"
print_message "$GREEN" "Passed: $PASSED_CHECKS"
if [[ $FAILED_CHECKS -gt 0 ]]; then
    print_message "$RED" "Failed: $FAILED_CHECKS"
fi
echo

if [[ $FAILED_CHECKS -eq 0 ]]; then
    print_message "$GREEN" "✓ All health checks passed!"
    exit 0
else
    print_message "$RED" "✗ Some health checks failed"
    exit 1
fi
