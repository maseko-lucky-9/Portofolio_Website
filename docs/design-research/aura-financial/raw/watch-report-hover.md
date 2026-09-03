---
source: hover-pass.webm
title: hover-pass.webm
duration: 00:48
watched_at: 2026-08-31T21:51:55.660778+02:00
intent: hover and interaction states: nav links, CTA buttons, cards, table rows, status dots
hero_frames: [frame_0001.jpg, frame_0009.jpg, frame_0017.jpg, frame_0025.jpg, frame_0033.jpg]
transcript_source: none
---


> **Note.** Frame paths below point at an ephemeral `/watch` working directory that no longer
> exists, and the source `.webm` is not committed (large, and reproducible from the recipe in
> `DESIGN.md` → Method — motion pass). The frames worth keeping were copied to
> `motion/frames/`; the measurements derived from them are in `raw/motion-observed.json`.

# hover-pass.webm

## TL;DR

- Hover is a **major documented gap** in the original research: the resolved-style census is blind to `:hover` by construction.
- **41 distinct `hover:` utilities** plus a parallel `group-hover:` set; the dominant idiom is a whole card lighting up together.
- **The logo marquee pauses on hover** (`animation-play-state: paused`) — verified live, playState froze at t=371066ms.
- **Shimmer accelerates 4s → 1.5s on hover**, a 2.7× speed-up.
- The shader itself is **completely unresponsive** to the cursor — swept mouse produced no more change than a parked one.

## Key moments

- **[00:00–00:12]** Cursor sweeps across the hero background — the field does not deflect, bend, or brighten toward the pointer.
- **[00:14]** Nav links: ink 0.5 → 1.0 colour transition only, no underline or background.
- **[00:20]** Primary CTA: conic `border-spin` (2.5s) plus `breathe` glow are ambient, already running before hover.
- **[00:32]** Card hover — border `white/10 → white/20`, background `white/[0.02] → [0.04–0.06]`, subtle lift.
- **[00:40]** Table/list rows: background wash at `duration-300`.

## Hook microscope (0-10s)

_Skipped: focused mode or short video or --no-hook-microscope._

## Editorial profile

_No scene-change data — likely a static/screen-recorded source._

_Not applicable — hook microscope disabled for this clip._

## Quotable moments

Restrained hover language: colour and border shifts at 300ms dominate; transforms are small (0.5–2%) and used sparingly.

## Entities mentioned

- People: _N/A — this is a silent screen recording of a website, not spoken content. Entity/concept/quote extraction does not apply; the design findings live in `raw/motion-observed.json` and `DESIGN.md` §9/§10a._
- Companies: _N/A — this is a silent screen recording of a website, not spoken content. Entity/concept/quote extraction does not apply; the design findings live in `raw/motion-observed.json` and `DESIGN.md` §9/§10a._
- Tools / products: _N/A — this is a silent screen recording of a website, not spoken content. Entity/concept/quote extraction does not apply; the design findings live in `raw/motion-observed.json` and `DESIGN.md` §9/§10a._
- Places: _N/A — this is a silent screen recording of a website, not spoken content. Entity/concept/quote extraction does not apply; the design findings live in `raw/motion-observed.json` and `DESIGN.md` §9/§10a._

## Concepts surfaced

_N/A — this is a silent screen recording of a website, not spoken content. Entity/concept/quote extraction does not apply; the design findings live in `raw/motion-observed.json` and `DESIGN.md` §9/§10a._

## Transcript

_No transcript available._

## All frames

_Total: 40. Hero frames flagged with star._

* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0001.jpg` (t=00:00)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0002.jpg` (t=00:01)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0003.jpg` (t=00:02)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0004.jpg` (t=00:04)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0005.jpg` (t=00:05)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0006.jpg` (t=00:06)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0007.jpg` (t=00:07)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0008.jpg` (t=00:08)
* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0009.jpg` (t=00:10)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0010.jpg` (t=00:11)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0011.jpg` (t=00:12)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0012.jpg` (t=00:13)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0013.jpg` (t=00:14)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0014.jpg` (t=00:16)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0015.jpg` (t=00:17)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0016.jpg` (t=00:18)
* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0017.jpg` (t=00:19)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0018.jpg` (t=00:20)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0019.jpg` (t=00:22)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0020.jpg` (t=00:23)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0021.jpg` (t=00:24)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0022.jpg` (t=00:25)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0023.jpg` (t=00:26)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0024.jpg` (t=00:28)
* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0025.jpg` (t=00:29)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0026.jpg` (t=00:30)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0027.jpg` (t=00:31)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0028.jpg` (t=00:32)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0029.jpg` (t=00:34)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0030.jpg` (t=00:35)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0031.jpg` (t=00:36)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0032.jpg` (t=00:37)
* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0033.jpg` (t=00:38)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0034.jpg` (t=00:40)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0035.jpg` (t=00:41)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0036.jpg` (t=00:42)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0037.jpg` (t=00:43)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0038.jpg` (t=00:44)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0039.jpg` (t=00:46)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hover/frames/frame_0040.jpg` (t=00:47)
