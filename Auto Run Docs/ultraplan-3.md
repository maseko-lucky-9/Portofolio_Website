# Ultraplan Phase 3: CI/CD — Vercel Deploy Pipeline & Migrations Fix

> **Goal:** Add a Vercel deploy GitHub Action for the frontend and fix the missing `prisma migrate deploy` step in the backend CD.  
> **Working directory:** `/Users/ltmas/Repo/apps/portfolio-website`

---

## Context

- Current `frontend-cd.yml` builds a Docker image and does `kubectl rollout` on homelab — no Vercel deploy step exists.
- `backend-cd.yml` runs a `migration-plan` job that does a dry-run only. `prisma migrate deploy` is never called before the new pod starts — live data migrations are skipped.
- Vercel CLI deployment requires: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` as GitHub secrets.

---

## Tasks

- [ ] Create `.github/workflows/vercel-deploy.yml` — Vercel frontend deployment workflow:
  ```yaml
  name: Deploy Frontend to Vercel

  on:
    push:
      branches: [main]
      paths:
        - 'portfolio-ui/**'
        - 'shared/**'
    workflow_dispatch:

  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

  jobs:
    deploy:
      name: Deploy to Vercel
      runs-on: ubuntu-latest
      environment: production

      steps:
        - uses: actions/checkout@v4

        - name: Setup Node.js
          uses: actions/setup-node@v4
          with:
            node-version: '20.x'
            cache: 'npm'
            cache-dependency-path: 'portfolio-ui/package-lock.json'

        - name: Install Vercel CLI
          run: npm install -g vercel@latest

        - name: Install dependencies
          working-directory: portfolio-ui
          run: npm ci

        - name: Pull Vercel environment
          run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
          working-directory: portfolio-ui

        - name: Build project
          run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
          working-directory: portfolio-ui
          env:
            VITE_API_URL: ${{ secrets.VITE_API_URL }}
            VITE_WS_URL: ${{ secrets.VITE_WS_URL }}
            VITE_USE_API: 'true'
            VITE_DEBUG: 'false'

        - name: Deploy to Vercel
          run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
          working-directory: portfolio-ui
  ```

- [ ] Fix `backend-cd.yml` — add `prisma migrate deploy` before the K8s rollout:
  - Find the deploy job in `backend-cd.yml`
  - Add a migration step after Tailscale connect but before `kubectl rollout`:
    ```yaml
    - name: Run database migrations
      run: |
        ssh -o StrictHostKeyChecking=no ${{ env.HOMELAB_USER }}@${{ env.HOMELAB_HOST }} \
          "kubectl exec -n portfolio deploy/portfolio-api -- \
           npx prisma migrate deploy"
    ```
  - This ensures migrations are applied to the live DB before new pod traffic starts.

- [ ] Update the GitHub repository secrets documentation (add to `docs/deployment/CI_CD_PIPELINE.md`):
  Required secrets for Vercel deployment:
  - `VERCEL_TOKEN` — Vercel personal access token (from vercel.com/account/tokens)
  - `VERCEL_ORG_ID` — from `.vercel/project.json` after `vercel link`
  - `VERCEL_PROJECT_ID` — from `.vercel/project.json` after `vercel link`
  - `VITE_API_URL` — public backend URL (e.g. `https://api.yourdomain.com`)
  - `VITE_WS_URL` — public WebSocket URL (e.g. `wss://api.yourdomain.com`)

- [ ] Link the Vercel project locally to generate `.vercel/project.json`:
  ```bash
  cd /Users/ltmas/Repo/apps/portfolio-website/portfolio-ui
  vercel link
  # Follow prompts: select team/org, name the project "portfolio-ui"
  cat .vercel/project.json
  # Copy projectId and orgId to GitHub secrets
  ```

- [ ] Add `.vercel/` to `portfolio-ui/.gitignore` if not already present (contains local tokens).

---

## Acceptance Criteria

- `.github/workflows/vercel-deploy.yml` exists and triggers on `main` pushes to `portfolio-ui/**`
- `backend-cd.yml` runs `prisma migrate deploy` before `kubectl rollout`
- `docs/deployment/CI_CD_PIPELINE.md` documents all 5 required Vercel secrets
- `.vercel/` is in `.gitignore`
- A manual `workflow_dispatch` run of `vercel-deploy.yml` succeeds and produces a live Vercel URL
