# Phase 03: Vercel Deploy GitHub Action + Project Linking

The current `frontend-cd.yml` builds a Docker image and deploys to homelab Kubernetes — there is no Vercel deploy step anywhere in CI. This phase adds a dedicated `vercel-deploy.yml` GitHub Actions workflow that uses the Vercel CLI to deploy the frontend to Vercel on every push to `main`. It also documents the one-time Vercel project linking steps that must be completed manually before the action can run.

## Tasks

- [ ] Create `.github/workflows/vercel-deploy.yml` using the Vercel CLI pattern (not the Vercel GitHub integration, which cannot pass VITE_ secrets at build time):
  - Trigger on `push` to `main`, paths: `portfolio-ui/**`, `shared/**`, `.github/workflows/vercel-deploy.yml`
  - Also trigger on `workflow_dispatch` for manual deploys
  - Single job `deploy-vercel` running on `ubuntu-latest`
  - Steps:
    1. `actions/checkout@v4`
    2. `actions/setup-node@v4` with `node-version: '20.x'` and `cache: 'npm'`, `cache-dependency-path: 'portfolio-ui/package-lock.json'`
    3. Install Vercel CLI: `npm install -g vercel@latest`
    4. Pull Vercel environment and project info: `vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}`
    5. Build with Vercel CLI (injects env from Vercel dashboard): `vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}`
    6. Deploy pre-built output: `vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}`
  - `working-directory: ./portfolio-ui` on all Vercel CLI steps
  - Required secrets section comment at top: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
  - Environment variables for the job: `VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}` and `VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}`

- [ ] Create `docs/deployment/VERCEL_PROJECT_SETUP.md` documenting the one-time manual steps to link the Vercel project (this must be done before the workflow can run):
  - Use YAML front matter: `type: reference`, `title: Vercel Project Setup`, `tags: [deployment, vercel, ci-cd]`, `related: ['[[ENV_VARS_AUDIT]]', '[[CLOUDFLARE_TUNNEL_SETUP]]']`
  - Step 1: Install Vercel CLI locally — `npm i -g vercel`
  - Step 2: From `portfolio-ui/` run `vercel link` — choose existing project or create new, this writes `.vercel/project.json`
  - Step 3: Get IDs for GitHub secrets:
    - `VERCEL_TOKEN` — from Vercel dashboard → Account Settings → Tokens (create a new one scoped to the project)
    - `VERCEL_ORG_ID` — from `.vercel/project.json` `orgId` field
    - `VERCEL_PROJECT_ID` — from `.vercel/project.json` `projectId` field
  - Step 4: Add all three as GitHub repository secrets (Settings → Secrets → Actions)
  - Step 5: In Vercel dashboard → Project → Settings → Environment Variables, add all `VITE_*` vars from `portfolio-ui/.env.production.example`
  - Note: `.vercel/` directory is gitignored — the workflow uses the env var IDs, not the local file

- [ ] Verify `.gitignore` at the project root and in `portfolio-ui/` correctly excludes `.env` files and `.vercel/`:
  - Read `portfolio-ui/.gitignore` (or root `.gitignore`) and confirm `.env` (not `.env.example`) is excluded
  - Confirm `.vercel` is in the gitignore — add it if missing
  - Do NOT add `dist/` exclusion if it's already there; do NOT modify entries that are already correct
  - If `.gitignore` needs changes, make only the minimum necessary additions
