# Phase 1.5 — Router probe

Date: 2026-05-19
Probe ref: `~/.claude/plans/atomic-toasting-locket.md` Phase 1.5

## Finding

- **Router**: `react-router-dom@^6.30.1` (package.json)
- **Mode**: `BrowserRouter` (history API, not hash) — see `src/App.tsx:5,13`
- **Route config**: JSX `<Routes>`/`<Route>` declared in `src/App.tsx:14-18`,
  not the data-router (`createBrowserRouter`) API.
- **Current routes**: `/` (`<Index />`) + `*` (`<NotFound />`). No nested routes.
- **Other consumers of `react-router-dom`**:
  `src/components/NavLink.tsx`,
  `src/components/auth/{OAuthCallback,ProtectedRoute,LoginForm}.tsx`,
  `src/hooks/use-auth.ts`,
  `src/pages/NotFound.tsx`.

## Decision for Phase 2

- **Plugin**: `vite-react-ssg`. Reasons:
  1. Supports React Router v6 (both JSX and data-router styles).
  2. Drop-in for an existing `BrowserRouter` SPA — minimal migration.
  3. Generates static `.html` per route into `dist/`, which Cloudflare Workers
     Static Assets serves unchanged (no Worker code changes).

- **Migration cost**:
  - Replace `BrowserRouter` with `vite-react-ssg`'s route export pattern (a
    `routes` array exported from the entry, consumed at build by SSG and at
    runtime by `RouterProvider`).
  - Add a `ssg` block to `vite.config.ts` listing pre-render routes.
  - All existing consumers of `react-router-dom` hooks (`useNavigate`,
    `useLocation`, `Link`, `NavLink`) keep working unchanged.

- **Routes to pre-render** (per plan Phase 2b):
  `/`, `/about`, `/experience`, `/projects`, `/projects/<slug>` (one per
  `src/content/projects/*.md`), `/cv`, `/contact`, `/uses`, `/now`.

## Hydration risk surface

Components that touch `window`, `localStorage`, or `matchMedia` at module
load will break SSG. Quick scan needed before Phase 2:

```sh
grep -rE "window\.|localStorage|matchMedia|document\." src --include="*.tsx" --include="*.ts" | grep -v "useEffect\|useLayoutEffect"
```

If any hits land outside effect hooks, wrap them in `typeof window !== "undefined"`
guards before introducing SSG. Auth components (`OAuthCallback`, `useAuth`) are
the most likely offenders.
