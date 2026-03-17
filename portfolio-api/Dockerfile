# ===========================================
# Multi-stage Dockerfile for Portfolio API
# Build context: monorepo root (for shared package access)
# ===========================================

# Stage 1: Build shared package
FROM node:20-alpine AS shared-builder

WORKDIR /monorepo/shared
COPY shared/package*.json ./
# Using npm install instead of npm ci — lock files are not committed
RUN npm install
COPY shared/tsconfig.json ./
COPY shared/src ./src
RUN npm run build

# Stage 2: Build API
FROM node:20-alpine AS builder

WORKDIR /monorepo

# Copy shared package (built) — mirrors monorepo layout
COPY --from=shared-builder /monorepo/shared ./shared

# Set API as working directory — now "../shared" resolves to /monorepo/shared
WORKDIR /monorepo/portfolio-api

# Copy API package files
COPY portfolio-api/package*.json ./
COPY portfolio-api/tsconfig.json ./

# Install all dependencies (dev included for TypeScript build)
# Using npm install instead of npm ci — lock files are not committed
RUN npm install

# Copy source code
COPY portfolio-api/src ./src
COPY portfolio-api/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 3: Production
FROM node:20-alpine

WORKDIR /monorepo

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy shared package (built) for runtime resolution
COPY --from=shared-builder /monorepo/shared ./shared

# Set API as working directory
WORKDIR /monorepo/portfolio-api

# Copy package files and install production dependencies only
COPY portfolio-api/package*.json ./
# Using npm install instead of npm ci — lock files are not committed
RUN npm install --omit=dev && npm cache clean --force

# Copy built application and Prisma artifacts from builder
COPY --from=builder --chown=nodejs:nodejs /monorepo/portfolio-api/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /monorepo/portfolio-api/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /monorepo/portfolio-api/prisma ./prisma

# Create uploads directory
RUN mkdir -p uploads && chown nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health/live', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
