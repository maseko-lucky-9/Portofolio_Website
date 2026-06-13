#!/bin/bash
# ==============================================
# Database Migration Script
# Manages Prisma database migrations
# ==============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
COMMAND=""
ENVIRONMENT="dev"
DRY_RUN=false

# Print colored message
print_message() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Print usage
usage() {
    cat << EOF
Usage: $0 <command> [options]

Manage database migrations.

Commands:
    deploy      Deploy pending migrations
    generate    Generate a new migration
    rollback    Rollback last migration
    reset       Reset database (DANGER!)
    status      Show migration status

Options:
    -e, --environment    Target environment (dev/staging/prod)
    -d, --dry-run        Show what would be done without executing
    -h, --help           Show this help message

Examples:
    $0 deploy -e staging
    $0 generate
    $0 status -e prod
    $0 reset -e dev --dry-run

EOF
    exit 1
}

# Parse arguments
if [[ $# -eq 0 ]]; then
    usage
fi

COMMAND="$1"
shift

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
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

# Validate command
if [[ ! "$COMMAND" =~ ^(deploy|generate|rollback|reset|status)$ ]]; then
    print_message "$RED" "Error: Invalid command. Must be deploy, generate, rollback, reset, or status"
    usage
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_message "$RED" "Error: Invalid environment. Must be dev, staging, or prod"
    exit 1
fi

print_message "$GREEN" "=============================================="
print_message "$GREEN" "Database Migration - $COMMAND"
print_message "$GREEN" "=============================================="
echo "Environment: $ENVIRONMENT"
echo "Dry Run: $DRY_RUN"
print_message "$GREEN" "=============================================="
echo

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]]; then
    export $(cat "$PROJECT_ROOT/.env.$ENVIRONMENT" | grep -v '^#' | xargs)
elif [[ "$ENVIRONMENT" == "dev" && -f "$PROJECT_ROOT/.env" ]]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
else
    print_message "$YELLOW" "Warning: No environment file found"
fi

# Navigate to project root
cd "$PROJECT_ROOT"

# Execute command
case $COMMAND in
    deploy)
        print_message "$YELLOW" "Deploying migrations..."
        
        if [[ "$DRY_RUN" == true ]]; then
            print_message "$YELLOW" "DRY RUN: Would execute: npx prisma migrate deploy"
        else
            npx prisma migrate deploy
            print_message "$GREEN" "✓ Migrations deployed successfully"
        fi
        ;;
    
    generate)
        print_message "$YELLOW" "Generating new migration..."
        
        if [[ "$DRY_RUN" == true ]]; then
            print_message "$YELLOW" "DRY RUN: Would generate migration"
        else
            read -p "Migration name: " MIGRATION_NAME
            npx prisma migrate dev --name "$MIGRATION_NAME"
            print_message "$GREEN" "✓ Migration generated successfully"
        fi
        ;;
    
    rollback)
        print_message "$YELLOW" "Rolling back last migration..."
        print_message "$RED" "WARNING: This will rollback the last migration!"
        
        if [[ "$DRY_RUN" == false ]]; then
            read -p "Are you sure? (yes/no): " CONFIRM
            if [[ "$CONFIRM" != "yes" ]]; then
                print_message "$YELLOW" "Rollback cancelled"
                exit 0
            fi
        fi
        
        if [[ "$DRY_RUN" == true ]]; then
            print_message "$YELLOW" "DRY RUN: Would rollback last migration"
        else
            # Prisma doesn't have built-in rollback, need manual approach
            print_message "$RED" "Note: Prisma doesn't support automatic rollback"
            print_message "$YELLOW" "To rollback, you need to:"
            echo "1. Delete the last migration folder"
            echo "2. Revert schema.prisma changes"
            echo "3. Run: npx prisma migrate deploy"
        fi
        ;;
    
    reset)
        print_message "$YELLOW" "Resetting database..."
        print_message "$RED" "WARNING: This will DELETE ALL DATA!"
        
        if [[ "$ENVIRONMENT" == "prod" ]]; then
            print_message "$RED" "ERROR: Cannot reset production database"
            exit 1
        fi
        
        if [[ "$DRY_RUN" == false ]]; then
            read -p "Type 'RESET' to confirm: " CONFIRM
            if [[ "$CONFIRM" != "RESET" ]]; then
                print_message "$YELLOW" "Reset cancelled"
                exit 0
            fi
        fi
        
        if [[ "$DRY_RUN" == true ]]; then
            print_message "$YELLOW" "DRY RUN: Would reset database"
        else
            npx prisma migrate reset --force
            print_message "$GREEN" "✓ Database reset successfully"
        fi
        ;;
    
    status)
        print_message "$YELLOW" "Checking migration status..."
        
        npx prisma migrate status
        
        print_message "$GREEN" "✓ Status check completed"
        ;;
esac

echo
print_message "$GREEN" "=============================================="
print_message "$GREEN" "✓ Operation completed successfully!"
print_message "$GREEN" "=============================================="
