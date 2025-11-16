#!/bin/bash

# Script de backup do MongoDB
# Uso: ./scripts/backup-db.sh

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    exit 1
fi

# Criar diretório de backups se não existir
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Nome do arquivo de backup com timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP"

echo -e "${YELLOW}Starting MongoDB backup...${NC}"

# Extrair informações da connection string
# MongoDB connection string format: mongodb://[username:password@]host[:port][/database][?options]
# Para mongodump, precisamos da connection string completa

# Fazer backup
if mongodump --uri="$DATABASE_URL" --out="$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ Backup completed successfully${NC}"
    echo -e "Backup location: $BACKUP_FILE"
    
    # Comprimir backup (opcional)
    echo -e "${YELLOW}Compressing backup...${NC}"
    if tar -czf "$BACKUP_FILE.tar.gz" -C "$BACKUP_DIR" "backup_$TIMESTAMP" 2>/dev/null; then
        echo -e "${GREEN}✓ Backup compressed${NC}"
        # Remover diretório não comprimido para economizar espaço
        rm -rf "$BACKUP_FILE"
        echo -e "Compressed backup: $BACKUP_FILE.tar.gz"
    fi
    
    # Manter apenas os últimos 7 backups
    echo -e "${YELLOW}Cleaning old backups (keeping last 7)...${NC}"
    ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null
    echo -e "${GREEN}✓ Cleanup completed${NC}"
else
    echo -e "${RED}✗ Backup failed${NC}"
    echo -e "${YELLOW}Make sure mongodump is installed and DATABASE_URL is correct${NC}"
    exit 1
fi

echo -e "${GREEN}Backup process completed!${NC}"

