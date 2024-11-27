#!/bin/bash

# Database connection details
DB_HOST="aws-0-eu-west-3.pooler.supabase.com"
DB_PORT="6543"
DB_USER="postgres.nnsfjgmwcetyuiyoufpl"
DB_NAME="postgres"
DB_PASSWORD="Jaimeleshommes"

# Backup filename with timestamp
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

# Create backup
PGPASSWORD=$DB_PASSWORD pg_dump \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --format=plain \
  --file=$BACKUP_FILE \
  --schema=public \
  --no-owner \
  --no-privileges

# Tables to backup specifically
TABLES=(
  "users"
  "assignments"
  # Add any other tables you want to backup
)

echo "Backup completed: $BACKUP_FILE" 