#!/bin/bash

# Script to generate self-signed SSL certificates for HTTPS
# Usage: ./generate-ssl-cert.sh [IP_ADDRESS or DOMAIN]

set -e

SSL_DIR="./nginx/ssl"
IP_OR_DOMAIN="${1:-89.116.214.113}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Generating self-signed SSL certificate for: ${IP_OR_DOMAIN}${NC}"

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/key.pem" \
    -out "$SSL_DIR/cert.pem" \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=${IP_OR_DOMAIN}" \
    -addext "subjectAltName=IP:${IP_OR_DOMAIN},DNS:${IP_OR_DOMAIN}"

# Set proper permissions
chmod 600 "$SSL_DIR/key.pem"
chmod 644 "$SSL_DIR/cert.pem"

echo -e "${GREEN}SSL certificates generated successfully!${NC}"
echo -e "${YELLOW}Certificate location: ${SSL_DIR}/${NC}"
echo -e "${YELLOW}Note: Self-signed certificates will show a warning in browsers.${NC}"
echo -e "${YELLOW}For production, consider using Let's Encrypt with a domain name.${NC}"

