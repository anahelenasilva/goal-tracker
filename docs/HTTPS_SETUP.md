# HTTPS Setup Guide

This guide explains how to set up HTTPS for your Goal Tracker application.

## Quick Setup (Self-Signed Certificate for IP Address)

If you're using an IP address (like `89.116.214.113`), you can use a self-signed certificate:

1. **Generate SSL certificates:**
   ```bash
   cd /path/to/goal-tracker-v2
   ./nginx/generate-ssl-cert.sh 89.116.214.113
   ```
   Or manually:
   ```bash
   mkdir -p nginx/ssl
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
       -keyout nginx/ssl/key.pem \
       -out nginx/ssl/cert.pem \
       -subj "/C=US/ST=State/L=City/O=Organization/CN=89.116.214.113" \
       -addext "subjectAltName=IP:89.116.214.113"
   ```

2. **Restart nginx:**
   ```bash
   docker compose -f docker-compose.prod.yml restart nginx
   ```

3. **Test HTTPS:**
   ```bash
   curl -k https://89.116.214.113/api/goals
   ```
   Note: The `-k` flag ignores certificate warnings (needed for self-signed certs)

**Important:** Self-signed certificates will show security warnings in browsers. This is normal and expected.

## Production Setup (Let's Encrypt with Domain)

For production, use Let's Encrypt with a domain name:

1. **Point your domain to your VPS IP:**
   - Add A record: `@` → `89.116.214.113`
   - Add A record: `www` → `89.116.214.113`

2. **Install Certbot on your VPS:**
   ```bash
   apt update
   apt install certbot python3-certbot-nginx -y
   ```

3. **Stop nginx container temporarily:**
   ```bash
   docker compose -f docker-compose.prod.yml stop nginx
   ```

4. **Obtain certificate:**
   ```bash
   certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   ```

5. **Update nginx configuration:**
   Edit `nginx/conf.d/default.conf` and update the SSL certificate paths:
   ```nginx
   ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
   ```

6. **Update docker-compose.prod.yml:**
   Uncomment the Let's Encrypt volume mount:
   ```yaml
   volumes:
     - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
     - ./nginx/conf.d:/etc/nginx/conf.d:ro
     - /etc/letsencrypt:/etc/letsencrypt:ro  # Uncomment this
     # - ./nginx/ssl:/etc/nginx/ssl:ro  # Comment this out
   ```

7. **Restart nginx:**
   ```bash
   docker compose -f docker-compose.prod.yml start nginx
   ```

8. **Enable HTTP to HTTPS redirect:**
   Edit `nginx/conf.d/default.conf` and uncomment the redirect line in the HTTP server block:
   ```nginx
   return 301 https://$server_name$request_uri;
   ```

9. **Restart nginx again:**
   ```bash
   docker compose -f docker-compose.prod.yml restart nginx
   ```

10. **Set up auto-renewal:**
    ```bash
    # Test renewal
    certbot renew --dry-run

    # Add to crontab (runs twice daily)
    crontab -e
    # Add: 0 0,12 * * * certbot renew --quiet --deploy-hook "docker compose -f /path/to/goal-tracker-v2/docker-compose.prod.yml restart nginx"
    ```

## Troubleshooting

### Issue: Port 443 not accessible

**Check firewall:**
```bash
# UFW
ufw allow 443/tcp
ufw reload

# iptables
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

**Check if port is in use:**
```bash
netstat -tulpn | grep :443
```

### Issue: SSL certificate errors

**For self-signed certificates:**
- Use `curl -k` to ignore certificate warnings
- Browsers will show warnings - this is expected
- Consider using Let's Encrypt for production

**For Let's Encrypt:**
- Ensure domain DNS is properly configured
- Check certificate expiration: `certbot certificates`
- Renew if needed: `certbot renew`

### Issue: Nginx won't start

**Check nginx logs:**
```bash
docker compose -f docker-compose.prod.yml logs nginx
```

**Verify certificate paths:**
```bash
# For self-signed
ls -la nginx/ssl/

# For Let's Encrypt
ls -la /etc/letsencrypt/live/yourdomain.com/
```

**Test nginx configuration:**
```bash
docker exec goal-tracker-nginx nginx -t
```

## Testing HTTPS

```bash
# Test API endpoint
curl -k https://your-domain-or-ip/api/goals

# Test health endpoint
curl -k https://your-domain-or-ip/health

# Test with verbose output (to see SSL details)
curl -v -k https://your-domain-or-ip/api/goals
```

## Security Notes

1. **Self-signed certificates** are fine for development/testing but show warnings in browsers
2. **Let's Encrypt certificates** are free and trusted by all browsers - use for production
3. **Always use HTTPS in production** to protect user data
4. **Enable HSTS** (already configured in nginx) for additional security
5. **Keep certificates updated** - Let's Encrypt certificates expire every 90 days

