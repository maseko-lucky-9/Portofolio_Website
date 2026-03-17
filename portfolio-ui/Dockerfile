# ==============================================
# Multi-stage Dockerfile for Portfolio UI
# Optimized for MicroK8s homelab deployment
# ==============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install all dependencies (dev included for build tooling)
RUN npm ci

# Copy source and config
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY public ./public
COPY src ./src

# Build arguments — baked into the static bundle at build time
ARG VITE_API_URL=/api
ARG VITE_API_VERSION=v1
ARG VITE_USE_API=true
ARG VITE_ENABLE_MSW=false
ARG VITE_APP_NAME=Portfolio

# Build the application
RUN npm run build

# ==============================================
# Stage 2: Production (Nginx)
# ==============================================
FROM nginx:1.27-alpine

LABEL maintainer="portfolio-ui"
LABEL description="Portfolio website frontend — Nginx SPA"

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G appuser appuser

# Copy nginx config (single-file server block)
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Set permissions for non-root operation
RUN chown -R appuser:appuser /usr/share/nginx/html && \
    chown -R appuser:appuser /var/cache/nginx && \
    chown -R appuser:appuser /var/log/nginx && \
    chown -R appuser:appuser /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appuser /var/run/nginx.pid && \
    mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp && \
    chown -R appuser:appuser /var/cache/nginx

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
