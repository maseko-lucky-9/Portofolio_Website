# Independent Deployment Guide

This guide explains how to deploy the portfolio-api and portfolio-ui projects independently.

## Project Structure

The repository is organized as a monorepo for **development convenience only**. Each project can be deployed completely independently:

```
portofolio-website/
├── portfolio-api/      # Backend (Node.js + Fastify)
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
├── portfolio-ui/       # Frontend (React + Vite)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
└── shared/            # Shared TypeScript types (optional)
```

---

## Backend Deployment (portfolio-api)

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Redis instance

### Deployment Options

#### Option 1: Railway

**Advantages**: Zero-config PostgreSQL and Redis

1. **Install Railway CLI**

```bash
npm install -g @railway/cli
```

2. **Login and init**

```bash
railway login
cd portfolio-api
railway init
```

3. **Add Services**

```bash
railway add postgresql
railway add redis
```

4. **Set Environment Variables**

```bash
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set OAUTH_STATE_SECRET=$(openssl rand -hex 32)
railway variables set ADMIN_EMAIL=your@email.com
railway variables set ADMIN_PASSWORD=your-secure-password
railway variables set CORS_ORIGIN=https://your-frontend-domain.com
railway variables set GITHUB_CLIENT_ID=your_github_client_id
railway variables set GITHUB_CLIENT_SECRET=your_github_client_secret
railway variables set GOOGLE_CLIENT_ID=your_google_client_id
railway variables set GOOGLE_CLIENT_SECRET=your_google_client_secret
```

5. **Deploy**

```bash
railway up
```

6. **Run Migrations**

```bash
railway run npm run db:migrate:prod
railway run npm run db:seed
```

Railway will automatically set `DATABASE_URL` and `REDIS_URL`.

---

#### Option 2: Vercel

**Advantages**: Simple deployment, auto-scaling

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Configure for API**

Create `vercel.json` in `portfolio-api/`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ]
}
```

3. **Set Environment Variables**

```bash
cd portfolio-api
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
vercel env add JWT_SECRET production
# ... add all other environment variables
```

4. **Deploy**

```bash
vercel --prod
```

**Note**: You'll need external PostgreSQL (e.g., Neon, Supabase) and Redis (e.g., Upstash).

---

#### Option 3: Fly.io

**Advantages**: Full control, persistent storage, global deployment

1. **Install Fly CLI**

```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login and Launch**

```bash
cd portfolio-api
fly launch
```

3. **Add PostgreSQL**

```bash
fly postgres create
fly postgres attach <postgres-app-name>
```

4. **Add Redis**

```bash
fly redis create
```

5. **Set Secrets**

```bash
fly secrets set JWT_SECRET=$(openssl rand -hex 32)
fly secrets set OAUTH_STATE_SECRET=$(openssl rand -hex 32)
fly secrets set GITHUB_CLIENT_ID=your_id
fly secrets set GITHUB_CLIENT_SECRET=your_secret
fly secrets set GOOGLE_CLIENT_ID=your_id
fly secrets set GOOGLE_CLIENT_SECRET=your_secret
fly secrets set CORS_ORIGIN=https://your-frontend.com
```

6. **Deploy**

```bash
fly deploy
```

7. **Run Migrations**

```bash
fly ssh console
npm run db:migrate:prod
npm run db:seed
```

---

#### Option 4: Docker + Any Host

**Advantages**: Works anywhere, consistent environment

1. **Build Docker Image**

```bash
cd portfolio-api
docker build -t portfolio-api .
```

2. **Push to Registry**

```bash
docker tag portfolio-api your-registry/portfolio-api:latest
docker push your-registry/portfolio-api:latest
```

3. **Deploy on Host**

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e JWT_SECRET=... \
  -e CORS_ORIGIN=https://your-frontend.com \
  --name portfolio-api \
  your-registry/portfolio-api:latest
```

---

## Frontend Deployment (portfolio-ui)

### Prerequisites

- Node.js 20+

### Deployment Options

#### Option 1: Vercel (Recommended)

**Advantages**: Zero-config, auto HTTPS, edge network

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Deploy**

```bash
cd portfolio-ui
vercel --prod
```

3. **Set Environment Variables**

```bash
vercel env add VITE_API_URL production
```

Set `VITE_API_URL` to your backend URL (e.g., `https://api.yourportfolio.com`).

4. **Redeploy** if variables were added:

```bash
vercel --prod
```

---

#### Option 2: Netlify

**Advantages**: Great DX, form handling, serverless functions

1. **Install Netlify CLI**

```bash
npm install -g netlify-cli
```

2. **Build**

```bash
cd portfolio-ui
npm run build
```

3. **Deploy**

```bash
netlify deploy --prod --dir=dist
```

4. **Set Environment Variables** in Netlify dashboard:
   - `VITE_API_URL`

---

