# Docker Configuration Guide for Full Stack Portfolio

**Complete Docker strategy for Vite + Node.js + PostgreSQL + Redis**

---

## Table of Contents

1. [Docker Compose Structure](#docker-compose-structure)
2. [Vite Frontend Dockerfile](#vite-frontend-dockerfile)
3. [Node.js Backend Dockerfile](#nodejs-backend-dockerfile)
4. [Database Services](#database-services)
5. [Development Workflow](#development-workflow)
6. [Production Deployment](#production-deployment)
7. [Performance Considerations](#performance-considerations)
8. [Debugging Docker Issues](#debugging-docker-issues)

---

## Docker Compose Structure

### **Multi-Service Architecture**

Docker Compose orchestrates your entire stack in a declarative YAML format. Each service (frontend, backend, database, cache) runs in isolated containers but communicates through defined networks.

**Service Definition Strategy:**
- Each service has a dedicated section defining its image source, build context, or official image
- Services are named logically to reflect their purpose in the application architecture
- Container names provide human-readable identifiers for debugging and logs

### **Network Configuration**

**Bridge Network Pattern:**
Your services communicate through a Docker bridge network, which provides DNS resolution where containers can reach each other by service name rather than IP address. When your backend connects to PostgreSQL, it uses the service name as the hostname.

**Network Isolation Layers:**
- **Default Bridge:** All services in the same compose file share a default network automatically
- **Custom Networks:** Create named networks for grouping services by function (frontend network, backend network)
- **External Networks:** Connect to networks created outside compose for multi-stack communication

**Service Discovery:**
Docker's embedded DNS server resolves service names to container IP addresses. When your backend references `postgres:5432`, Docker translates this to the actual container IP dynamically.

### **Port Mapping Strategy**

**Host-to-Container Binding:**
Port mapping creates a tunnel from your host machine to the container's internal port. The format is `HOST_PORT:CONTAINER_PORT`.

**Development Port Mapping:**
- Frontend: Map 8080 on host to 8080 in container for Vite dev server
- Backend: Map 3000 on host to 3000 in container for API access
- PostgreSQL: Map 5432 to 5432 for direct database access from host tools
- Redis: Map 6379 to 6379 for Redis CLI access

**Production Port Considerations:**
Only expose necessary ports. Database and cache ports should remain internal to the Docker network, accessible only to backend containers.

### **Volume Mapping Philosophy**

**Named Volumes for Data Persistence:**
Database and cache data should persist across container restarts. Named volumes are managed by Docker and stored in Docker's volume directory, surviving container deletion.

**Bind Mounts for Development:**
Map your source code directories from host to container so changes reflect immediately without rebuilding. This enables hot-reload during development.

**Volume Types:**
- **Named Volumes:** `postgres_data:/var/lib/postgresql/data` - Docker-managed, portable
- **Bind Mounts:** `./src:/app/src` - Direct host directory mapping
- **Anonymous Volumes:** Temporary data that doesn't need persistence

**Volume Mount Patterns:**
- Source code: Bind mount for live updates
- Node modules: Use anonymous volumes to avoid syncing OS-specific binaries
- Build artifacts: Anonymous volumes prevent overwriting compiled code
- Database data: Named volumes for persistence
- Logs: Bind mount for easy host access

### **Environment Variable Injection**

**Configuration Hierarchy:**
Environment variables flow from multiple sources with a precedence order:
1. Shell environment variables (highest precedence)
2. `.env` file in compose directory
3. `environment:` section in compose
4. Dockerfile `ENV` instructions (lowest precedence)

**Secret Management:**
Sensitive values should use Docker secrets or external secret managers in production. Development can use `.env` files excluded from version control.

**Variable Substitution:**
Use `${VARIABLE_NAME:-default_value}` syntax for optional variables with fallbacks. This pattern ensures containers start even when optional variables are missing.

**Environment Variable Categories:**
- **Database URLs:** Connection strings with service names as hostnames
- **Port Configuration:** Which ports services listen on internally
- **Feature Flags:** Enable/disable functionality
- **API Keys:** External service credentials
- **Build Arguments:** Variables needed during image build

### **Service Dependencies**

**Startup Order Management:**
The `depends_on` directive controls service startup order, but it only waits for container start, not application readiness.

**Health Checks for Readiness:**
Combine `depends_on` with `condition: service_healthy` to ensure dependent services are actually ready to accept connections. PostgreSQL health check verifies the database accepts queries before starting the backend.

**Dependency Patterns:**
- Backend depends on database and cache being healthy
- Frontend depends on backend being available
- Workers depend on message queue readiness

**Failure Handling:**
Set `restart: unless-stopped` for automatic recovery from crashes. The `unless-stopped` policy prevents restart when you manually stop containers.

---

## Vite Frontend Dockerfile

### **Multi-Stage Build Strategy**

Multi-stage builds separate the build environment from the runtime environment, dramatically reducing final image size.

**Stage 1 - Builder:**
This stage contains all build tools, development dependencies, TypeScript compiler, and build scripts. It performs the complete compilation and optimization process but is discarded after extracting artifacts.

**Stage 2 - Production Runtime:**
The final stage starts from a minimal base image and copies only the compiled static assets. No source code, no build tools, no development dependencies—just production-ready files.

**Size Optimization Benefits:**
A builder stage might be 1GB with all dependencies, while the final stage is only 50MB containing just static HTML/CSS/JS files.

### **Development Hot-Reload Setup**

**Development Mode Strategy:**
Instead of building the Dockerfile for development, use docker-compose to mount your source code and run Vite's development server directly.

**Volume Mount Pattern:**
Mount `./src:/app/src` and `./public:/app/public` so file changes on your host instantly appear in the container. Vite's watch mode detects changes and triggers hot module replacement (HMR).

**Node Modules Handling:**
Use an anonymous volume for `node_modules` to prevent syncing between host and container. This avoids binary incompatibility issues when host and container use different architectures.

**Port Configuration:**
Vite dev server must bind to `0.0.0.0` instead of `localhost` to be accessible from outside the container. Map port 8080 from container to host.

**WebSocket Considerations:**
Vite's HMR uses WebSockets. Ensure your Docker network and proxy configuration doesn't interfere with WebSocket upgrade requests.

### **Static Asset Optimization**

**Build Process:**
Vite compiles TypeScript to JavaScript, bundles modules, tree-shakes unused code, minifies output, and generates content-addressed filenames for cache busting.

**Asset Handling Strategy:**
Images, fonts, and other static assets under a size threshold (typically 4KB) get inlined as base64 data URLs. Larger assets are copied with hashed filenames to the output directory.

**Code Splitting:**
Vite automatically splits your application into chunks—a main bundle and lazy-loaded route chunks. This reduces initial load time as users only download code for routes they visit.

**Compression Preparation:**
Pre-compress assets with gzip and Brotli during build. Serve these pre-compressed files instead of compressing on every request.

### **Static File Serving Options**

**Option 1 - NGINX:**
Copy built assets to an NGINX Alpine image, the smallest and most performant option. NGINX serves static files incredibly efficiently with automatic compression and caching headers.

**Option 2 - Node Static Server:**
Use a minimal Node server like `serve` or `http-server` if you need Node.js runtime for features like server-side rendering or API proxying.

**Option 3 - CDN Upload:**
Build assets locally and upload to a CDN like CloudFlare, AWS CloudFront, or Vercel. The container then only needs metadata, not the actual files.

### **Health Check Configuration**

**HTTP Health Check:**
Configure a health check that requests the index HTML file and expects a 200 status code. This verifies the web server is responding and files are accessible.

**Health Check Parameters:**
- **Interval:** How often to check (e.g., every 30 seconds)
- **Timeout:** How long to wait for response (e.g., 3 seconds)
- **Retries:** Failed attempts before marking unhealthy (e.g., 3 tries)
- **Start Period:** Grace period after container start before checking (e.g., 10 seconds)

**Docker Orchestration Integration:**
Orchestrators like Docker Swarm and Kubernetes use health checks to determine when to route traffic to a container and when to restart unhealthy containers.

---

## Node.js Backend Dockerfile

### **TypeScript Compilation Approaches**

**Build-Time Compilation (Recommended):**
Compile TypeScript to JavaScript during the Docker build process. The final image contains only JavaScript, eliminating the TypeScript compiler and type definition dependencies from production.

**Runtime Compilation (Development Only):**
Use `ts-node` or `tsx` to run TypeScript directly without pre-compilation. This is convenient for development but adds overhead and increases image size for production.

**Source Maps:**
Generate source maps during TypeScript compilation to map runtime errors back to original TypeScript line numbers. Store source maps separately and only include them in staging/development environments.

### **Production vs Development Builds**

**Production Build Characteristics:**
- TypeScript compiled to JavaScript
- Only production dependencies installed
- Source maps excluded or stored separately
- Environment variable defaults for production
- Logging minimized and structured
- Process manager for resilience

**Development Build Characteristics:**
- Source code mounted as volumes (no build needed)
- All dependencies including devDependencies
- TypeScript run with `tsx` for instant feedback
- Verbose logging with pretty-printing
- Debugger ports exposed
- No process manager (direct Node execution)

**Conditional Build Stages:**
Use Docker build arguments to create different images from the same Dockerfile. Pass `--build-arg NODE_ENV=production` to trigger production optimizations.

### **Dependency Installation Strategy**

**Package Lock Files:**
Always copy `package-lock.json` (or `pnpm-lock.yaml`, `yarn.lock`) and use the lock file's install command (`npm ci` instead of `npm install`) for reproducible builds.

**Layer Caching Optimization:**
Copy package files before copying source code. Dependencies change less frequently than code, so Docker can reuse the dependency installation layer across builds when only source code changes.

**Multi-Stage Dependency Management:**
Install all dependencies in the builder stage (including devDependencies for build tools), then in the production stage, install only production dependencies. Copy compiled artifacts from builder to production stage.

### **Prisma Client Generation**

**Generation Timing:**
Prisma Client must be generated after `prisma/schema.prisma` is in the container but before the application starts. Run `npx prisma generate` during the Docker build process.

**Binary Target Specification:**
Specify the correct Prisma binary target for your production platform (typically `debian-openssl-3.0.x` for Debian-based images or `linux-musl` for Alpine).

**Schema Location:**
Copy your `prisma/` directory into the Docker image so Prisma can reference the schema. Even though the client is generated, Prisma still needs the schema file for certain operations.

### **Process Management with PM2**

**Why Process Management:**
Node.js runs single-threaded by default. A process manager enables clustering (using all CPU cores), automatic restart on crashes, graceful reloads, and zero-downtime deployments.

**PM2 Configuration:**
Create a `ecosystem.config.js` file defining your application's process behavior:
- Number of instances (cluster mode)
- Memory limits and restart thresholds
- Environment variables per environment
- Log file locations and rotation
- Error handling and restart strategies

**PM2 in Docker:**
Run PM2 in no-daemon mode (`pm2-runtime`) so it stays in the foreground and Docker can manage the process lifecycle. If PM2 runs daemonized, Docker thinks the container has stopped.

**Graceful Shutdown:**
PM2 catches SIGTERM signals and allows your application to finish current requests before shutting down. Set a kill timeout to forcefully terminate if graceful shutdown takes too long.

**Alternative: Cluster Module:**
For simpler applications, use Node's built-in `cluster` module directly. This avoids the PM2 dependency but requires more manual setup.

### **Signal Handling**

**PID 1 Problem:**
Docker runs your application as PID 1, which doesn't handle signals the same way in Linux. SIGTERM sent by Docker during shutdown might not be forwarded to your Node process.

**Init System Solution:**
Use `dumb-init` or `tini` as the container's entry point. These lightweight init systems run as PID 1 and properly forward signals to your application.

**Graceful Shutdown Implementation:**
Listen for SIGTERM and SIGINT in your application:
1. Stop accepting new connections
2. Wait for existing requests to complete
3. Close database connections
4. Exit with status code 0

### **Logging Configuration**

**Structured Logging:**
Use JSON-formatted logs in production for easy parsing by log aggregation tools like ELK Stack, Splunk, or CloudWatch. Include timestamps, log levels, request IDs, and contextual metadata.

**Log Levels:**
Configure different log levels per environment:
- **Development:** Debug level for maximum visibility
- **Production:** Info or Warn level to reduce noise
- **Critical Services:** Error level only to catch failures

**Log Output Destinations:**
**Standard Output (stdout/stderr):** Docker captures these streams and makes them available via `docker logs`. This is the preferred approach in containerized environments.

**Log Files:** If you need persistent logs, mount a volume and write to files, but ensure log rotation prevents disk space exhaustion.

**Log Aggregation:** Send logs to external services like Datadog, New Relic, or self-hosted ELK stack for centralized monitoring across all container instances.

### **Security Hardening**

**Non-Root User:**
Never run your application as root inside the container. Create a dedicated user with minimal privileges. If your application is compromised, the attacker has limited system access.

**Read-Only Filesystem:**
Mount the container's filesystem as read-only except for specific writable volumes like uploads or cache directories. This prevents attackers from modifying binaries or scripts.

**Minimal Base Image:**
Use Alpine Linux or distroless images as base. Fewer packages mean fewer vulnerabilities and smaller attack surface.

**Vulnerability Scanning:**
Regularly scan your Docker images with tools like Trivy, Snyk, or Docker Scout to identify known CVEs in base images and dependencies.

---

## Database Services

### **PostgreSQL Configuration**

**Official Image Selection:**
Use the `postgres:16-alpine` image for the latest stable PostgreSQL with minimal footprint. Alpine variant reduces image size by ~100MB compared to Debian-based variants.

**Environment Variables:**
- `POSTGRES_USER`: Superuser name (defaults to `postgres`)
- `POSTGRES_PASSWORD`: Superuser password (required for security)
- `POSTGRES_DB`: Initial database creation (defaults to username)
- `POSTGRES_INITDB_ARGS`: Additional arguments for database initialization

**Configuration Customization:**
Mount a custom `postgresql.conf` file to tune database settings like connection limits, memory allocation, and query logging. Development might need verbose logging; production needs performance tuning.

**Shared Memory Considerations:**
PostgreSQL uses shared memory for caching. Docker's default shared memory size (64MB) might be insufficient. Increase with `shm_size: 256mb` in compose or `--shm-size` flag.

### **Initialization Scripts**

**Init Script Directory:**
Any SQL or shell scripts placed in `/docker-entrypoint-initdb.d/` execute automatically when the container starts for the first time (when data directory is empty).

**Script Execution Order:**
Scripts run in alphabetical order. Prefix filenames with numbers (`01-schema.sql`, `02-seed.sql`) to control execution sequence.

**Schema Creation:**
Create application-specific schemas, tables, extensions, and initial admin users through init scripts. This ensures new environments start with correct structure.

**Extension Installation:**
Install PostgreSQL extensions like `uuid-ossp`, `pgcrypto`, or `pg_trgm` in init scripts using `CREATE EXTENSION IF NOT EXISTS`.

**Idempotency:**
Write init scripts defensively with `IF NOT EXISTS` checks so they can safely run multiple times without errors.

### **Redis Configuration**

**Persistence Modes:**
Redis offers two persistence strategies:
- **RDB (Snapshotting):** Periodic snapshots of the dataset, compact but potential data loss
- **AOF (Append-Only File):** Logs every write operation, more durable but larger files

**AOF Configuration:**
Run Redis with `--appendonly yes` to enable AOF mode. This logs every write command, ensuring minimal data loss (only last second of writes on crash).

**Memory Management:**
Set `maxmemory` limit and eviction policy. Without limits, Redis can consume all available memory. Common policies:
- `allkeys-lru`: Evict least recently used keys
- `volatile-lru`: Only evict keys with expiration set
- `noeviction`: Return errors when memory limit reached

**Configuration File Mounting:**
For complex Redis setups, create a custom `redis.conf` file and mount it into the container. Specify configuration file location in the command.

**Redis Modules:**
Install Redis modules like RedisJSON, RedisSearch, or RedisGraph by using the `redislabs/redis` image variants that include these modules pre-installed.

### **Data Persistence Strategies**

**Named Volume Benefits:**
Docker manages named volumes, storing them in a consistent location across all hosts. Volumes persist even when containers are deleted and can be backed up independently.

**Volume Location:**
On Linux, volumes reside in `/var/lib/docker/volumes/`. On Windows/Mac with Docker Desktop, they're in the Docker VM's filesystem.

**Volume Migration:**
Export volume data with `docker run --rm -v VOLUME_NAME:/data -v $(pwd):/backup alpine tar czf /backup/volume-backup.tar.gz -C /data .` and restore on another system.

**Bind Mount Considerations:**
Avoid bind mounts for database data in production. File permissions, filesystem differences, and performance characteristics vary across operating systems, causing corruption risks.

**Volume Driver Plugins:**
For cloud deployments, use volume driver plugins that connect to network storage like AWS EBS, Azure Disk, or GCP Persistent Disk. Data persists even if the host fails.

### **Backup Volume Configuration**

**Automated Backup Strategy:**
Run a separate container on a schedule (cron job or CI pipeline) that:
1. Connects to database container
2. Executes `pg_dump` for PostgreSQL or `redis-cli BGSAVE` for Redis
3. Compresses output
4. Uploads to object storage (S3, Azure Blob, GCS)
5. Rotates old backups

**Backup Container Pattern:**
Create a dedicated backup container with necessary tools (pg_dump, aws-cli) that mounts the same network as database containers and has access to backup credentials.

**Point-in-Time Recovery:**
Enable WAL (Write-Ahead Logging) archiving for PostgreSQL to support point-in-time recovery. WAL files should be continuously copied to backup storage.

**Backup Verification:**
Regularly restore backups to a test environment to verify backup integrity and recovery procedures. Backups are worthless if restoration fails.

**Backup Retention:**
Implement a retention policy:
- Hourly backups kept for 24 hours
- Daily backups kept for 7 days
- Weekly backups kept for 4 weeks
- Monthly backups kept for 12 months

---

## Development Workflow

### **Docker Compose for Local Development**

**Single Command Startup:**
Developers run one command (`docker-compose up`) to start all services with proper dependencies and networking configured. This eliminates "works on my machine" issues.

**Service Isolation:**
Each developer's environment is isolated from their host system. Multiple projects can run simultaneously without port conflicts (using different compose files with different port mappings).

**Override Files Pattern:**
Use `docker-compose.override.yml` for local developer customizations that don't get committed. The override file automatically merges with base compose file.

**Profile-Based Environments:**
Define service profiles (`--profile development`, `--profile testing`) to selectively start subsets of services. Testers might only need frontend and mock backend.

### **Volume Mounts for Code Changes**

**Bind Mount Strategy:**
Mount source code directories from host to container so changes immediately reflect inside containers. This enables hot-reload without rebuilding images.

**Mount Points:**
- `./src:/app/src:delegated` - Application source code
- `./public:/app/public:delegated` - Static assets
- `./.env:/app/.env:ro` - Environment variables (read-only)

**Performance Considerations on Windows/Mac:**
Docker Desktop uses a VM on Windows/Mac, making bind mounts slower. Use `delegated` or `cached` flags to improve performance by relaxing consistency guarantees.

**Node Modules Exclusion:**
Create an anonymous volume for `node_modules` to prevent syncing. Host and container might use different operating systems, causing native module binary incompatibility.

**File Permission Issues:**
Container processes run as specific UIDs. On Linux, ensure your host user UID matches the container user UID, or use user namespace remapping.

### **Watch Mode Configuration**

**Frontend Hot Reload:**
Vite's development server watches for file changes and performs hot module replacement (HMR) automatically. Ensure `watchOptions` includes container paths.

**Backend Auto-Restart:**
Use `nodemon` or `tsx watch` to restart the Node server when TypeScript files change. Configure nodemon to watch specific directories and ignore node_modules.

**Polling vs Native Watching:**
Native file watching (inotify on Linux) doesn't always work across Docker boundaries. Enable polling mode with `usePolling: true` to reliably detect changes.

**Performance Optimization:**
Limit watch scope to necessary directories. Watching thousands of files in node_modules degrades performance. Use ignore patterns extensively.

### **Debugger Attachment**

**VSCode Debug Configuration:**
Create a `.vscode/launch.json` configuration that attaches to the Node process running inside the container.

**Debug Port Exposure:**
Expose Node's debug port (typically 9229) from container to host. Start Node with `--inspect=0.0.0.0:9229` to accept external debugger connections.

**Source Map Configuration:**
Ensure source maps are generated and paths are correctly mapped between container and host. VSCode needs to know where to find TypeScript source files relative to the running JavaScript.

**Remote Debugging Workflow:**
1. Start Node process in debug mode inside container
2. Expose debug port to host
3. VSCode connects to `localhost:9229`
4. Set breakpoints in TypeScript source
5. VSCode maps breakpoints to running JavaScript via source maps

**Chrome DevTools Alternative:**
Open `chrome://inspect` in Chrome browser and configure network target pointing to `localhost:9229`. This gives you Chrome's debugger interface for Node.js.

### **Terminal Access Patterns**

**Interactive Shell Access:**
Run `docker exec -it CONTAINER_NAME /bin/sh` to get a shell inside a running container. Use `/bin/bash` if the container has bash installed.

**Running One-Off Commands:**
Execute single commands without entering interactive mode: `docker exec CONTAINER_NAME npm run seed`. Useful for CI/CD scripts and automation.

**Database Access:**
Connect to PostgreSQL inside container: `docker exec -it CONTAINER_NAME psql -U postgres -d portfolio_db`. Same pattern for Redis CLI.

**Log Streaming:**
View real-time logs with `docker logs -f CONTAINER_NAME`. Add `--tail 100` to start from the last 100 lines instead of showing all historical logs.

**Container Inspection:**
Use `docker inspect CONTAINER_NAME` to view detailed container configuration, network settings, mount points, and environment variables.

---

## Production Deployment

### **Image Optimization**

**Base Image Selection:**
Choose minimal base images to reduce size and attack surface:
- **Alpine Linux:** 5MB base size, uses musl libc (requires recompiled native modules)
- **Debian Slim:** 50MB base size, standard glibc (better compatibility)
- **Distroless:** No package manager or shell, contains only app and runtime

**Layer Minimization:**
Each Dockerfile instruction creates a layer. Combine related commands with `&&` to reduce layers:
- Installing packages and cleaning cache in one RUN statement
- Copying related files together
- Chaining commands that must execute in sequence

**Dependency Pruning:**
After installing dependencies, remove package manager cache and temporary files. For npm: `npm ci --only=production && npm cache clean --force`.

**Build Context Optimization:**
Use `.dockerignore` to exclude unnecessary files from build context. Common exclusions: `.git`, `node_modules`, test files, documentation, and environment files.

**Multi-Arch Builds:**
Build images for multiple architectures (amd64, arm64) using `docker buildx`. This ensures your image runs on both x86 servers and ARM-based services like AWS Graviton.

### **Security Hardening**

**Vulnerability Scanning:**
Integrate Docker image scanning into your CI pipeline. Tools like Trivy, Snyk, or Aqua Security identify known vulnerabilities in base images and dependencies.

**Secret Management:**
Never hardcode secrets in Dockerfiles or images. Use:
- Docker secrets (Swarm)
- Kubernetes secrets
- External secret managers (Vault, AWS Secrets Manager, Azure Key Vault)

**Image Signing:**
Use Docker Content Trust to sign images and verify signatures before deployment. This prevents running tampered images.

**Network Policies:**
Implement network segmentation where frontend containers can't directly access database containers. All database access must route through backend containers.

**Runtime Security:**
Run containers in read-only mode with specific writable directories mounted. Use security profiles (AppArmor, SELinux) to restrict container capabilities.

### **Resource Limits**

**Memory Limits:**
Set `--memory` limits to prevent containers from consuming all host memory. If a container exceeds its limit, Docker kills it with OOM (out of memory).

**CPU Limits:**
Use `--cpus` to restrict CPU usage. Value of `1.5` means the container can use 1.5 CPU cores worth of time.

**Memory Reservation:**
Set `--memory-reservation` lower than memory limit. This is a soft limit; Docker tries to keep usage below this but allows bursting to the hard limit.

**Swap Configuration:**
Disable swap for containers hosting databases to prevent performance degradation. Use `--memory-swappiness=0`.

**Resource Allocation Strategy:**
- **Databases:** High memory reservation, generous CPU
- **API Servers:** Moderate resources, scale horizontally
- **Workers:** Lower resources, scale based on queue depth
- **Frontend:** Minimal resources (just serving static files)

### **Health Checks and Liveness**

**Health Check Implementation:**
Each service should expose a health check endpoint that verifies:
- Service is responding to requests
- Database connections are active
- External dependencies are reachable
- Service is not in a degraded state

**Orchestrator Integration:**
Docker Swarm and Kubernetes use health checks to:
- Determine when container is ready to receive traffic
- Detect when container needs restart
- Make load balancing decisions
- Perform rolling updates safely

**Liveness vs Readiness:**
- **Liveness:** Is the container alive? (Failure = restart container)
- **Readiness:** Is the container ready for traffic? (Failure = stop routing traffic)

### **Monitoring Integration**

**Metrics Collection:**
Export application metrics to monitoring systems:
- Prometheus: Scrape `/metrics` endpoint from containers
- StatsD: Send metrics to StatsD aggregator
- CloudWatch: Use CloudWatch agent in sidecar pattern

**Log Aggregation:**
Forward container logs to centralized logging:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Datadog
- Cloud-native (CloudWatch Logs, Azure Monitor, Google Cloud Logging)

**Tracing Integration:**
Implement distributed tracing with OpenTelemetry, Jaeger, or Zipkin to track requests across your microservices architecture.

**Container Metrics:**
Monitor Docker-level metrics:
- CPU usage per container
- Memory usage and limits
- Network I/O
- Disk I/O
- Container restart counts

---

## Performance Considerations

### **Build Cache Optimization**

**Layer Caching Strategy:**
Docker caches each layer and reuses it if the instruction and context haven't changed. Optimize by:
- Copying package files before source code (dependencies change less frequently)
- Installing dependencies in separate layer
- Copying source code last (changes most frequently)

**Cache Invalidation Points:**
Any change to a layer invalidates that layer and all subsequent layers. Structure Dockerfile so expensive operations (like dependency installation) come before cheap operations (like copying source).

**BuildKit Enhancements:**
Enable BuildKit (`DOCKER_BUILDKIT=1`) for advanced caching features:
- Parallel build stage execution
- Build secret mounting without leaving secrets in image
- Cache mounting to persist package manager caches across builds
- Selective stage building

**Remote Cache:**
Use `--cache-from` to pull cache layers from a registry. In CI environments without persistent cache, this dramatically speeds up builds.

**Multi-Stage Benefits:**
Each stage can be cached independently. If only the final stage changes, all builder stages are reused from cache.

### **Layer Minimization Techniques**

**Command Chaining:**
Combine related RUN commands with `&&`:
Instead of three separate RUN instructions (three layers), chain them into one RUN instruction (one layer).

**Cleanup in Same Layer:**
Delete temporary files in the same layer where they're created. Deleting in a later layer doesn't reduce image size because the file exists in an earlier layer.

**Squashing Layers:**
Use `docker build --squash` to flatten all layers into one. This reduces layer count but loses caching benefits. Only use for final release images.

**Base Image Optimization:**
Start from the smallest base image that supports your application. Alpine is ideal for Node.js apps without native dependencies.

### **Dependency Management**

**Package Lock Files:**
Lock files ensure reproducible builds with identical dependency versions. Use `npm ci` instead of `npm install` to strictly respect lock file.

**Dependency Auditing:**
Run `npm audit` during build to identify vulnerable dependencies. Fail build on high-severity vulnerabilities.

**Unused Dependency Removal:**
Periodically audit dependencies with tools like `depcheck` to identify and remove unused packages, reducing image size and vulnerability surface.

**Dependency Deduplication:**
Run `npm dedupe` to eliminate duplicate dependencies in your dependency tree, reducing node_modules size.

### **Multi-Architecture Builds**

**Architecture Support:**
Modern deployments span multiple CPU architectures:
- **amd64 (x86_64):** Traditional Intel/AMD servers
- **arm64 (aarch64):** AWS Graviton, Apple Silicon, Raspberry Pi

**BuildKit Multi-Platform:**
Use `docker buildx` to build for multiple platforms simultaneously:
The builder creates architecture-specific images and pushes them to the registry with a manifest list. Docker automatically pulls the correct architecture.

**Platform-Specific Instructions:**
Use build arguments or conditional logic for architecture-specific steps. Some npm packages require different binaries per architecture.

**Performance Benefits:**
ARM processors often provide better price/performance ratio. Supporting both architectures lets you optimize costs by choosing the best platform per service.

### **CDN Integration Strategy**

**Static Asset Separation:**
During Vite build, upload all static assets (JS, CSS, images) to a CDN. Update HTML to reference CDN URLs instead of local paths.

**Cache-Control Headers:**
Set aggressive caching headers on immutable assets (content-addressed filenames). Use short TTLs for HTML entry point.

**Image Optimization:**
Use CDN image transformation features to serve responsive images. Request different sizes/formats based on device and browser support.

**Edge Functions:**
Some CDNs support edge compute (CloudFlare Workers, AWS Lambda@Edge) for dynamic behavior close to users. Render personalized content at the edge.

---

## Debugging Docker Issues

### **Log Aggregation and Analysis**

**Container Logs:**
Each container's stdout/stderr is captured by Docker. View logs with `docker logs CONTAINER_NAME`.

**Log Drivers:**
Configure alternative log drivers in Docker daemon:
- `json-file`: Default, stores logs as JSON files
- `syslog`: Forward to syslog server
- `journald`: Integrate with systemd journal
- `gelf`: Send to Graylog
- `fluentd`: Forward to Fluentd aggregator

**Structured Logging:**
Output logs as JSON objects for easier parsing and querying. Include contextual fields like request ID, user ID, and timestamps.

**Log Rotation:**
Configure log rotation to prevent disk space exhaustion. Set max log size and number of log files to retain.

**Centralized Logging:**
Aggregate logs from all containers to a central system:
- **ELK Stack:** Parse, index, and visualize logs
- **Loki:** Log aggregation optimized for Kubernetes
- **Cloud Services:** CloudWatch Logs, Azure Monitor, Google Cloud Logging

### **Network Debugging**

**Network Inspection:**
Inspect Docker networks with `docker network inspect NETWORK_NAME` to see connected containers, IP addresses, and configuration.

**DNS Resolution Testing:**
Enter a container and test DNS resolution: `docker exec -it CONTAINER ping other-container-name`. This verifies service discovery.

**Port Connectivity:**
Test port connectivity between containers: `docker exec -it CONTAINER nc -zv OTHER_CONTAINER PORT`. Use netcat to verify TCP connections.

**Network Capture:**
Use `tcpdump` inside containers to capture network traffic for analysis: `docker exec CONTAINER tcpdump -i eth0 -w /tmp/capture.pcap`.

**Overlay Networks:**
For Docker Swarm, use overlay networks for multi-host communication. Troubleshoot with `docker network ls --filter driver=overlay`.

**Bridge Network Details:**
Inspect bridge network to see subnet, gateway, and IPAM configuration. Conflicts with host network can cause connectivity issues.

### **Resource Monitoring**

**Container Stats:**
View real-time resource usage with `docker stats`. Shows CPU%, memory usage, network I/O, and block I/O for all running containers.

**cAdvisor Integration:**
Deploy Google's cAdvisor container to collect and export detailed resource metrics. Integrate with Prometheus for time-series storage.

**Resource Pressure:**
Monitor for resource exhaustion:
- High memory usage leading to OOM kills
- CPU throttling when hitting limits
- Disk space consumption
- Network bandwidth saturation

**Host vs Container Metrics:**
Distinguish between host resource usage and container resource usage. A container might be fine, but the host might be overcommitted.

### **Service Discovery Issues**

**DNS Troubleshooting:**
Common DNS issues:
- Containers not on same network can't resolve each other
- Custom DNS servers configured incorrectly
- /etc/hosts overrides causing conflicts

**Service Name Resolution:**
Docker's embedded DNS resolves service names to container IPs. Verify with `nslookup SERVICE_NAME` inside container.

**Network Connectivity:**
Containers on different networks require explicit network connections. Use `docker network connect` to add a container to additional networks.

**Port Conflicts:**
If container fails to start, check for port conflicts on host with `netstat -tulpn | grep PORT`.

### **Build Failures**

**Context Size Issues:**
Large build contexts slow down builds. Check context size with `docker build --no-cache --progress=plain .` and optimize `.dockerignore`.

**Layer Cache Misses:**
If builds are slow, investigate cache invalidation. Small changes to early layers invalidate all subsequent layers.

**Dependency Installation Failures:**
Network issues or registry downtime can fail builds. Implement retry logic and consider using a private registry mirror.

**Multi-Stage Build Debugging:**
Build individual stages with `--target STAGE_NAME` to isolate issues. Test builder stage separately from production stage.

### **Container Startup Failures**

**Entry Point Issues:**
Verify entry point script has execute permissions and correct shebang. Use `ENTRYPOINT ["executable"]` syntax instead of shell form to avoid shell interpretation issues.

**Missing Dependencies:**
Container might start but application fails due to missing libraries. Use `ldd /path/to/binary` inside container to verify shared library dependencies.

**Permission Denied:**
Running as non-root user requires proper file ownership and permissions. Use `COPY --chown=user:group` to set ownership during build.

**Health Check Failures:**
Container starts but orchestrator marks it unhealthy. Debug health check with `docker exec CONTAINER health-check-command` to see output.

---

## Current State Analysis

### **Existing Docker Setup Review**

Your current Docker configuration includes:

**Docker Compose Files:**
- `docker-compose.yml`: Production configuration with API container, PostgreSQL, Redis, health checks, and proper dependency ordering
- `docker-compose.dev.yml`: Development configuration with just PostgreSQL and Redis (API runs on host for better development experience)

**Backend Dockerfile:**
- Multi-stage build separating builder and production stages
- Alpine-based Node 20 image
- Non-root user security
- TypeScript compilation in builder stage
- Prisma client generation
- dumb-init for signal handling
- Health check endpoint verification
- Production-optimized with minimal dependencies

**Current Strengths:**
- Health checks configured for all services
- Named volumes for data persistence
- Service dependency ordering with health conditions
- Security: non-root user, minimal base image
- Environment variable configuration
- Proper signal handling with dumb-init

**Missing Components:**
- Frontend Dockerfile (Vite application)
- Database initialization scripts
- Custom Redis configuration
- Development-specific Dockerfiles with hot-reload
- Docker Compose override file for local customization
- Multi-architecture build configuration
- Container resource limits
- Monitoring integration configuration

---

## Next Steps Recommendations

### **Immediate Enhancements**

1. **Create Frontend Dockerfile:**
   - Multi-stage build with builder using Node for Vite compilation
   - Production stage using NGINX Alpine to serve static files
   - Development override mounting source code for hot-reload
   - Health check for NGINX server

2. **Add Database Init Scripts:**
   - Create `postgres-init/` directory with SQL scripts
   - Mount initialization scripts in compose file
   - Add schema extensions and initial configuration
   - Document initialization sequence

3. **Development Docker Compose:**
   - Add frontend service to dev compose
   - Mount source code for both frontend and backend
   - Expose debug ports for VSCode attachment
   - Add development-specific environment variables

4. **Production Hardening:**
   - Add resource limits to all services
   - Configure restart policies
   - Implement log rotation
   - Add security scanning to CI pipeline

5. **Documentation:**
   - Document all environment variables
   - Create setup guide for new developers
   - Document production deployment process
   - Add troubleshooting runbook

---

## Conclusion

This guide provides a comprehensive understanding of Docker concepts as they apply to your full-stack portfolio application. Each decision in your Docker configuration—from base image selection to network architecture to volume strategies—impacts security, performance, and developer experience.

Your current setup demonstrates Docker best practices with multi-stage builds, health checks, and proper service orchestration. The next phase involves extending these patterns to your frontend application and adding production-grade features like resource limits, monitoring integration, and advanced security hardening.

The key principles to remember:
- **Separation of concerns:** Development and production configurations serve different needs
- **Layering strategy:** Optimize Dockerfile instructions for cache efficiency
- **Security by default:** Non-root users, minimal images, no secrets in images
- **Observable systems:** Logs, metrics, and health checks at every level
- **Reproducibility:** Lock files, explicit versions, immutable infrastructure

With Docker, your entire application stack becomes portable, reproducible, and scalable, enabling consistent development environments and reliable production deployments.
