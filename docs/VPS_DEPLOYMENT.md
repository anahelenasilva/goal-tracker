# VPS Deployment Guide - Hostinger

This guide will help you deploy both the frontend and backend to your Hostinger VPS using Docker and Docker Compose.

## Prerequisites

1. **Hostinger VPS** with:
   - Docker installed
   - Docker Compose installed
   - SSH access
   - Domain name pointing to your VPS IP (optional but recommended)

2. **GitHub Repository** with your code

## Architecture

The deployment uses Docker Compose with the following services:

- **PostgreSQL**: Database container
- **Backend**: NestJS API container
- **Frontend**: React app served by nginx
- **Nginx**: Reverse proxy routing requests to frontend and backend

```
Internet → Nginx (Port 80/443) → Frontend (Port 80)
                              → Backend API (Port 3000) → PostgreSQL (Port 5432)
```

## Step-by-Step Deployment

### Step 1: Connect to Your VPS

SSH into your Hostinger VPS:

```bash
ssh root@your-vps-ip
# or
ssh your-username@your-vps-ip
```

### Step 2: Install Docker and Docker Compose

If not already installed:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### Step 3: Clone Your Repository

```bash
# Navigate to a suitable directory
cd /opt  # or /var/www or your preferred location

# Clone your repository
git clone https://github.com/your-username/goal-tracker-v2.git
cd goal-tracker-v2

# If using private repo, set up SSH keys or use deploy tokens
```

### Step 4: Configure Environment Variables

```bash
# Copy the example environment file
cp env.production.example .env.production

# Edit the environment file
nano .env.production
```

Update the following variables:

```env
# Application
NODE_ENV=production

# Ports
HTTP_PORT=80
HTTPS_PORT=443

# Database Configuration
DATABASE_USER=postgres
DATABASE_PASSWORD=your_very_secure_password_here
DATABASE_NAME=goal_tracker

# CORS Origins - Add your domain(s)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Frontend API URL - Your domain with /api path
VITE_API_BASE_URL=https://yourdomain.com/api
```

**Important:**
- Use a strong password for `DATABASE_PASSWORD`
- Replace `yourdomain.com` with your actual domain
- If you don't have a domain yet, use your VPS IP: `http://your-vps-ip/api`

### Step 5: Build and Start Services

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check status
docker compose -f docker-compose.prod.yml ps
```

The first build may take several minutes as it:
- Downloads base images
- Installs dependencies
- Builds the applications

### Step 6: Verify Deployment

1. **Check all containers are running:**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
   All services should show "Up" status.

2. **Check backend health:**
   ```bash
   curl http://localhost/health
   # or
   curl http://your-vps-ip/health
   ```
   Should return: `{"status":"ok","info":{"database":{"status":"up"}},...}`

3. **Check frontend:**
   ```bash
   curl http://localhost/
   # or open in browser: http://your-vps-ip/
   ```

4. **Check API:**
   ```bash
   curl http://localhost/api/goals
   # or
   curl http://your-vps-ip/api/goals
   ```

### Step 7: Configure Firewall (if needed)

If your VPS has a firewall, allow HTTP/HTTPS traffic:

```bash
# UFW (Ubuntu)
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload

# Or iptables
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### Step 8: Set Up Domain (Optional but Recommended)

1. **Point your domain to your VPS IP:**
   - Add an A record: `@` → `your-vps-ip`
   - Add an A record: `www` → `your-vps-ip`

2. **Update environment variables:**
   ```bash
   nano .env.production
   ```
   Update:
   ```env
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   VITE_API_BASE_URL=https://yourdomain.com/api
   ```

3. **Restart services:**
   ```bash
   docker compose -f docker-compose.prod.yml down
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
   ```

## Managing Your Deployment

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Stop Services

```bash
# Stop all services (keeps data)
docker compose -f docker-compose.prod.yml stop

# Stop and remove containers (keeps data)
docker compose -f docker-compose.prod.yml down
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Or rebuild specific service
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build backend
```

### Access Database

```bash
# Access PostgreSQL CLI
docker exec -it goal-tracker-postgres psql -U postgres -d goal_tracker

# Or from outside container
docker exec -it goal-tracker-postgres psql -U postgres -d goal_tracker -c "SELECT * FROM users;"
```

### Backup Database

```bash
# Create backup
docker exec goal-tracker-postgres pg_dump -U postgres goal_tracker > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
cat backup_file.sql | docker exec -i goal-tracker-postgres psql -U postgres -d goal_tracker
```

