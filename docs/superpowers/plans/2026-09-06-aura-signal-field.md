# Aura "Signal Field" → portfolio-ui Implementation Plan (Docker trial, no PR)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the approved v4 "Signal Field" mockup into `portfolio-ui/` on a feature branch of this repo, build it as a Docker image, and run the full Playwright suite green against the running container — with no PR and no production deploy until the user's explicit go-ahead.

**Architecture:** CSS-first port — the mockup's hand-written CSS becomes `src/styles/aura.css` on top of a single dark `:root` token block (Aura tokens + shadcn-compat aliases), and each React section emits the mockup's markup/class names while keeping the repo's anime.js reveal helper, Lenis, TanStack fallback plumbing and the two frozen layouts (Skills, Experience). The WebGL field is a runtime-loaded `public/field/` asset pair (Unicorn Studio runtime + the user's _own_ exported scene JSON) behind a `FieldBackground` component with CSS-gradient fallback. Docker = the existing `Dockerfile` (node → nginx) with its CSP aligned to production; e2e = the existing `@playwright/test` suite pointed at the container via a loud opt-in.

**Tech Stack:** Vite 7 · React 19 · TypeScript · Tailwind 3.4 (utilities only) · anime.js v4 · Lenis · Vitest/jsdom · @playwright/test 1.59 · Docker 29 (node:24-alpine → nginx:1.27-alpine) · Unicorn Studio runtime (vendored UMD) · @fontsource (Spectral, Public Sans Variable, JetBrains Mono).

**Spec:** the generated mockup source `build.py` (variant 4) and its rendered output `v4-signal-field.html`, copied in T1 to `~/.claude/plans/aura-signal-field-src/` (the session scratchpad at `/private/tmp/claude-502/…/52291989-…/scratchpad/aura-mockups/` is ephemeral). Line references below are into `build.py`. Phase-1 mockup plan (done): the previous revision of this file.

## Global Constraints

- Branch `feat/aura-signal-field` from `main` **in this checkout**; `main` untouched; **no push, no PR, no deploy** until the user says so.
- Node ≥ 22 (`package.json` engines; CI pins 24.19.0); repo commits **no lockfile** — `npm install`, never `npm ci`.
- Budgets (`portfolio-ui/package.json` size-limit, gzip): `index-*.js` ≤ 90 KB · `index-*.css` ≤ 40 KB (today 36,404 B) · motion-vendor ≤ 30 KB. Lighthouse (`lighthouserc.json`): perf ≥ 0.90, LCP ≤ 2000 ms, CLS ≤ 0.05 — all `error`.
- Production CSP (`src/worker.ts:47-60`): `script-src 'self' 'unsafe-inline' https://t.thulanimaseko.co.za`, `font-src 'self' data:`, `connect-src 'self' https://t.thulanimaseko.co.za`, no `'unsafe-eval'` → **no Google Fonts, no CDN scripts**; everything self-hosted.
- Dark only. Every neutral chroma ≤ 0.012 (Aura ladder); the single high-chroma token is the cyan accent (renamed `--signal`).
- Copy is sourced, never invented: `personalData.availability` appears **verbatim** on the page (chatbot coupling, `src/chat.ts:84-98`); project impact lines unchanged; employer names as set type, never logos.
- Frozen layouts: `SkillsSection` (toggle → radar | bars, `data-active`), `ExperienceSection` (zigzag, hover gating, `0fr→1fr` fold). Restyle only.
- Locked this round: display face **Spectral** (400 italic display, 500 upright wordmark); skill categories **treatment A** (single accent); field scene = **user's own Unicorn Studio export** (no Aura scene shipped).
- Config-file edits (`nginx.conf`, `index.html`, `playwright.config.ts`, `vite.config.ts`, `package.json`) show a before/after diff at execution before applying.

---

## Context

