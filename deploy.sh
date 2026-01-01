#!/bin/bash

# Deployment script for Goal Tracker VPS
# Usage: ./deploy.sh [command]
# Commands: start, stop, restart, logs, update, status

set -e

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Warning: $ENV_FILE not found. Copying from example...${NC}"
    if [ -f "env.production.example" ]; then
        cp env.production.example "$ENV_FILE"
        echo -e "${GREEN}Please edit $ENV_FILE with your configuration before deploying.${NC}"
        exit 1
    elif [ -f "backend/env.production.example" ]; then
        cp backend/env.production.example "$ENV_FILE"
        echo -e "${GREEN}Please edit $ENV_FILE with your configuration before deploying.${NC}"
        exit 1
    else
        echo -e "${RED}Error: env.production.example not found!${NC}"
        exit 1
    fi
fi

# Export environment variables from .env.production
# This ensures variables are available to docker compose
set -a
source "$ENV_FILE" 2>/dev/null || {
    echo -e "${RED}Error: Failed to load $ENV_FILE. Check file format.${NC}"
    echo -e "${YELLOW}Make sure the file uses KEY=value format (no spaces around =)${NC}"
    exit 1
}
set +a

# Verify required variables are set
if [ -z "$DATABASE_USER" ] || [ -z "$DATABASE_PASSWORD" ] || [ -z "$DATABASE_NAME" ]; then
    echo -e "${RED}Error: Required environment variables are not set!${NC}"
    echo -e "${YELLOW}Please check $ENV_FILE and ensure DATABASE_USER, DATABASE_PASSWORD, and DATABASE_NAME are set.${NC}"
    exit 1
fi

# Functions
start() {
    echo -e "${GREEN}Starting all services...${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build
    echo -e "${GREEN}Services started!${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
}

stop() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop
    echo -e "${GREEN}Services stopped.${NC}"
}

restart() {
    echo -e "${YELLOW}Restarting all services...${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart
    echo -e "${GREEN}Services restarted!${NC}"
}

logs() {
    echo -e "${GREEN}Showing logs (Ctrl+C to exit)...${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
}

update() {
    echo -e "${GREEN}Pulling latest code...${NC}"
    git pull origin main

    echo -e "${GREEN}Rebuilding and restarting services...${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

    echo -e "${GREEN}Update complete!${NC}"
    docker compose -f "$COMPOSE_FILE" ps
}

status() {
    echo -e "${GREEN}Service Status:${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

    echo -e "\n${GREEN}Health Check:${NC}"
    curl -s http://localhost/health | jq . || echo "Health check endpoint not responding"
}

backup_db() {
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo -e "${GREEN}Creating database backup: $BACKUP_FILE${NC}"
    docker exec goal-tracker-postgres pg_dump -U postgres goal_tracker > "$BACKUP_FILE"
    echo -e "${GREEN}Backup created: $BACKUP_FILE${NC}"
}

# Main script
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    update)
        update
        ;;
    status)
        status
        ;;
    backup)
        backup_db
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|update|status|backup}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all services"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  logs    - Show logs (follow mode)"
        echo "  update  - Pull latest code and rebuild"
        echo "  status  - Show service status and health"
        echo "  backup  - Create database backup"
        exit 1
        ;;
esac

