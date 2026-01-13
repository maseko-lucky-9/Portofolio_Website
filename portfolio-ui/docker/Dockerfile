# ==============================================
# Multi-stage Dockerfile for Vite React Frontend
# Optimized for production deployment
# ==============================================

# ============================================== 
# Stage 1: Dependencies
# ==============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with clean install
RUN npm ci --only=production && \
    npm cache clean --force

# ==============================================
# Stage 2: Build
# ==============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package files and source code
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY public ./public
COPY src ./src

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Build arguments for environment variables
ARG VITE_API_BASE_URL=https://api.example.com
ARG VITE_API_VERSION=v1
ARG VITE_ENABLE_ANALYTICS=true
ARG VITE_ENABLE_CODE_DEMO=true
ARG VITE_APP_NAME=Portfolio

# Set environment variables for build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_VERSION=${VITE_API_VERSION}
ENV VITE_ENABLE_ANALYTICS=${VITE_ENABLE_ANALYTICS}
ENV VITE_ENABLE_CODE_DEMO=${VITE_ENABLE_CODE_DEMO}
ENV VITE_APP_NAME=${VITE_APP_NAME}

# Build the application
RUN npm run build

# Verify build output
RUN ls -la /app/dist

# ==============================================
# Stage 3: Production Runtime (Nginx)
# ==============================================
FROM nginx:1.25-alpine AS runner

# Add labels for metadata
LABEL maintainer="portfolio-frontend"
LABEL description="Production-ready Vite React frontend with Nginx"
LABEL version="1.0.0"

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-user -g nginx-user nginx-user

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Set proper permissions
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

# Create necessary directories with correct permissions
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp && \
    chown -R nginx-user:nginx-user /var/cache/nginx

# Switch to non-root user
USER nginx-user

# Expose port 8080 (non-privileged port)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