## Setting Up SSL/HTTPS (Recommended)

### Option 1: Using Certbot with Let's Encrypt

1. **Install Certbot:**
   ```bash
   apt install certbot python3-certbot-nginx -y
   ```

2. **Stop nginx container temporarily:**
   ```bash
   docker compose -f docker-compose.prod.yml stop nginx
   ```

3. **Obtain certificate:**
   ```bash
   certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   ```

4. **Update nginx configuration** to use SSL (see SSL configuration section)

5. **Restart nginx:**
   ```bash
   docker compose -f docker-compose.prod.yml start nginx
   ```

### Option 2: Using Cloudflare (Easier)

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable "Proxy" (orange cloud) in DNS settings
4. Enable "SSL/TLS" → "Full" mode
5. Cloudflare will handle SSL automatically

## SSL Configuration (if using Let's Encrypt)

Update `nginx/conf.d/default.conf` to add SSL:

```nginx
# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of configuration same as HTTP ...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Then mount SSL certificates in `docker-compose.prod.yml`:

```yaml
nginx:
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/conf.d:/etc/nginx/conf.d:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro  # Add this line
```

## Troubleshooting

### Issue: Containers won't start

**Solution:**
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check if ports are in use
netstat -tulpn | grep :80
netstat -tulpn | grep :3000

# Stop conflicting services
systemctl stop apache2  # if Apache is running
systemctl stop nginx     # if nginx is running
```

### Issue: Database connection fails

**Solution:**
```bash
# Check if postgres container is healthy
docker compose -f docker-compose.prod.yml ps postgres

# Check postgres logs
docker compose -f docker-compose.prod.yml logs postgres

# Verify environment variables
docker exec goal-tracker-backend env | grep DATABASE
```

### Issue: Frontend can't connect to API

**Solution:**
- Verify `VITE_API_BASE_URL` is set correctly in `.env.production`
- Check browser console for CORS errors
- Verify `CORS_ORIGINS` includes your frontend domain
- Rebuild frontend after changing `VITE_API_BASE_URL`:
  ```bash
  docker compose -f docker-compose.prod.yml up -d --build frontend
  ```

### Issue: 502 Bad Gateway

**Solution:**
- Check if backend is running: `docker compose -f docker-compose.prod.yml ps backend`
- Check backend logs: `docker compose -f docker-compose.prod.yml logs backend`
- Verify nginx can reach backend: `docker exec goal-tracker-nginx ping backend`

### Issue: Out of disk space

**Solution:**
```bash
# Clean up unused Docker resources
docker system prune -a --volumes

# Remove old images
docker image prune -a

# Check disk usage
df -h
docker system df
```

## Performance Optimization

### Resource Limits

Add resource limits to `docker-compose.prod.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Database Optimization

Consider adding PostgreSQL configuration for production:

```yaml
postgres:
  command:
    - "postgres"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "max_connections=100"
```

## Monitoring

### Health Checks

All services have health checks configured. Monitor them:

```bash
# Check health status
docker compose -f docker-compose.prod.yml ps

# Manual health check
curl http://localhost/health
```

### Log Rotation

Set up log rotation to prevent disk space issues:

```bash
# Create logrotate config
nano /etc/logrotate.d/docker-containers
```

Add:
```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=10M
    missingok
    delaycompress
    copytruncate
}
```

## Security Best Practices

1. **Use strong passwords** for database
2. **Keep Docker updated**: `apt update && apt upgrade docker.io`
3. **Use SSL/HTTPS** in production
4. **Regular backups** of database
5. **Monitor logs** for suspicious activity
6. **Keep application dependencies updated**
7. **Use firewall** to restrict access
8. **Regular security updates**: `apt update && apt upgrade`

## Automated Deployment with GitHub Actions (Optional)

Create `.github/workflows/deploy-vps.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/goal-tracker-v2
            git pull origin main
            docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## Quick Reference Commands

```bash
# Start services
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Stop services
docker compose -f docker-compose.prod.yml stop

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Rebuild after code changes
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# Access backend container
docker exec -it goal-tracker-backend sh

# Access database
docker exec -it goal-tracker-postgres psql -U postgres -d goal_tracker

# Backup database
docker exec goal-tracker-postgres pg_dump -U postgres goal_tracker > backup.sql

# Check resource usage
docker stats
```

## Support

For issues:
1. Check logs: `docker compose -f docker-compose.prod.yml logs`
2. Verify environment variables
3. Check container status: `docker compose -f docker-compose.prod.yml ps`
4. Review this guide's troubleshooting section