Four mockup variants were built and iterated to approval in the scratchpad; the user selected v4 "Signal Field" (Aura's exact background field, marquee trust bar, capability cards, colour headshot). The repo still ships the indigo/emerald light-default system with `SectionBridge`, `CustomCursor`, a theme toggle, and `.impeccable.md` rules the code already drifted from. This phase turns the approved artifact into the real app and proves it end-to-end in a local container before anything touches production.

### Answers that shaped this plan (user, this session)

| Question      | Answer                            | Consequence                                                                                                                                                                                                            |
| ------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where         | Same repo, new branch from `main` | `git switch -c feat/aura-signal-field main`; no worktree                                                                                                                                                               |
| Field asset   | **Own Unicorn export first**      | Nothing from Aura's scene ships. `FieldBackground` renders the CSS fallback until `public/field/scene.json` exists; all other work proceeds; Docker trial runs twice (fallback now, exact field once the export lands) |
| Display font  | **Spectral** (3rd screenshot)     | `@fontsource/spectral` latin 400-italic + 500                                                                                                                                                                          |
| Skill colours | **A**                             | `--cat-*` all alias `--signal`                                                                                                                                                                                         |

### Assumptions you can veto at review (all follow the approved mockup literally)

1. **Mobile nav = brand + "Get in touch" only** (links hidden < 768 px, no drawer) — the drawer and its tests go.
2. **Contact = accent slab with three link cards; no form** (production has no backend; the slab's mailto card is what the form's mailto fallback did).
3. **Blog and Case-studies sections leave the home page** (not in the mockup). `/blog`, `/answers`, `/projects` static SEO pages are untouched and stay linked from the footer.
4. `ScrollProgress`, `SectionBridge`, `CustomCursor`, theme toggle: retired.
5. Section anchors renamed to the mockup's (`#about→#operator`, `#projects→#work`, `#casestudies/#blog` gone); `#hero` on the hero section; `<main id="main">` wraps all sections.
6. The Skills section opens on **DevOps** (mockup) instead of Frontend.

### Only you can supply — Unicorn Studio export (pre-flight, do in parallel with T1–T14)

1. Create/log in to a Unicorn Studio account (free tier exists; JSON-export tier and the free-plan "Made with Unicorn" badge are **[UNVERIFIED]** — check in the editor).
2. Build the scene. T2 hands you `field-recipe.md` — the 14 Aura layers (gradient · rectangle ×3 · diffuse · text "." · beam ×3 · replicate ×2 · blur · noise · glyphDither) with their parameter values — to rebuild in your account, or remix if Aura's scene is available as a community template.
3. From the editor's Export/Embed panel, note the runtime version in the snippet (`unicornstudio.js@vX.Y.Z`) and download the project JSON.
4. Hand over: `scene.json` + the version string. → T2b vendors that exact runtime version and drops the JSON in `public/field/`.
   **Path B** if JSON download is not available on your plan: give me the project ID instead; `FieldBackground` switches to `data-us-project="<id>"` (CDN-hosted scene) and both CSPs gain `connect-src https://assets.unicorn.studio` (domain to confirm from the vendored runtime — `grep -o 'https://[a-z.]*unicorn[a-z.]*' unicornStudio.umd.js`).

---

## File structure (what changes)

```
portfolio-ui/
  src/styles/aura.css                         CREATE  — mockup CSS (BASE+COMPONENTS+RESPONSIVE+V4, pruned, --accent→--signal)
  src/index.css                               MODIFY  — fonts, single :root (Aura + shadcn aliases), legacy classes removed
  src/main.tsx                                MODIFY  — import "./styles/aura.css" after "./index.css"
  tailwind.config.ts                          MODIFY  — fontFamily; dead keyframes removed
  index.html                                  MODIFY  — class="dark", color-scheme, one theme-color, preload removed, JSON-LD offer names
  public/site.webmanifest                     MODIFY  — dark colours
  public/field/README.md                      CREATE  — provenance + hand-off contract (runtime version, scene.json)
  public/field/unicornStudio.umd.js           CREATE (T2b, from user's version)
  public/field/scene.json                     CREATE (T2b, user's export)
  src/components/FieldBackground.tsx          CREATE
  src/components/TrustStrip.tsx               CREATE
  src/components/OperatorSection.tsx          CREATE
  src/components/FaqSection.tsx               CREATE
  src/lib/use-spotlight.ts                    CREATE
  src/lib/motion.ts                           MODIFY  — export hasLiteParam / hasNoMotionParam
  src/data/services.ts, src/data/faq.ts       CREATE
  src/components/{Navbar,HeroSection,ProjectsSection,ServicesSection,ContactSection,Footer}.tsx   REWRITE
  src/components/{SkillsSection,SkillsRadar,ExperienceSection}.tsx                                 RESTYLE
  src/components/ChatWidget.tsx               MODIFY  — glass-card → panel
  src/pages/Index.tsx, src/App.tsx            MODIFY
  src/components/{SectionBridge,CustomCursor,ScrollProgress,BlogSection,CaseStudiesSection}.tsx  DELETE
  src/contexts/ThemeContext.tsx, src/components/ui/Logo.tsx (if unreferenced), src/data/blog.ts   DELETE
  e2e/theme.spec.ts                           DELETE
  e2e/{hero,navigation,projects,contact,accessibility,a11y,mobile-layout,live-domain}.spec.ts     REWRITE/EDIT
  e2e/field.spec.ts, e2e/design.spec.ts       CREATE
  src/components/__tests__/*                  REWRITE/ADD (see T12)
  playwright.config.ts                        MODIFY  — E2E_FULL_SUITE opt-in; VITE_DISABLE_WEBGL retired
  nginx.conf                                  MODIFY  — CSP aligned to worker.ts
  vite.config.ts                              MODIFY  — dead three-vendor chunk removed
  package.json                                MODIFY  — fonts in; framer-motion/@gsap/react/inter out
docs/decisions/008-aura-signal-field-redesign.md   CREATE
docs/superpowers/plans/2026-09-06-aura-signal-field.md  CREATE (copy of this plan)
.impeccable.md                                MODIFY  — revision-6 amendments
tasks/todo.md                                 CREATE/UPDATE
```

---

### Task 1: Branch, stable spec copy, todo

**Files:** none in `src`. Create `docs/superpowers/plans/2026-09-06-aura-signal-field.md`, `tasks/todo.md`.

- [ ] **Step 1: Branch from main (repo must be clean at `001ebaf`)**

```bash
cd /Users/ltmas/Repo/career/portfolio-website && git status --short && git switch -c feat/aura-signal-field main
```

- [ ] **Step 2: Copy the spec out of the ephemeral scratchpad**

```bash
S=/private/tmp/claude-502/-Users-ltmas-Repo-career-portfolio-website/52291989-21c1-4486-9de6-f7295f9e65cf/scratchpad/aura-mockups
D=~/.claude/plans/aura-signal-field-src && mkdir -p "$D" && cp "$S"/build.py "$S"/v4-signal-field.html "$S"/preview/v4-signal-field.html "$S"/audit.js "$S"/focus.js "$S"/pxcontrast.py "$S"/unicorn.scene.json "$S"/serve_utf8.py "$S"/mkpreview.py "$D"/ && cp -r "$S"/shots5 "$D"/ && ls -la "$D"
```

(`unicorn.scene.json` is copied **only** to generate the recipe in T2 — it is never placed under `portfolio-ui/`.)

- [ ] **Step 3: Put the plan in-repo and open the todo ledger**
      `cp ~/.claude/plans/use-the-design-skill-flickering-kitten.md docs/superpowers/plans/2026-09-06-aura-signal-field.md`; write `tasks/todo.md` with one checkbox per task T1–T18.
- [ ] **Step 4: Commit** — `git add docs/superpowers tasks && git commit -m "docs(plan): aura signal-field implementation plan"`

### Task 2: Fonts in, field slot + hand-off recipe

**Files:** Modify `portfolio-ui/package.json`; Create `portfolio-ui/public/field/README.md`; produce `~/.claude/plans/aura-signal-field-src/field-recipe.md` (sent to the user).

**Interfaces produced:** font families `'Spectral'` (italic 400, upright 500), `'Public Sans Variable'` (wght 100–900), `'JetBrains Mono'` (400, 500) — all from `node_modules/@fontsource*` via `@import` in T3. Field contract: `/field/unicornStudio.umd.js` (UMD global `window.UnicornStudio = { init(): Promise<Scene[]>, destroy(), scenes }`) + `/field/scene.json`, referenced from `#us-host[data-us-project-src="/field/scene.json"]`.

- [ ] **Step 1: Swap font packages**

```bash
cd portfolio-ui && npm install @fontsource/spectral@5.3.0 @fontsource-variable/public-sans@5.3.0 && npm uninstall @fontsource-variable/inter @fontsource/inter && ls node_modules/@fontsource/spectral/latin-400-italic.css node_modules/@fontsource/spectral/latin-500.css node_modules/@fontsource-variable/public-sans/wght.css node_modules/@fontsource/jetbrains-mono/latin-400.css node_modules/@fontsource/jetbrains-mono/latin-500.css
```

Expected: all five files listed (verified on jsDelivr this session: `font-family:'Spectral'`, `'Public Sans Variable'`, `'JetBrains Mono'`, all `font-display:swap`).

- [ ] **Step 2: Generate the recipe for the user's Unicorn rebuild**

````bash
python3 - <<'EOF' > ~/.claude/plans/aura-signal-field-src/field-recipe.md
import json
s=json.load(open('/Users/ltmas/.claude/plans/aura-signal-field-src/unicorn.scene.json'))
print("# Field scene recipe (layer-by-layer)\n\nRebuild in your own Unicorn Studio project. Skip `fontCSS`/`glyph` data URIs.\n")
print("Options:", json.dumps(s.get('options'), indent=1), "\n")
for i,h in enumerate(s['history']):
    keep={k:v for k,v in h.items() if k not in('history','texture','fontCSS','glyph','image') and not (isinstance(v,str) and v.startswith('data:'))}
    print(f"## Layer {i}: {h.get('layerType')} / {h.get('layerName') or h.get('type') or ''}\n```json\n{json.dumps(keep, indent=1)}\n```\n")
EOF
wc -l ~/.claude/plans/aura-signal-field-src/field-recipe.md
````

Send `field-recipe.md` to the user (SendUserFile) with the pre-flight steps from the Context section.

- [ ] **Step 3: Write `public/field/README.md`** — states: nothing ships here until the user's export lands; expected files and the version rule (runtime version **must** equal the version in the export's embed snippet); Path B (project ID) note; that `FieldBackground` HEAD-probes `/field/scene.json` and falls back to CSS when absent.
- [ ] **Step 4: Commit** — `git commit -am "chore(fonts): spectral + public sans variable replace inter; field asset slot"`