#### Option 3: Cloudflare Pages

**Advantages**: Free, fast CDN, great performance

1. **Push to GitHub**
2. **Connect to Cloudflare Pages**:

   - Go to Cloudflare Dashboard → Pages
   - Connect GitHub repository
   - Set build command: `npm run build --workspace=portfolio-ui`
   - Set build output: `portfolio-ui/dist`
   - Add environment variable: `VITE_API_URL`

3. **Deploy** - automatic on push

---

#### Option 4: Static Hosting (S3, Azure Storage, etc.)

1. **Build**

```bash
cd portfolio-ui
npm run build
```

2. **Upload** `dist/` folder to:

   - AWS S3 + CloudFront
   - Azure Blob Storage + CDN
   - Google Cloud Storage
   - DigitalOcean Spaces

3. **Configure**:
   - Enable static website hosting
   - Set index document: `index.html`
   - Set error document: `index.html` (for client-side routing)

---

## Environment Variables

### Backend (.env)

Required:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<random-32-chars>
OAUTH_STATE_SECRET=<random-32-chars>
CORS_ORIGIN=https://your-frontend.com
```

Optional:

```bash
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
```

### Frontend (.env)

Required:

```bash
VITE_API_URL=https://api.yourportfolio.com
```

Optional:

```bash
VITE_OAUTH_ENABLED=true
```

---

## Post-Deployment Checklist

### Backend

- [ ] Run database migrations: `npm run db:migrate:prod`
- [ ] Seed initial data: `npm run db:seed`
- [ ] Test health endpoint: `curl https://api.yourportfolio.com/api/v1/health`
- [ ] Test auth endpoints
- [ ] Configure OAuth redirect URIs in GitHub/Google
- [ ] Set up monitoring (Sentry, Datadog, etc.)
- [ ] Configure backups for PostgreSQL

### Frontend

- [ ] Test production build locally: `npm run preview`
- [ ] Verify API connection
- [ ] Test OAuth flows
- [ ] Check responsive design
- [ ] Test in multiple browsers
- [ ] Configure custom domain
- [ ] Set up analytics (Google Analytics, Plausible, etc.)
- [ ] Test PWA features if applicable

---

## OAuth Configuration for Production

### GitHub OAuth

1. Go to GitHub Settings → Developer Settings → OAuth Apps
2. Update authorized callback URL:
   ```
   https://api.yourportfolio.com/api/v1/auth/oauth/github/callback
   ```

### Google OAuth

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Update authorized redirect URIs:
   ```
   https://api.yourportfolio.com/api/v1/auth/oauth/google/callback
   ```

---

## Monitoring and Maintenance

### Backend

- **Logs**: Check Railway/Vercel/Fly.io logs
- **Errors**: Use Sentry for error tracking
- **Performance**: Monitor API response times
- **Database**: Regular backups and performance tuning

### Frontend

- **Analytics**: Google Analytics, Plausible
- **Errors**: Sentry, Bugsnag
- **Performance**: Core Web Vitals, Lighthouse
- **Uptime**: UptimeRobot, Pingdom

---

## Scaling Considerations

### Backend

- Horizontal scaling (multiple instances)
- Database read replicas
- Redis clustering
- CDN for static assets
- Rate limiting per user/IP

### Frontend

- Already auto-scales on Vercel/Netlify/Cloudflare
- Use CDN edge locations
- Optimize bundle size
- Lazy load routes and components
- Image optimization

---

## CI/CD Pipeline Example

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - name: Deploy API
        run: |
          cd portfolio-api
          npm ci
          # Deploy using your chosen platform
          # railway deploy, vercel --prod, etc.

  deploy-ui:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - name: Deploy Frontend
        run: |
          cd portfolio-ui
          npm ci
          npm run build
          # Deploy using your chosen platform
```

---

## Cost Estimates

### Free Tier Options

- **Railway**: $5/month free credits
- **Vercel**: Generous free tier for frontend
- **Netlify**: 100GB bandwidth free
- **Cloudflare Pages**: Unlimited (free)
- **Neon PostgreSQL**: 0.5GB free
- **Upstash Redis**: 10,000 commands/day free

### Expected Costs (Low Traffic)

- Backend: $5-15/month
- Frontend: $0-5/month
- Database: $0-10/month
- Redis: $0-5/month

**Total**: ~$10-35/month for complete stack

---

## Support

For deployment issues:

1. Check platform-specific documentation
2. Review environment variables
3. Check build logs
4. Test locally first
5. Verify OAuth callback URLs match deployment URLs

## Quick Start Commands

```bash
# Build both projects locally
npm run build

# Test production builds
npm run preview --workspace=portfolio-ui
npm start --workspace=portfolio-api

# Deploy (after choosing platforms)
cd portfolio-api && vercel --prod
cd portfolio-ui && vercel --prod
```
