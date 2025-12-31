# Docker Setup Guide

## Overview

This project uses Docker Compose to run PostgreSQL 16 in a container, making it easy to set up and manage the database without installing PostgreSQL locally.

## Configuration

### Port Mapping

- **Host Port**: 5434
- **Container Port**: 5432 (PostgreSQL default)

This non-standard port (5434) is used to avoid conflicts with any local PostgreSQL installation.

### Database Credentials

Default credentials are defined in `.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5434
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=goal_tracker
```

## Getting Started

### Prerequisites

- Docker installed and running
- Docker Compose installed

Check if Docker is running:
```bash
docker ps
```

### Starting the Database

Use the npm script (recommended):
```bash
pnpm run docker:up
```

Or use Docker Compose directly:
```bash
docker-compose up -d
```

The `-d` flag runs the container in detached mode (background).

### Checking Status

```bash
docker-compose ps
```

You should see:
```
NAME                      STATUS        PORTS
goal-tracker-postgres     Up (healthy)  0.0.0.0:5434->5432/tcp
```

### Viewing Logs

```bash
pnpm run docker:logs
```

Or:
```bash
docker-compose logs -f postgres
```

Press `Ctrl+C` to stop viewing logs (container keeps running).

### Stopping the Database

```bash
pnpm run docker:down
```

Or:
```bash
docker-compose down
```

This stops and removes the container but **keeps the data**.

### Removing All Data

⚠️ **Warning**: This will delete all database data!

```bash
pnpm run docker:clean
```

Or:
```bash
docker-compose down -v
```

The `-v` flag removes the named volume where PostgreSQL stores data.

### Restarting the Database

```bash
pnpm run docker:restart
```

Or:
```bash
docker-compose restart
```

## Accessing the Database

### Using Docker Exec

Access the PostgreSQL CLI inside the container:

```bash
docker exec -it goal-tracker-postgres psql -U postgres -d goal_tracker
```

Common psql commands:
- `\dt` - List all tables
- `\d table_name` - Describe a table
- `\q` - Quit psql

### Using External Tools

You can connect to the database using tools like:
- pgAdmin
- DBeaver
- TablePlus
- psql (if installed locally)

Connection details:
- Host: `localhost`
- Port: `5434`
- Database: `goal_tracker`
- Username: `postgres`
- Password: `postgres`

## Data Persistence

Database data is stored in a Docker named volume called `backend_postgres_data`.

### View Volume

```bash
docker volume ls | grep backend_postgres_data
```

### Inspect Volume

```bash
docker volume inspect backend_postgres_data
```

### Backup Database

```bash
docker exec goal-tracker-postgres pg_dump -U postgres goal_tracker > backup.sql
```

### Restore Database

```bash
docker exec -i goal-tracker-postgres psql -U postgres goal_tracker < backup.sql
```

## Troubleshooting

### Port Already in Use

If port 5434 is already in use:

1. Find what's using it:
   ```bash
   lsof -i :5434
   ```

2. Either:
   - Stop the process using that port
   - Change the port in `docker-compose.yml` and `.env`

### Container Won't Start

Check the logs:
```bash
docker-compose logs postgres
```

Common issues:
- Port conflict (see above)
- Docker daemon not running
- Insufficient disk space

### Database Connection Refused

1. Ensure container is running:
   ```bash
   docker-compose ps
   ```

2. Check health status:
   ```bash
   docker inspect goal-tracker-postgres | grep -A 10 Health
   ```

3. Wait for health check to pass (may take 10-30 seconds on first start)

### Reset Everything

If you want to start completely fresh:

```bash
# Stop and remove containers and volumes
pnpm run docker:clean

# Remove any orphaned containers
docker-compose down --remove-orphans

# Start fresh
pnpm run docker:up
```

## Production Considerations

⚠️ **Important**: This Docker setup is for **development only**.

For production:
1. Use a managed database service (AWS RDS, Google Cloud SQL, etc.)
2. If self-hosting:
   - Change default passwords
   - Configure backups
   - Set up monitoring
   - Use SSL/TLS connections
   - Configure proper networking/firewall rules
   - Use secrets management

## NPM Scripts Reference

All Docker-related commands available:

```json
{
  "docker:up": "Start PostgreSQL container",
  "docker:down": "Stop PostgreSQL container (keep data)",
  "docker:logs": "View PostgreSQL logs",
  "docker:restart": "Restart PostgreSQL container",
  "docker:clean": "Stop and remove all data (⚠️ destructive)"
}
```

## Docker Compose File Explained

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine        # Lightweight PostgreSQL 16
    container_name: goal-tracker-postgres
    restart: unless-stopped          # Auto-restart on crash
    environment:
      POSTGRES_USER: ${DATABASE_USER:-postgres}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:-postgres}
      POSTGRES_DB: ${DATABASE_NAME:-goal_tracker}
    ports:
      - '5434:5432'                  # Host:Container port mapping
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Data persistence
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:                     # Named volume for data
    driver: local
```

## Best Practices

1. **Always use npm scripts** for consistency
2. **Check logs** if something doesn't work
3. **Back up data** before running `docker:clean`
4. **Wait for health check** to pass before connecting
5. **Use `.env` file** for configuration (already set up)

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