**Task 2b (unblocked by the user's hand-off, any time before T15 phase 2):** `curl -fsSL "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v<VERSION>/dist/unicornStudio.umd.js" -o portfolio-ui/public/field/unicornStudio.umd.js` (state file, source, size before running — it is a download), copy the user's JSON to `portfolio-ui/public/field/scene.json`, then verify: `grep -cE '\beval\(|new Function\(' portfolio-ui/public/field/unicornStudio.umd.js` → `0` (else `'unsafe-eval'` is needed and the plan stops for a decision); `grep -c "paused" …umd.js` → > 0 (else T4's pause branch becomes `destroy()`+fallback under reduced motion); `node -e "const s=require('./portfolio-ui/public/field/scene.json');console.log(Array.isArray(s.history), JSON.stringify(s).match(/https?:\/\/[^\"]+/g))"` → no remote URLs (or add them to both CSPs). Commit `feat(field): vendor unicorn runtime v<VERSION> + own scene export`.

### Task 3: Tokens, alias table, `aura.css` _(opens the intentional red window: `e2e/theme.spec.ts`, light-theme axe test; closed in T13)_

**Files:** Create `src/styles/aura.css`; Modify `src/index.css`, `src/main.tsx`, `tailwind.config.ts`.

**Interfaces produced:** token names below; class contract `.wrap .display(.lit/.fade) .lede .body .small .mono(.tiny/.on) .eyebrow .eyebrow-pill .dot .nav .brand .mark .word .links .btn .btn-light .btn-ghost .shiny-cta(.sm) .panel .spot .chip .stat-pill .rule .portrait .scrim .hud .metrics .metric .cta-row .hero .hero-2col .instrument .beam-line .sonar .orbit-cw .orbit-ccw .pulse .pulse-fast .tl-* .sk-* .acc .plus .ans .slab .orb .ripple .slab-card .slab-grid .f-grid .f-chip .op-grid .asym .show-split .mq .mq-row .mq-track .mq-set .mq-item .mq-badge .tick .cap-grid .cap .cap-edge .cap-lift .cap-glow .cap-ring .s-blur-xl .s-80 .s-50 .s-solid .grid-bg #aura-bg #us-host #field-fallback .trust .sec-head`.

- [ ] **Step 1: Compose `aura.css` from build.py**
      Concatenate, in order: `@property --spin` (156) and the four `@property` rules (1434-1437) **first, top level**; CSS_BASE 218-289 **minus** 225-229 (preflight already has `img`, `a`, heading/list margins, `button`), minus `#field`/`#field-scrim` (235-237, 241-243), with `body{overflow-x:hidden}` (222) replaced by `html{overflow-x:clip}` and the body rule reduced to `color:var(--ink-90);font-family:var(--font-body);font-size:var(--t-base);line-height:1.5;-webkit-font-smoothing:antialiased;` (background comes from the alias `--background` via Tailwind base); `:focus-visible` (232) **dropped** (index.css keeps the single rule, see Step 2); CSS_COMPONENTS 293-524 minus `.btn-cta` (323-332, v1 only), `.instrument .portrait*` (367-368), `.fld*` (475-481), `#scaffold*` (492-510); CSS_RESPONSIVE 1211-1251 minus `.mast-*` (1225-1227, 1242-1245); CSS_V4 1343-1512 minus the `.js-rv .rv` rules (1420-1426, reveals are anime.js) and its reduced-motion block (1514-1518, merged into index.css). Then append:

```css
.hero {
  border-top: 0;
} /* it is a <section> now; the section rule adds a hairline */
#field-fallback {
  opacity: 1;
} /* visible until a scene actually comes up (React sets 0) */
.trust {
  position: relative;
  z-index: 10;
  padding-block: 32px 0;
}
.sec-head {
  display: grid;
  gap: 32px;
  margin-bottom: 96px;
}
.sec-head .right {
  text-align: right;
}
.f-grid > :nth-child(4) {
  grid-column: 1/-1 !important;
}
@media (min-width: 1024px) {
  .f-grid > :nth-child(1) {
    grid-column: span 4 !important;
  }
  .f-grid > :nth-child(2) {
    grid-column: 6/8 !important;
  }
  .f-grid > :nth-child(3) {
    grid-column: 8/10 !important;
  }
  .f-grid > :nth-child(4) {
    grid-column: 11/13 !important;
  }
}
```

Then `sed -i '' -e 's/--accent-deep/--signal-deep/g' -e 's/--accent/--signal/g' src/styles/aura.css` and `grep -c -- '--accent' src/styles/aura.css` → `0`.

- [ ] **Step 2: Rewrite the top of `index.css`** — replace lines 1-14 font imports with

```css
@import "@fontsource-variable/public-sans/wght.css";
@import "@fontsource/spectral/latin-400-italic.css";
@import "@fontsource/spectral/latin-500.css";
@import "@fontsource/jetbrains-mono/latin-400.css";
@import "@fontsource/jetbrains-mono/latin-500.css";
```

Replace `:root` (35-148) **and** `.dark` (150-240) with one block (bare OKLCH triples — the repo's contract, wrapped by `tailwind.config.ts:39-81`):

```css
:root {
  /* Aura — from build.py:158-213; accent renamed so shadcn's --accent stays a hover surface */
  --signal: 0.754 0.139 232.7;
  --signal-deep: 0.685 0.148 237.3;
  --field-teal: 0.672 0.117 212.5;
  --surface-page: 0.097 0.008 236.9;
  --surface-raised: 0.115 0.009 236.9;
  --surface-panel: 0.134 0.01 236.9;
  --surface-inset: 0.145 0.01 236.9;
  --surface-elevated: 0.196 0.012 236.9;
  --surface-input: 0.174 0.011 236.9;
  --ink-100: #fff;
  --ink-90: rgba(255, 255, 255, 0.9);
  --ink-80: rgba(255, 255, 255, 0.8);
  --ink-70: rgba(255, 255, 255, 0.7);
  --ink-60: rgba(255, 255, 255, 0.6);
  --ink-50: rgba(255, 255, 255, 0.5);
  --ink-40: rgba(255, 255, 255, 0.4);
  --ink-30: rgba(255, 255, 255, 0.3);
  --ink-20: rgba(255, 255, 255, 0.2);
  --veil-02: rgba(255, 255, 255, 0.02);
  --veil-03: rgba(255, 255, 255, 0.03);
  --veil-04: rgba(255, 255, 255, 0.04);
  --veil-05: rgba(255, 255, 255, 0.05);
  --veil-06: rgba(255, 255, 255, 0.06);
  --veil-10: rgba(255, 255, 255, 0.1);
  --border-section: rgba(255, 255, 255, 0.05);
  --border-component: rgba(255, 255, 255, 0.1);
  --border-hover: rgba(255, 255, 255, 0.2);
  --t-2xs: 10px;
  --t-xs: 12px;
  --t-sm: 14px;
  --t-base: 16px;
  --t-lg: 18px;
  --t-xl: 20px;
  --t-2xl: 24px;
  --t-3xl: 30px;
  --t-4xl: 36px;
  --t-5xl: 48px;
  --t-6xl: 60px;
  --t-7xl: 72px;
  --font-display: "Spectral", Georgia, "Times New Roman", serif;
  --font-body:
    "Public Sans Variable", "Public Sans", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --track-tight: -0.025em;
  --track-wide: 0.05em;
  --track-label: 0.2em;
  --r-xs: 4px;
  --r-sm: 8px;
  --r-md: 12px;
  --r-lg: 16px;
  --r-xl: 24px;
  --r-2xl: 32px;
  --r-full: 9999px;
  --container: 1280px;
  --gutter: 24px;
  --section-y: 128px;
  --d-micro: 150ms;
  --d-comp: 300ms;
  --d-card: 500ms;
  --d-slow: 700ms;
  --d-image: 1000ms;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --shadow-nav:
    0 2.8px 2.2px rgba(0, 0, 0, 0.034), 0 6.7px 5.3px rgba(0, 0, 0, 0.048),
    0 12.5px 10px rgba(0, 0, 0, 0.06), 0 22.3px 17.9px rgba(0, 0, 0, 0.072),
    0 41.8px 33.4px rgba(0, 0, 0, 0.086), 0 100px 80px rgba(0, 0, 0, 0.12);
  --glow-text: 0 0 25px oklch(var(--signal) / 0.4);
  --cat-frontend: var(--signal);
  --cat-backend: var(--signal);
  --cat-devops: var(--signal); /* treatment A */

  /* shadcn compat — src/components/ui/* keep working unchanged */
  --background: var(--surface-page);
  --foreground: 1 0 0;
  --card: var(--surface-panel);
  --card-foreground: 1 0 0;
  --popover: var(--surface-raised);
  --popover-foreground: 1 0 0;
  --primary: var(--signal);
  --primary-foreground: var(--surface-page);
  --secondary: var(--surface-elevated);
  --secondary-foreground: 1 0 0;
  --muted: var(--surface-inset);
  --muted-foreground: 0.786 0.006 236.9;
  --accent: var(--surface-elevated);
  --accent-foreground: 1 0 0; /* hover surface, NOT the signal */
  --destructive: 0.523 0.185 26.5;
  --destructive-foreground: 0.96 0.007 247.9;
  --border: 0.24 0.01 236.9;
  --input: var(--surface-input);
  --ring: var(--signal);
  --radius: 16px;
}
@media (min-width: 1024px) {
  :root {
    --gutter: 48px;
  }
}
```

Delete `--sidebar-*` (unrendered), `--gradient-*`, `--shadow-glow*`, `--primary-glow`. In `@layer base`: `body` font → `var(--font-body)`; `h1,h2,h3,.font-display` → `var(--font-display)`; keep the one `*:focus-visible` (259-264) retuned to `outline:2px solid oklch(var(--signal));outline-offset:3px;` (no `border-radius:inherit`). Delete now (nothing else references them): `.btn-hero-*` (305-375), `.card-project` (378-391), `.section-mesh` (556-568), `.text-gradient-*` (570-579, after T5/T8 remove `Logo`), `.animate-blob*` + `blobDrift` (613-627, 680-691). **Keep until T10:** `.glass-card` (ChatWidget), `.tech-badge`, `.section-container`, `.section-title`, `.social-link`, `.nav-link`, `.timeline-*`, `.skill-radar-container`. Reduced-motion block (752-760) stays and gains the mockup's `.mq-track,.shiny-cta,.shiny-cta::before,.shiny-cta::after,.shiny-cta span::before{animation:none!important;}`.

- [ ] **Step 3: Import order and Tailwind fonts**
      `src/main.tsx` line after `import "./index.css";` → `import "./styles/aura.css";` (never `@import` it from index.css — no `postcss-import`; Vite keeps entry order so it lands after `.sr-only`). `tailwind.config.ts`: `sans: ["Public Sans Variable","Public Sans","system-ui","sans-serif"]`, `display: ["Spectral","Georgia","serif"]`, `mono` unchanged; delete `float`/`pulse-glow`/`blob-drift` keyframes+animations.
- [ ] **Step 4: Verify cascade + budget**

```bash
cd portfolio-ui && npm run build:app && npx size-limit && node -e "const fs=require('fs');const f=fs.readdirSync('dist/assets').find(n=>/^index-.*\.css$/.test(n));const c=fs.readFileSync('dist/assets/'+f,'utf8');console.log({srOnlyBeforeAura:c.indexOf('.sr-only')<c.indexOf('.shiny-cta'), gz:require('zlib').gzipSync(c).length})"
```

Expected: `srOnlyBeforeAura:true`; CSS gz ≈ 30 KB (< 40,960). The page will look broken until T5–T9 — expected.

- [ ] **Step 5: Commit** — `git commit -am "feat(tokens): aura dark token set, spectral/public-sans, aura.css port"`

### Task 4: `FieldBackground`

**Files:** Create `src/components/FieldBackground.tsx`, `src/components/__tests__/FieldBackground.test.tsx`; Modify `src/lib/motion.ts` (export `hasLiteParam` 160-163 and `hasNoMotionParam` 194-198).

**Interfaces:** `export function FieldBackground(): JSX.Element` (no props). Consumes `/field/*` per T2. Global: `window.UnicornStudio`.

- [ ] **Step 1: Failing tests**

```tsx
// src/components/__tests__/FieldBackground.test.tsx
import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FieldBackground } from "@/components/FieldBackground";

describe("FieldBackground", () => {
  it("renders host, fallback and grid synchronously, fallback visible", () => {
    const { container } = render(<FieldBackground />);
    expect(container.querySelector("#aura-bg #us-host")).toHaveAttribute(
      "data-us-project-src",
      "/field/scene.json",
    );
    expect(container.querySelector("#field-fallback")).toBeInTheDocument();
    expect(container.querySelector(".grid-bg")).toBeInTheDocument();
  });
  it("never injects the runtime without WebGL2 (jsdom has none)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<FieldBackground />);
    window.dispatchEvent(new Event("load"));
    await new Promise((r) => setTimeout(r, 300));
    expect(
      document.querySelector('script[src="/field/unicornStudio.umd.js"]'),
    ).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run → FAIL** (`Cannot find module "@/components/FieldBackground"`): `cd portfolio-ui && npx vitest run src/components/__tests__/FieldBackground.test.tsx`
- [ ] **Step 3: Implement**

```tsx
// src/components/FieldBackground.tsx
import { useEffect } from "react";
import { hasLiteParam, hasNoMotionParam } from "@/lib/motion";

const SCENE_URL = "/field/scene.json";
const RUNTIME_URL = "/field/unicornStudio.umd.js";
type Scene = { paused?: boolean; destroy?: () => void };
declare global {
  interface Window {
    UnicornStudio?: {
      init: () => Promise<Scene[]>;
      destroy: () => void;
      scenes?: Scene[];
    };
  }
}
const webgl2 = () => {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
};

/** Aura's field: fixed, behind everything, loaded off the LCP/TBT path. CSS gradient
 *  fallback stays visible until a scene actually renders (thumbnails, jsdom, no export yet). */
export function FieldBackground() {
  useEffect(() => {
    if (import.meta.env.VITE_DISABLE_FIELD === "true") return;
    if (hasLiteParam() || hasNoMotionParam() || !webgl2()) return;
    const host = document.getElementById("us-host");
    const fallback = document.getElementById("field-fallback");
    if (!host || !fallback) return;
    let cancelled = false;
    let script: HTMLScriptElement | null = null;
    const showFallback = (on: boolean) => {
      fallback.style.opacity = on ? "1" : "0";
    };

    const start = async () => {
      // ponytail: HEAD probe = "scene not provided yet" guard; the runtime's own fetch failure is a console.error inside minified code
      const head = await fetch(SCENE_URL, { method: "HEAD" }).catch(() => null);
      if (cancelled || !head?.ok) return;
      script = document.createElement("script");
      script.src = RUNTIME_URL;
      script.async = true;
      script.onerror = () => showFallback(true);
      script.onload = () => {
        window.UnicornStudio?.init()
          .then((scenes) => {
            if (cancelled || !scenes.length) return;
            showFallback(false);
            const still =
              matchMedia("(prefers-reduced-motion: reduce)").matches ||
              matchMedia("(pointer: coarse)").matches ||
              ((navigator as Navigator & { deviceMemory?: number })
                .deviceMemory ?? 8) <= 4;
            if (still)
              requestAnimationFrame(() =>
                requestAnimationFrame(() =>
                  scenes.forEach((s) => {
                    s.paused = true;
                  }),
                ),
              );
            host
              .querySelector("canvas")
              ?.addEventListener("webglcontextlost", (e) => {
                e.preventDefault();
                host.style.display = "none";
                showFallback(true);
              });
          })
          .catch(() => showFallback(true));
      };
      document.head.appendChild(script);
    };
    const schedule = () => {
      if ("requestIdleCallback" in window)
        window.requestIdleCallback(() => void start(), { timeout: 2000 });
      else setTimeout(() => void start(), 200);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      try {
        window.UnicornStudio?.destroy();
      } catch {
        /* runtime never loaded */
      }
      script?.remove();
    };
  }, []);

  return (
    <>
      <div id="field-fallback" aria-hidden="true" />
      <div id="aura-bg" aria-hidden="true">
        <div id="us-host" data-us-project-src={SCENE_URL} />
      </div>
      <div className="grid-bg" aria-hidden="true" />
    </>
  );
}
```

If T2b found no `paused` in the vendored runtime: replace the `still` branch with `scenes.forEach((s) => s.destroy?.()); showFallback(true);`.

- [ ] **Step 4: Run → PASS**, then `npm run typecheck`. Commit `feat(ui): FieldBackground with CSS fallback and bail-outs`.

### Task 5: Navbar, TrustStrip, spotlight hook

**Files:** Rewrite `src/components/Navbar.tsx`; Create `src/components/TrustStrip.tsx`, `src/lib/use-spotlight.ts`, `src/components/__tests__/TrustStrip.test.tsx`; Rewrite `src/components/__tests__/Navbar.test.tsx`.

**Interfaces:** `Navbar()` → `<header class="nav">` containing `a.brand[href="#main"]` (inline SVG mark from build.py:856-859 + `span.word` "Thulani"), `nav.links[aria-label="Primary"]` with `<button>`s About/Skills/Work/Experience/Services calling `scrollToSection("operator"|"skills"|"work"|"experience"|"services")`, and `a.btn.btn-light[href="#contact"]` "Get in touch" + arrow svg. `TrustStrip()` → markup of build.py:1727-1738 with `export const TRUST_BADGE = "8+ years in South African banking"`. `useSpotlight(rootRef, selector = ".spot, .cap")` — delegated `pointermove` on the root writing `--mx/--my` px onto the closest matching descendant; no-op on `pointer:coarse`.

- [ ] **Step 1: Failing tests**

```tsx
// Navbar.test.tsx (replace whole file)
import { render, screen } from "@testing-library/react";
import { Navbar } from "@/components/Navbar";
it("renders the pill: brand, five section buttons, CTA, no theme toggle", () => {
  render(<Navbar />);
  expect(screen.getByRole("link", { name: /thulani/i })).toBeInTheDocument();
  for (const n of ["About", "Skills", "Work", "Experience", "Services"])
    expect(screen.getByRole("button", { name: n })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /get in touch/i })).toHaveAttribute(
    "href",
    "#contact",
  );
  expect(screen.queryByRole("button", { name: /toggle theme/i })).toBeNull();
});
// TrustStrip.test.tsx
import { render, screen } from "@testing-library/react";
import { TrustStrip, TRUST_BADGE } from "@/components/TrustStrip";
import { experiences } from "@/data/experience";
it("marquee lists each employer once per set and carries the credential", () => {
  const { container } = render(<TrustStrip />);
  const names = [...new Set(experiences.map((e) => e.company))];
  const sets = container.querySelectorAll(".mq-set");
  expect(sets).toHaveLength(2);
  expect(sets[1]).toHaveAttribute("aria-hidden", "true");
  names.forEach((n) => expect(sets[0]).toHaveTextContent(n));
  expect(screen.getByText(new RegExp(TRUST_BADGE))).toBeInTheDocument();
});
```

- [ ] **Step 2: Run → FAIL**: `npx vitest run src/components/__tests__/Navbar.test.tsx src/components/__tests__/TrustStrip.test.tsx`
- [ ] **Step 3: Implement** `use-spotlight.ts`:

```ts
import { useEffect, type RefObject } from "react";
/** Feeds the .spot / .cap-glow radial gradients (--mx/--my in px). One delegated listener per section. */
export function useSpotlight(
  root: RefObject<HTMLElement | null>,
  selector = ".spot, .cap",
) {
  useEffect(() => {
    const el = root.current;
    if (!el || matchMedia("(pointer: coarse)").matches) return;
    const move = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest<HTMLElement>(selector);
      if (!t || !el.contains(t)) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty("--mx", `${e.clientX - r.left}px`);
      t.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    el.addEventListener("pointermove", move, { passive: true });
    return () => el.removeEventListener("pointermove", move);
  }, [root, selector]);
}
```

`Navbar.tsx`: drop `useTheme`, `DropdownMenu`, `Menu/X/Sun/Moon/Monitor`, the drawer, `Logo`; keep the `animate()` entrance gated by `useReducedMotion` (paper-bg fade goes — the pill has no scrolled state). Mockup inline `style` attributes → Tailwind spacing utilities of the same px (all are multiples of 4) or a class in `aura.css`. `TrustStrip.tsx` per build.py:1714-1738 (names deduped in order from `experiences`, `✓` as `&#10003;`).

- [ ] **Step 4: Run → PASS**; `npm run typecheck`; commit `feat(ui): nav pill, employer marquee, spotlight hook`.

### Task 6: HeroSection + OperatorSection

**Files:** Rewrite `src/components/HeroSection.tsx`; Create `src/components/OperatorSection.tsx`; Rewrite `src/components/__tests__/HeroSection.test.tsx`; Create `src/components/__tests__/OperatorSection.test.tsx`.

**Interfaces:** `HeroSection()` → `<section id="hero" class="hero" aria-labelledby="hero-heading">` › `.wrap` › `.hero-2col` › left: `p.eyebrow.mono` ("Open to permanent & contract", dot+halo) · `h1#hero-heading.display` = `Kubernetes platforms<br/><span class="lit">for South African</span><br/><span class="fade">banking.</span>` · `p.lede` = `personalData.tagline` · `.cta-row` = `a.shiny-cta[href="#work"] > span "View the work"` + `a.btn.btn-ghost[href="#contact"] "Get in touch" + span.arw` · `.metrics[data-anime-hero="metrics"]` of `.metric > b + span.mono.tiny` for `personalData.metrics` (labels Projects / Experience / Certifications); right: `.instrument` = SVG from build.py:800-834 (JSX attribute casing) + three readouts (836-843) "8+ years" / "Azure certified" / "Gauteng · GMT+2". No `<img>`. Anchors call `scrollToSection` on click (preventDefault) so Lenis drives the scroll. `OperatorSection()` → `<section id="operator" class="s-80" aria-labelledby="operator-heading">`: eyebrow "Built for regulated environments"; `h2#operator-heading.display` "Most platform work fails in production, <span class=fade>not in review.</span>"; `.op-grid` = `figure.portrait` (`<picture>` from `personalData.profileImageSources` lg/md, `img[alt="Thulani Maseko"][width=1024][height=1024][loading=lazy][decoding=async]`, `div.scrim`, `figcaption.hud` "REF · TM-01" / "ZA / GMT+2") + column (`p.lede` tagline, `p.body` build.py:892-895 text, two `.stat-pill`s: "Microsoft Certified / Azure Developer Associate", "Based / {personalData.location}").

- [ ] **Step 1: Failing tests** — HeroSection: h1 name matches `/Kubernetes platforms/`; `getByText(personalData.tagline)`; links "View the work"→`#work`, "Get in touch"→`#contact`; metrics values `personalData.metrics.{projects,experience,certifications}` present; `container.querySelector("img")` is `null`; `container.querySelector("#hero .instrument svg")` exists. Keep the existing framer-less `useReducedMotion` mock only if `@/lib/motion` needs it. OperatorSection: `getByAltText(/Thulani Maseko/)` is an `IMG` inside `#operator`; `getByRole("heading",{level:2,name:/Most platform work fails/})`; `getByText(personalData.location)`.
- [ ] **Step 2: Run → FAIL** (`npx vitest run src/components/__tests__/HeroSection.test.tsx src/components/__tests__/OperatorSection.test.tsx`)
- [ ] **Step 3: Implement** — port markup literally from `hero(1, v4=True)` (build.py:1283-1296, 1254-1281) and `operator(1)` (883-908). Keep `useAnime` entrance cascade on the existing `data-anime-hero` hooks (retarget to the new nodes), drop `useMagnetic` and the `IntersectionObserver` blob pause.
- [ ] **Step 4: Run → PASS**; commit `feat(ui): signal-field hero + operator section (portrait in colour)`.

### Task 7: Restyle-only — Skills, SkillsRadar, Experience (frozen layouts)

**Files:** Modify `SkillsSection.tsx`, `SkillsRadar.tsx`, `ExperienceSection.tsx`; edit `SkillsSection.test.tsx:23-26`.

- [ ] **Step 1: Failing test** — `SkillsSection.test.tsx`: `expect(screen.getByRole("heading",{level:2,name:/Skills & expertise\./i})).toBeInTheDocument()` and `expect(screen.getByRole("button",{name:/DevOps/})).toHaveAttribute("data-active","true")`.
- [ ] **Step 2: Run → FAIL**.
- [ ] **Step 3: Implement** — Skills: heading `Skills &amp; <span className="fade">expertise.</span>` (keep `id="skills-heading"`), lede from build.py:961-962, category order/labels `devops "DevOps & Cloud"`, `backend`, `frontend`; default `activeCategory="devops"`; class swaps to `.sk-toggles/.sk-toggle/.sk-grid/.sk-head(.bar)/.sk-panel/.sk-list/.sk-row-top/.sk-name/.chip/.sk-track/.sk-fill`; `categoryColors` all `oklch(var(--signal))`; **do not touch** the exit→swap→stagger orchestration (78-145) or `data-active`. SkillsRadar: default `color` → `oklch(var(--signal))`, gridlines `rgba(255,255,255,.10)`, labels `var(--font-mono)` 10px `rgba(255,255,255,.60)`; geometry untouched. Experience: `.tl-*` classes per build.py:370-416 and markup 966-1002; **move `container-type` from the card to the slot** (`.tl-slot`) — fixes the self-querying container at `ExperienceSection.tsx:148`; card = `.tl-card.spot` with `data-open`, `aria-expanded`, `aria-controls` and the `0fr→1fr` fold untouched; section `id="experience" class="s-solid"`; header `.sec-head.asym` (eyebrow "Career", body copy 996-997, right `h2#experience-heading` "Eight years <fade>of production systems.</fade>"); `useSpotlight(rootRef, ".tl-card")`.
- [ ] **Step 4: Run → PASS** (`npx vitest run src/components/__tests__/SkillsSection.test.tsx src/components/__tests__/ExperienceSection.test.tsx`); commit `feat(ui): restyle skills + experience to aura tokens (layouts frozen)`.

### Task 8: Data + Projects, Services, FAQ, Contact, Footer

**Files:** Create `src/data/services.ts`, `src/data/faq.ts`, `src/components/FaqSection.tsx`; Rewrite `ProjectsSection.tsx`, `ServicesSection.tsx`, `ContactSection.tsx`, `Footer.tsx`; tests: rewrite `ProjectsSection.test.tsx`, `ContactSection.test.tsx`, `Footer.test.tsx`; create `FaqSection.test.tsx`, `src/data/__tests__/services.test.ts`.

**Interfaces:**

```ts
// src/data/services.ts
export interface Service {
  id: "k8s-ops" | "iac" | "backend";
  eyebrow: string;
  name: string;
  body: string;
  caps: string[];
  tech: string[];
}
export const services: Service[]; // exactly build.py:122-141 (names: "Kubernetes Platform Operations", "Infrastructure as Code", ".NET & Java Microservices")
// src/data/faq.ts
export interface FaqItem {
  q: string;
  a: string;
}
export const faq: FaqItem[]; // exactly build.py:143-152
```

Sections: `#work` (`s-blur-xl`, `h2#work-heading` "Four repositories, <fade>all of them public.</fade>", lede 1014-1015; rows per build.py:1037-1060 — `article.panel.spot > .show-split`, left: `p.mono.tiny.on` "0N / tagline", `h3.display` title, `p.small` description, `a.btn.btn-ghost[href=githubUrl]` "View repository ↗"; right: "Impact" label, impact text, chips(technologies, 8)); keeps `useFeaturedProjects(6)` + static fallback + error banner, **drops** the filter chips/state. `#services` (`s-50`, `.eyebrow-pill` "What I take on", `h2#services-heading` "Three kinds of engagement, <fade>one delivery path.</fade>", lede 1882-1884, `.cap-grid` per 1857-1890 with `_cap_card` 1836-1854; card 2 wrapped `.cap-edge.cap-lift` with the zap icon 1703; closing `a.shiny-cta.sm[href="#how"]` "How an engagement starts"; `useSpotlight(rootRef, ".cap")`). `#how` (`s-80`, `.sec-head.asym`, `h2#how-heading` "Engagement, <fade>decoded.</fade>", `details.acc` rows 1114-1121, first `open`). `#contact` (`s-80`, `.slab` per 1133-1159: `h2#contact-heading` "Need someone who has already <fade>shipped this in a bank?</fade>", `p.body` = **`personalData.availability` verbatim**, three `a.slab-card`: `mailto:${email}` "Email directly", LinkedIn "Thulani Maseko", GitHub "maseko-lucky-9"; `aria-label`s "Email", "LinkedIn", "GitHub"). Footer (1161-1187 + a 4th "Writing" column keeping `/blog`, `/answers`, `/projects`, `/rss.xml`): band 1 `.f-chip` mark + wordmark "Thulani Maseko" (display 500 upright) + `p.small` = `personalData.title`; "Sections" (About→#operator, Skills, Work, Experience); "Elsewhere" (GitHub, LinkedIn, Email — with `aria-label`s); "Writing"; legal bar `© {year} Thulani Maseko` + `personalData.location`.

- [ ] **Step 1: Failing tests** — services.test: 3 entries, ids in order, each `caps.length===4`; FaqSection: 4 `details`, first `open`, headings match `faq[i].q`; Projects: heading `/Four repositories/`, 4 `.show-split`, each has a link with `href` = `project.githubUrl` and text `/View repository/`; Contact: `getByText(personalData.availability)`, `getByRole("link",{name:/email/i})` href `mailto:${personalData.email}`, no `form`; Footer: `getByText(personalData.title)`, links `/blog /answers /projects /rss.xml` present, no empty `href`, GitHub/LinkedIn labelled, `© ${new Date().getFullYear()}`.
- [ ] **Step 2: Run → FAIL** (`npx vitest run src/components/__tests__ src/data/__tests__`)
- [ ] **Step 3: Implement** per the interfaces; `useSpotlight(rootRef)` in Projects.
- [ ] **Step 4: Run → PASS**; `npm run typecheck`; commit `feat(ui): work showcase, capability cards, faq, contact slab, footer`.

### Task 9: Page shell — Index, App, index.html, manifest, ChatWidget

**Files:** Modify `src/pages/Index.tsx`, `src/App.tsx`, `index.html`, `public/site.webmanifest`, `src/components/ChatWidget.tsx:196`.

- [ ] **Step 1: `Index.tsx`** — remove `ThemeProvider`, `CustomCursor`, `ScrollProgress`, `SectionBridge`, `BlogSection`, `CaseStudiesSection` imports/usages. Render: skip link (`href="#main"`) → `<FieldBackground />` → `<Navbar />` → `<SmoothScroll />` → `<main id="main">` { `<HeroSection />`, `<TrustStrip />`, then `LazySection`+`Suspense` (fallback = `<div style={{minHeight}} />`, `SectionFallback` deleted) for `OperatorSection`, `SkillsSection`, `ExperienceSection`, `ProjectsSection`, `ServicesSection`, `FaqSection`, `ContactSection` } → `<Footer />` → `<ChatWidget />`. Re-measure each `minHeight` from the built page at 1440 (`getBoundingClientRect().height` per section) — Lighthouse is not a WebDriver and pays real CLS for wrong reserves.
- [ ] **Step 2: `App.tsx:17`** → `<Sonner position="top-right" theme="dark" />`.
- [ ] **Step 3: `index.html`** — `<html lang="en" class="dark">`; replace the two `theme-color` metas with `<meta name="theme-color" content="#020305">` (= `oklch(0.097 0.008 236.9)`, computed this session) and add `<meta name="color-scheme" content="dark">`; delete the hero image preload (199-207); in the JSON-LD `hasOfferCatalog` (119-144) rename the three offers to `services.ts` names. `site.webmanifest`: `theme_color` and `background_color` → `#020305`. `ChatWidget.tsx:196` `glass-card` → `panel`.
- [ ] **Step 4: Verify** — `cd portfolio-ui && npm run build:app && npx vitest run src/test/smoke.test.tsx && npm run typecheck`; then `npm run preview` + playwright-cli screenshots at 1440×900 and 375×812 of `http://localhost:5173/` compared by eye against `~/.claude/plans/aura-signal-field-src/shots5/*.png`; stop preview.
- [ ] **Step 5: Commit** `feat(ui): wire signal-field page shell, dark-only html, manifest`.

### Task 10: Deletions and dependency hygiene

**Files:** Delete `src/components/{SectionBridge,CustomCursor,ScrollProgress,BlogSection,CaseStudiesSection}.tsx`, `src/contexts/ThemeContext.tsx`, `src/data/blog.ts`, `src/components/ui/Logo.tsx` (only if `grep -rn "ui/Logo" src` is empty), `e2e/theme.spec.ts`; Modify `src/index.css`, `package.json`, `vite.config.ts:85-110`, `playwright.config.ts:85`, `src/test/setup.ts:41-44` (comment).

- [ ] **Step 1** Delete the files; `grep -rn "SectionBridge\|CustomCursor\|ScrollProgress\|BlogSection\|CaseStudiesSection\|ThemeContext\|useTheme\|data/blog\|ui/Logo" src e2e` → empty.
- [ ] **Step 2** `index.css`: delete `.glass`/`.glass-card` (697-734), `.section-container/.section-title/.section-subtitle` (443-459), `.timeline-*` (461-517), `.skill-radar-container` (519-524), `.nav-link` (526-554), `.tech-badge` (394-418), `.social-link` (421-441), `.animate-float/.animate-pulse-glow/.animate-shimmer` + orphan keyframes (keep `.animate-shimmer-once` only if `SkillsSection` still uses it); `grep -rn "glass\|section-container\|tech-badge\|nav-link\|timeline-\|text-gradient" src` → empty.
- [ ] **Step 3** `npm uninstall framer-motion @gsap/react` (zero real imports; three tests mock framer-motion — remove those mocks); `vite.config.ts`: drop the `three-vendor` manualChunk branch and its comment; `playwright.config.ts:85` command → `VITE_USE_API=false npm run build && npm run preview`.
- [ ] **Step 4** Verify: `npm run lint && npm run typecheck && npm run build:app && npx size-limit && npx prettier --check "src/**/*.{ts,tsx,mts,js,mjs,jsx,json,css}"`; commit `chore(ui): retire bridge/cursor/progress/blog/case-studies/theme; drop dead deps`.

### Task 11: Budget gate (no edits)

- [ ] `cd portfolio-ui && npm run build:app && npx size-limit` — all five rows under limit; record numbers in `tasks/todo.md`.

### Task 12: Unit sweep

- [ ] `cd portfolio-ui && npm test` → green. Fix only what this redesign broke; pre-existing `it.skip(TODO(test-debt))` cases stay skipped. Commit `test(ui): unit suite green on signal-field`.

### Task 13: E2E rewrite _(closes the red window)_

**Files:** Rewrite `e2e/hero.spec.ts`, `e2e/navigation.spec.ts`, `e2e/projects.spec.ts`, `e2e/contact.spec.ts`, `e2e/accessibility.spec.ts`, `e2e/a11y.spec.ts`, `e2e/mobile-layout.spec.ts`; edit `e2e/live-domain.spec.ts:33`; Create `e2e/field.spec.ts`, `e2e/design.spec.ts`.

- [ ] **Step 1: Write the specs**
  - `hero.spec.ts`: `#hero` visible and `#hero-heading` has text `/Kubernetes platforms/`; eyebrow text "Open to permanent & contract"; `getByRole("link",{name:"View the work"})` href `#work`; `.metrics` contains `20+`, `8+ Years`, `3`; `#aura-bg #us-host` count 1 and `#field-fallback` count 1 (replaces "WebGL canvas or fallback"); availability string visible in `#contact` (`.first()`); `personalData.title` visible in `footer`.
  - `navigation.spec.ts`: `#hero` visible; desktop: click buttons Skills/Work/Experience → `#skills`/`#work`/`#experience` in viewport; brand `header a` first click → `scrollY < 10`; delete the mobile-drawer describe (50-67); mobile: `header` shows the "Get in touch" link and no section buttons.
  - `projects.spec.ts`: heading `/Four repositories/`; `#work .show-split` count 4; every `a[href^="https://github.com/"]` in `#work` has `target="_blank"`+`rel~=noopener` (if the component sets them) or just resolves; no "No projects" text.
  - `contact.spec.ts`: `#contact .slab-card` count 3; `a[href^="mailto:ltmaseko7@gmail.com"]` exists; text `/Gauteng.*South Africa/` in footer; no `form`.
  - `accessibility.spec.ts`: skip link → `#main` in viewport; images alt (keep); `aria-labelledby` on `#skills #work #contact`; heading id list → `hero-heading operator-heading skills-heading experience-heading work-heading services-heading how-heading contact-heading`; focusable check → `header` link `/Get in touch/` (desktop) instead of "Toggle theme"; social labels (keep).
  - `a11y.spec.ts`: delete the light test; the dark test includes `header`, `#hero`, `#operator`, `#contact` with the same wcag tags.
  - `mobile-layout.spec.ts`: keep 18-24 (header not covering) and 61-85 (no horizontal overflow — now meaningful because body no longer clips); delete 26-45 (drawer) and 91-118 (bridge).
  - `live-domain.spec.ts:33`: `#about` → `#hero`.
  - `field.spec.ts`:

```ts
import { test, expect, type Page } from "@playwright/test";
const hasWebGL2 = (page: Page) =>
  page.evaluate(() => {
    try {
      return !!document.createElement("canvas").getContext("webgl2");
    } catch {
      return false;
    }
  });
test("lite mode renders the CSS fallback only", async ({ page }) => {
  await page.goto("/?lite=1");
  await expect(page.locator("#field-fallback")).toHaveCSS("opacity", "1");
  await expect(
    page.locator('script[src="/field/unicornStudio.umd.js"]'),
  ).toHaveCount(0);
});
test("reduced motion (global config) holds a paused frame", async ({
  page,
}) => {
  await page.goto("/");
  test.skip(!(await hasWebGL2(page)), "no WebGL2 here");
  test.skip(
    !(await page.request.head("/field/scene.json")).ok(),
    "scene not provided yet — public/field/README.md",
  );
  await expect(page.locator("#us-host canvas")).toHaveCount(1, {
    timeout: 15000,
  });
  await expect
    .poll(() => page.evaluate(() => window.UnicornStudio?.scenes?.[0]?.paused))
    .toBe(true);
});
test.describe("running field", () => {
  test.use({ reducedMotion: "no-preference" });
  test("mounts the scene, hides the fallback, keeps running", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "coarse pointer pauses by design");
    await page.goto("/");
    test.skip(!(await hasWebGL2(page)), "no WebGL2 here");
    test.skip(
      !(await page.request.head("/field/scene.json")).ok(),
      "scene not provided yet",
    );
    await expect(page.locator("#us-host canvas")).toHaveCount(1, {
      timeout: 15000,
    });
    await expect(page.locator("#field-fallback")).toHaveCSS("opacity", "0");
    await expect
      .poll(() =>
        page.evaluate(() => window.UnicornStudio?.scenes?.[0]?.paused),
      )
      .toBe(false);
  });
});
test("no console errors or CSP violations on load", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // Phase 1 only: with no scene shipped yet, FieldBackground's HEAD probe 404s and
  // Chromium logs "Failed to load resource … 404" for /field/scene.json. That is the
  // designed "not provided" path, not a defect — and it disappears in Phase 2.
  expect(errors.filter((e) => !/field\/scene\.json/.test(e))).toEqual([]);
});
```

- `design.spec.ts`: after `document.fonts.ready`, `document.fonts.check("italic 16px Spectral")`, `check('16px "Public Sans Variable"')`, `check('12px "JetBrains Mono"')` all true; Tab from top → `getComputedStyle(activeElement).outlineWidth === "2px"` and `outlineStyle === "solid"`; `.mq-set` first contains the five employer names and `.mq-badge` the credential; `#services .cap` count 3 with the three service names; click the 2nd `#how summary` → its `details` has `open`; `/site.webmanifest` `theme_color` equals `meta[name=theme-color]` content; `#operator img[alt="Thulani Maseko"]` visible after `scrollIntoViewIfNeeded`; `header` has exactly the five section buttons at 1440.
- [ ] **Step 2: Run (local preview path)** `cd portfolio-ui && npx playwright test` — both projects green (field running-case skips until T2b). Commit `test(e2e): signal-field suite (field, design, rewritten specs)`.

### Task 14: Playwright target opt-in + nginx CSP alignment (config diffs shown before applying)

**Files:** Modify `playwright.config.ts`, `nginx.conf:55`.

- [ ] **Step 1: `playwright.config.ts`** — add after `liveBaseUrl`:

```ts
// E2E_FULL_SUITE=1 lifts the live-domain-only restriction. One case only: the Docker
// trial, where E2E_BASE_URL is a throwaway localhost container and the WHOLE suite is
// what we want to fire at it. Deliberately not a second URL variable — a typo or a stale
// export must never aim 60 specs at production.
const fullSuite = process.env.E2E_FULL_SUITE === "1";
```

and `testMatch: liveBaseUrl && !fullSuite ? "live-domain.spec.ts" : undefined,`; replace the stale `AuroraBackground` comments (34-40, 81-84) with a note that `reducedMotion:"reduce"` is global and `field.spec.ts` overrides it.

- [ ] **Step 2: `nginx.conf:55`** → exactly:

```nginx
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://t.thulanimaseko.co.za; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://t.thulanimaseko.co.za http://api.portfolio.homelab ws://api.portfolio.homelab; media-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;
```

Deltas vs `worker.ts`: `'unsafe-eval'` removed (runtime has none — T2b check), hardening directives added, Umami origin added to `script-src`/`connect-src` (else every container load is a CSP violation from `index.html:183-188`), homelab API hosts kept (this image proxies `/api/`), `upgrade-insecure-requests` **omitted** (container is plain http).

- [ ] **Step 3: Verify** `cd portfolio-ui && E2E_BASE_URL=http://localhost:18080 npx playwright test --list | tail -2` (live-domain only) and with `E2E_FULL_SUITE=1` (everything); `docker run --rm -v "$PWD/nginx.conf:/etc/nginx/nginx.conf:ro" --add-host backend-api:127.0.0.1 nginx:1.27-alpine nginx -t`. Commit `chore(e2e,docker): full-suite opt-in for container runs; align nginx CSP with production`.

### Task 15: Docker trial — build, run, full e2e against the container

**Phase 1 (now, fallback field):**

- [ ] **Step 1: Build (production-shaped: `VITE_USE_API=false`)**

```bash
cd /Users/ltmas/Repo/career/portfolio-website && docker build --build-arg VITE_USE_API=false -t portfolio-ui:aura portfolio-ui/ 2>&1 | tail -5
```

- [ ] **Step 2: Run + health + headers**

```bash
docker rm -f aura-trial 2>/dev/null; docker run -d --name aura-trial -p 18080:8080 --add-host backend-api:127.0.0.1 portfolio-ui:aura && until curl -fsS http://localhost:18080/health >/dev/null; do sleep 1; done && curl -sI http://localhost:18080/ | grep -iE "content-security-policy|x-frame|content-type" && curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' http://localhost:18080/field/README.md
```

Expected: `200 healthy`, the T14 CSP line, `text/html; charset=utf-8`.

- [ ] **Step 3: Full suite against the container**

```bash
cd portfolio-ui && E2E_BASE_URL=http://localhost:18080 E2E_FULL_SUITE=1 npx playwright test 2>&1 | tail -15
```

Expected: `N passed, M skipped (field running-case)`, 0 failed — paste the summary line.

- [ ] **Step 4: Visual + audit pass with playwright-cli** — `playwright-cli -s=trial open http://localhost:18080/`; `resize` 375 812 / 768 1024 / 1024 768 / 1440 900, full-page screenshots to `~/.claude/plans/aura-signal-field-src/trial/`; `run-code` the contrast audit (`audit.js`) and focus audit (`focus.js`) from the src dir; `console` must be clean; deliver screenshots via SendUserFile. Then `docker logs aura-trial 2>&1 | grep -i error` → empty.
- [ ] **Step 5: Record** results in `tasks/todo.md` (test summary, header line, audit numbers); `docker rm -f aura-trial`.

**Phase 2 (after T2b — the user's scene):** rebuild the image, rerun Steps 2–4; additionally compare the hero at 1440×900 against `shots5/1-hero.png` (field on, same phase) and confirm `field.spec.ts` running-case is **passed**, not skipped. Paste the summary line. This is the "everything end to end on Docker" acceptance.

### Task 16: Lighthouse gate (no edits unless red)

- [ ] `cd portfolio-ui && VITE_USE_API=false npm run build && cd .. && npx --yes @lhci/cli@0.14.x autorun --config=lighthouserc.json 2>&1 | tail -30` — perf ≥ 0.90, LCP ≤ 2000, CLS ≤ 0.05 on `/index.html`. Levers if red, in order: (1) CLS from the Spectral swap → copy `spectral-latin-400-italic.woff2` to `public/fonts/`, declare `@font-face` against it and `<link rel="preload" as="font" type="font/woff2" crossorigin>` it in `index.html`; (2) TBT from the runtime → raise the idle timeout / start on first interaction; (3) add `/field/**` to `blockedUrlPatterns` with the reason in the ADR. `# ponytail: no font preload until CLS says so`.

### Task 17: Docs

- [ ] `.impeccable.md` revision-6 block: fonts → Spectral + Public Sans Variable (+ JetBrains Mono); accent exception is now cyan `--signal` (replaces mint; `#38BDF8`); dark-only (light retired); WebGL field allowed as the single ambient layer, with the bail-outs listed; `backdrop-filter` allowed for the section-translucency rhythm; stepped px type ramp replaces the modular/`clamp` scale; pure `#fff` ink allowed (alpha-graded); accent may paint display text only in the hero `.lit` span; restate the ≤ 0.015 dark-neutral chroma ceiling (Aura ≤ 0.012 — still honoured); record the drift the code already had.
- [ ] `docs/decisions/008-aura-signal-field-redesign.md` (shape of 004-007): context, decision (v4, Spectral, treatment A, own Unicorn export — licence rationale: runtime proprietary, self-hosting _own_ export is the documented path, Aura's scene never shipped), consequences (sections removed, anchors renamed, static SEO pages now visually differ — follow-up), Docker-first verification.
- [ ] `portfolio-ui/README.md` — remove theme-toggle/light-mode mentions; add the Docker trial commands and `E2E_FULL_SUITE`. `docs/design-research/README.md` — add the spec location line. `tasks/todo.md` — review section (what shipped, gates, numbers).
- [ ] Commit `docs: impeccable rev 6, ADR 008, docker trial runbook`.

### Task 18: Close-out (user-gated)

- [ ] Present: branch name, commit list (`git log --oneline main..`), the Phase-1 (and Phase-2 if the export landed) e2e summary lines, header line, size-limit table, Lighthouse scores, screenshots. **Stop.** No push, no PR, no `/ship` — the user gives the go-ahead for production separately; when they do, the path is `git push -u origin feat/aura-signal-field` → PR → `frontend-ci` + `bundle-size` + `lighthouse-ci` green → merge → `cloudflare-cd`.

---

## Verification (what "done" means for this phase)

| Gate                                | Command                                                                                                 | Pass                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Typecheck / lint / format           | `npm run typecheck && npm run lint && npx prettier --check "src/**/*.{ts,tsx,mts,js,mjs,jsx,json,css}"` | clean                                                           |
| Unit                                | `npm test`                                                                                              | green                                                           |
| Budgets                             | `npm run build:app && npx size-limit`                                                                   | 5/5 under (CSS < 40 KB gz)                                      |
| E2E (preview)                       | `npx playwright test`                                                                                   | green, field running-case skipped until export                  |
| Docker build + health + CSP         | T15 Steps 1–2                                                                                           | `200 healthy`; CSP = T14 line                                   |
| **E2E against container**           | `E2E_BASE_URL=http://localhost:18080 E2E_FULL_SUITE=1 npx playwright test`                              | 0 failed (paste summary)                                        |
| Visual / contrast / focus / console | playwright-cli pass (T15 Step 4) at 375/768/1024/1440                                                   | no overflow; contrast audit 0 fails; focus rings; console empty |
| Lighthouse                          | T16                                                                                                     | perf ≥ .90, LCP ≤ 2000, CLS ≤ .05                               |
| Exact field (Phase 2)               | `field.spec.ts` running-case **passed**; hero screenshot ≈ `shots5/1-hero.png`                          | after the user's export                                         |
| Repo hygiene                        | `git status --short` clean on the branch; `main` at `001ebaf`                                           | yes                                                             |

## Risk register (top 8)

| #   | Risk                                                        | Mitigation                                                                              | Detects                         |
| --- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | CSS gz > 40 KB (today 36.4 KB; Aura CSS +9.5 KB gz)         | Font subsetting is the lever (Inter 7 + mono 18 `@font-face` blocks → 8); ≈ 30 KB after | `npx size-limit`                |
| 2   | Lighthouse perf/TBT with the runtime                        | idle-callback load (2 s timeout), fallback-first; blocked pattern as last resort        | T16                             |
| 3   | CLS from Spectral swap on a 72 px balanced h1               | preload lever in T16                                                                    | T16                             |
| 4   | `aura.css` hoisted above preflight                          | import from `main.tsx`, never `@import`; T3 Step 4 check                                | node snippet                    |
| 5   | shadcn hovers turn cyan (`--accent` collision)              | Aura token renamed `--signal`; `--accent` = elevated surface                            | `grep -- --accent aura.css` → 0 |
| 6   | field spec red on WebKit/mobile or CI without WebGL2        | runtime probe + `test.skip`; fallback asserted in the un-skipped path                   | `--project=mobile`              |
| 7   | Container CSP blocks Umami → console errors                 | Umami origin in the nginx line                                                          | `curl -sI … \| grep -i csp`     |
| 8   | Runtime/scene version mismatch or `paused` API drift (v2.x) | vendor the exact version from the export snippet; T2b greps                             | T2b                             |

## Out of scope / follow-ups

- `/blog`, `/answers`, `/projects` static pages keep their own template (`scripts/seo/page-template.mjs`) — restyle later.
- `use-contact.ts`, `contact.service.ts`, `icons/animated` lose consumers but stay (covered by tests / possible reuse).
- `FAQPage` JSON-LD from `faq.ts` via `schemaBuilders.ts` — cheap SEO win, separate PR.
- `.impeccable.md` full rewrite (it already drifted before this work).
- Production deploy, PR, `/ship` — only on the user's explicit go-ahead.
