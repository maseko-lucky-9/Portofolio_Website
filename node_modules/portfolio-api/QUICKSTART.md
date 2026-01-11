# 🚀 Quick Start Guide - Portfolio Backend API

## Prerequisites
- Node.js 20+
- Docker Desktop (for PostgreSQL & Redis)

## 5-Minute Setup

### 1. Start Infrastructure
```bash
cd portfolio-api
docker compose -f docker-compose.dev.yml up -d
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 4. Start Server
```bash
npm run dev
```

Server will start at: **http://localhost:3000**

API Docs: **http://localhost:3000/api-docs**

## 🧪 Test the API

### Login (get access token)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@portfolio.dev",
    "password": "admin123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@portfolio.dev",
      "role": "ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Get Profile (authenticated)
```bash
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Health Check
```bash
curl http://localhost:3000/api/v1/health
```

## 📊 Seeded Data

### Users
- **Admin**: admin@portfolio.dev / admin123
- **Demo**: demo@portfolio.dev / demo123

### Content
- 3 Projects (E-commerce, Analytics Dashboard, API Gateway)
- 2 Articles (Fastify tutorial, PostgreSQL optimization)
- 15 Tags (TypeScript, React, Node.js, etc.)
- 70+ Analytics Events
- 2 Contact Submissions
- 3 Newsletter Subscribers

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run lint` | Lint code |
| `npm run format` | Format code |

## 🐳 Docker Deployment

### Production
```bash
# Start all services (API + DB + Redis)
docker compose up -d

# View logs
docker compose logs -f api

# Stop services
docker compose down
```

### Environment Variables
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - At least 32 characters

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/profile` - Get profile
- `PATCH /api/v1/auth/profile` - Update profile
- `POST /api/v1/auth/change-password` - Change password

### Health
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed health info
- `GET /api/v1/health/ready` - Readiness probe
- `GET /api/v1/health/live` - Liveness probe

### Projects (Placeholders)
- `GET /api/v1/projects` - List projects
- `GET /api/v1/projects/:slug` - Get project
- `POST /api/v1/projects` - Create project (admin)
- `PUT /api/v1/projects/:id` - Update project (admin)
- `DELETE /api/v1/projects/:id` - Delete project (admin)

### Analytics
- `GET /api/v1/analytics/realtime` - Real-time visitor count
- `POST /api/v1/analytics/track` - Track event

## 🔍 Database Management

```bash
# Open Prisma Studio
npm run db:studio

# Create migration
npm run db:migrate

# Reset database (CAUTION: Deletes all data)
npm run db:reset
```

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database connection failed
```bash
# Ensure Docker containers are running
docker ps

# Restart containers
docker compose -f docker-compose.dev.yml restart
```

### Module not found errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📖 Next Steps

1. Explore API docs at http://localhost:3000/api-docs
2. Test authentication flow
3. Check Prisma Studio: `npm run db:studio`
4. Review logs in terminal
5. Read [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for details

## 🆘 Support

- Check logs: Server logs appear in terminal
- Database GUI: `npm run db:studio`
- API docs: http://localhost:3000/api-docs
- Health check: http://localhost:3000/api/v1/health/detailed

---

**Status**: ✅ Ready for Development

**Version**: 1.0.0

**Author**: Portfolio Backend API
