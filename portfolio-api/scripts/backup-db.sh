#!/bin/bash
# ==============================================
# Database Backup Script
# Creates PostgreSQL backups
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
ENVIRONMENT="dev"
BACKUP_DIR="$PROJECT_ROOT/backups"
RETENTION_DAYS=7

# Print colored message
print_message() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Print usage
usage() {
    cat << EOF
Usage: $0 [options]

Create database backup.

Options:
    -e, --environment     Target environment (dev/staging/prod)
    -d, --directory       Backup directory (default: ./backups)
    -r, --retention       Retention days (default: 7)
    -h, --help            Show this help message

Examples:
    $0 -e prod
    $0 -e staging -d /backups -r 30

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
        -d|--directory)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -r|--retention)
            RETENTION_DAYS="$2"
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
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_message "$RED" "Error: Invalid environment"
    exit 1
fi

print_message "$GREEN" "=============================================="
print_message "$GREEN" "Database Backup"
print_message "$GREEN" "=============================================="
echo "Environment: $ENVIRONMENT"
echo "Backup Directory: $BACKUP_DIR"
echo "Retention: $RETENTION_DAYS days"
print_message "$GREEN" "=============================================="
echo

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]]; then
    export $(cat "$PROJECT_ROOT/.env.$ENVIRONMENT" | grep -v '^#' | xargs)
elif [[ "$ENVIRONMENT" == "dev" && -f "$PROJECT_ROOT/.env" ]]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
else
    print_message "$RED" "Error: Environment file not found"
    exit 1
fi

# Check if DATABASE_URL is set
if [[ -z "$DATABASE_URL" ]]; then
    print_message "$RED" "Error: DATABASE_URL not set"
    exit 1
fi

# Parse DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)"

if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    print_message "$RED" "Error: Invalid DATABASE_URL format"
    exit 1
fi

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${ENVIRONMENT}_${TIMESTAMP}"

print_message "$YELLOW" "Creating backup..."

# Create SQL backup
export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "${BACKUP_FILE}.sql"

if [[ $? -eq 0 ]]; then
    print_message "$GREEN" "✓ SQL backup created: ${BACKUP_FILE}.sql"
    
    # Compress backup
    gzip "${BACKUP_FILE}.sql"
    print_message "$GREEN" "✓ Backup compressed: ${BACKUP_FILE}.sql.gz"
    
    # Display backup size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}.sql.gz" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
else
    print_message "$RED" "Error: Backup failed"
    exit 1
fi

# Create custom format backup (for faster restore)
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -Fc -d "$DB_NAME" > "${BACKUP_FILE}.dump"

if [[ $? -eq 0 ]]; then
    print_message "$GREEN" "✓ Custom format backup created: ${BACKUP_FILE}.dump"
    DUMP_SIZE=$(du -h "${BACKUP_FILE}.dump" | cut -f1)
    echo "Dump size: $DUMP_SIZE"
fi

# Cleanup old backups
print_message "$YELLOW" "Cleaning up old backups..."
find "$BACKUP_DIR" -name "${DB_NAME}_${ENVIRONMENT}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "${DB_NAME}_${ENVIRONMENT}_*.dump" -mtime +$RETENTION_DAYS -delete
print_message "$GREEN" "✓ Old backups removed (older than $RETENTION_DAYS days)"

# List recent backups
echo
print_message "$YELLOW" "Recent backups:"
ls -lh "$BACKUP_DIR" | grep "${DB_NAME}_${ENVIRONMENT}" | tail -5

echo
print_message "$GREEN" "=============================================="
print_message "$GREEN" "✓ Backup completed successfully!"
print_message "$GREEN" "=============================================="
echo
echo "To restore this backup:"
echo "  gunzip -c ${BACKUP_FILE}.sql.gz | psql -h <host> -U <user> -d <database>"
echo "  OR"
echo "  pg_restore -h <host> -U <user> -d <database> ${BACKUP_FILE}.dump"
