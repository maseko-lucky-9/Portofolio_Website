# 007 — Node 24 CI floor, and exact-pinning as the lockfile substitute

## Status

Accepted (2026-08-25)

## Context

Every CI lane went red with no commit to `main`. Dependency install died inside npm's dependency
resolver:

```
npm error Cannot read properties of null (reading 'edgesOut')
  at #loadPeerSet (@npmcli/arborist/lib/arborist/build-ideal-tree.js:1289:38)
```

Bisected on npm 10.9.8 — the npm bundled with Node 22, which every workflow pinned. A manifest
containing nothing but `{"vitest":"4.1.10"}` reproduces the crash; `4.1.11` resolves cleanly.
`portfolio-api` was the only place pinning `4.1.10`.

Two structural facts turned one upstream patch release into a full outage:

1. **No lockfile is committed.** `.gitignore` calls this a HARD RULE, and every CI job, Docker
   build and Cloudflare deploy runs `npm install`, never `npm ci`. Each run therefore re-resolves
   the entire graph from the registry, so today's green is not reproducible tomorrow. This was
   already written down at `portfolio-api/package.json`'s `//devDependencies` note before the
   incident.
2. **Root `package.json` declares workspaces.** npm walks *up* from a workspace subdirectory to
   the root and resolves the whole tree, so `working-directory: ./portfolio-ui` is not a
   standalone install — it is a root install. One bad pin in `portfolio-api` therefore broke jobs
   that never reference the API at all, including `Security Scan`.

Node 22 compounds this: its bundled npm is stuck on the broken 10.9.x line for the remainder of
its life. The `node:20-alpine` images are worse still, and no workflow `NODE_VERSION` edit can
reach a container base image.

## Decision

**Move the CI floor to Node 24.19.0 (LTS "Krypton", npm 11.17.0)**, pinned exactly rather than as
a floating `24.x`. The incident was caused by an unpinned input re-resolving at run time; a
floating major keeps that axis open, since `setup-node` resolves it on the runner.

Container images move to `node:24-alpine` in the same change, for engines compliance and because
the homelab actually runs them.

**Extend the exact-pinning convention** already documented for `portfolio-api` to `portfolio-ui`:
`vitest`, `tailwindcss`, `tw-animate-css`, and the `size-limit` / `@size-limit/preset-app` pair.
Absent a lockfile, exact pins are the only mechanism that makes a resolution reproducible.

**Group peer-coupled packages in Dependabot.** Ungrouped, Dependabot opens one PR per package,
which splits a peer-pinned pair across two branches — each red alone, neither mergeable. That is
exactly how the superseded `@vitest/coverage-v8` PR arrived. Groups are mirrored with
`applies-to: security-updates`, which otherwise defaults to version updates only.

A `github-actions` ecosystem is added: Node 20 is being removed from GitHub-hosted runners, and
workflow logs already warn that `checkout@v4` and `setup-node@v4` are "being forced to run on
Node.js 24".

## Consequences

- `engines.node` moves to `>=22.0.0` at the root and in `portfolio-api`. This is required, not
  cosmetic: `size-limit@13` declares `^22.18.0 || ^24.0.0 || >=26.0.0` (note it excludes Node 25)
  and `@testing-library/jest-dom@7` needs `>=22`.
- `engines` remains **documentation, not a guard**. `engine-strict` is `false` and no `.npmrc`
  exists, so a violation only ever emits `npm WARN EBADENGINE`. Making it enforcing is a separate,
  deliberate decision.
- `packageManager: "npm@10.9.0"` must not be left naming the broken npm while `engines` demands
  newer. It is inert today (Corepack is not enabled anywhere in this repo) but re-creates this
  exact bug the moment anyone runs `corepack enable`.
- Cloudflare **Workers Builds** keeps `NODE_VERSION` in the dashboard, outside this repo. Unless it
  is raised there too, the toolchain splits four ways: CI 24 / CD 24 / Workers Builds 20 /
  containers 20. Note `22` would not fix it — it still ships npm 10.9.x.

## Alternatives considered

**Pin npm instead of Node** (`npm i -g npm@11` in each workflow). Rejected: it adds a step to
every job, leaves the container images and the Cloudflare build untouched, and pins a second
independent version axis. Bumping Node moves the bundled npm as a unit.

**Commit a lockfile and move to `npm ci`.** This is the strictly stronger fix and would have
prevented the incident outright. Not taken here because `.gitignore` calls the no-lockfile policy
a HARD RULE and `portfolio-api`'s note builds a whole strategy around its absence — reversing that
deserves its own ADR rather than being slipped into an incident response. **This remains the open
question**; exact-pinning is a mitigation, not a substitute.
