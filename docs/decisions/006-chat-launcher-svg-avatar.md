# 006 — Chat launcher avatar: code-drawn SVG over Rive/Three.js/image pipelines

## Status

Accepted (2026-08-05)

## Context

The chat launcher's `MessageSquare` icon was to be replaced with an interactive AI robot avatar
(Wix-AI-bot inspiration): cursor-tracking eyes, an antenna bulb that lights while a reply streams,
and idle personality (blink, hover reaction, bounce on reply, sleep).

Five technology tracks were researched: industry teardown, Three.js real 3D, Rive, Spline, and an
advanced-2D hybrid. Findings:

- Industry (Notion AI, Duolingo, Intercom) converges on **Rive**, but its glow-capable runtime is
  ~970KB gzip against this site's 90KB main-JS budget, needs a paid tier to export, and days of
  editor authoring.
- **Three.js** measures ~163KB gzip for a minimal scene (empirically built against this repo's
  Vite config) and demands an image-to-3D model pipeline (Meshy/Tripo + Blender) — external
  services, external assets, and a WebGL lifecycle to babysit on an always-visible 64-80px button.
- **Spline** is ~1MB+ runtime and subscription-locked.
- At launcher size, all three renderers are visually indistinguishable from good 2D.

A Three.js plan was fully reviewed (3 advisory agents) and approved, then superseded by an owner
directive: *reduce complexity; no external sources; everything created in the codebase.*

## Decision

Build the avatar as a **hand-crafted inline SVG component** (`ChatAvatar.tsx`): gradients +
specular shapes for the glossy shell, `--primary-glow` token for eyes/bulb, a window-level
rAF-lerp for page-wide eye tracking (pattern lifted from `CustomCursor.tsx`), and anime.js (already
budgeted in motion-vendor) for blink/bounce/pulse. State machine
`responding > celebrating > sleeping > awake` exposed via `data-avatar-state`/`data-glow` so tests
assert states, never motion. Purely decorative (`aria-hidden`); the button keeps its e2e-keyed
aria-label.

Alongside: the chat stream gained an `AbortController` + 25s idle watchdog — without it a hung
stream left `busy` (and the bulb) on forever.

## Consequences

- Zero new dependencies; ~4KB gzip of component code inside existing budgets; no WASM/CSP,
  WebGL-context, or battery concerns; reduced-motion falls out of existing conventions.
- The launcher grew to 64px mobile / 80px desktop (footer gutter and panel offsets adjusted).
- Ceiling: a vector robot reads ~90% of the glossy 3D reference at these sizes; if the avatar
  later appears at 150px+ (e.g. panel header), revisit Rive/Three.js per the research notes in
  the PR/plan history.
