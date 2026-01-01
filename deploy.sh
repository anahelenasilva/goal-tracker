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
    else
        echo -e "${RED}Error: env.production.example not found!${NC}"
        exit 1
    fi
fi

# Functions
start() {
    echo -e "${GREEN}Starting all services...${NC}"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build
    echo -e "${GREEN}Services started!${NC}"
    docker compose -f "$COMPOSE_FILE" ps
}

stop() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    docker compose -f "$COMPOSE_FILE" stop
    echo -e "${GREEN}Services stopped.${NC}"
}

restart() {
    echo -e "${YELLOW}Restarting all services...${NC}"
    docker compose -f "$COMPOSE_FILE" restart
    echo -e "${GREEN}Services restarted!${NC}"
}

logs() {
    echo -e "${GREEN}Showing logs (Ctrl+C to exit)...${NC}"
    docker compose -f "$COMPOSE_FILE" logs -f
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
    docker compose -f "$COMPOSE_FILE" ps

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

