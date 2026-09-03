---
source: hero-hold.webm
title: hero-hold.webm
duration: 01:36
watched_at: 2026-08-31T21:44:20.746495+02:00
intent: WebGL shader background: palette, motion direction, speed, loop length, lifecycle from page load
hero_frames: [frame_0001.jpg, frame_0013.jpg, frame_0025.jpg, frame_0037.jpg, frame_0049.jpg]
transcript_source: none
---


> **Note.** Frame paths below point at an ephemeral `/watch` working directory that no longer
> exists, and the source `.webm` is not committed (large, and reproducible from the recipe in
> `DESIGN.md` → Method — motion pass). The frames worth keeping were copied to
> `motion/frames/`; the measurements derived from them are in `raw/motion-observed.json`.

# hero-hold.webm

## TL;DR

- The WebGL field runs **two independent timescales**: a **2.85s** whole-field brightness pulse (luma 30.6 → 48.4) and a **non-repeating macro morph** over roughly 30–60s.
- The macro morph swings between a viewport-filling luminous vortex and a small receded dark lens. It is noise-driven (`noise` layer, `speed: 0.37`), so **there is no loop point**.
- Rendered palette is **teal-cyan** (`#00A8C0`–`#00C0C0`), measurably greener than the `#38BDF8` CSS accent.
- Every bright region carries a **halftone square grain** from a `glyphDither` layer sampling `glyphs/squares.png` — it is texture, not compression artefact.
- The field is **not cursor-reactive** (`trackMouse: 0` on all 14 layers, confirmed by A/B test).

## Key moments

- **[00:00–00:08]** Page load: white flash then first paint. The shader mounts asynchronously — it is absent from the DOM for the first several hundred ms, which is exactly how the original extraction recorded `canvas: 0`.
- **[00:03]** Near-peak macro state — vortex fills the viewport, brightest cyan of the clip (`hero-shader-t0003.jpg`).
- **[00:22]** Fully receded — only a small dark lens with faint blue edging remains (`hero-shader-t0022.jpg`).
- **[00:42]** Still receded, different silhouette — proof the morph does not repeat (`hero-shader-t0042.jpg`).
- **[00:57]** Near-peak again, but a *different shape* from 00:03 (`hero-shader-t0057.jpg`).
- **Throughout** — the 2.85s pulse runs continuously underneath the macro morph, independent of it.

## Hook microscope (0-10s)

_Skipped: focused mode or short video or --no-hook-microscope._

## Editorial profile

_No scene-change data — likely a static/screen-recorded source._

The first 10s are dominated by mount latency, not design: white load screen through ~00:08, then the shader fades up. The "hook" of this hero is not a motion event at all — it is the *steady state*: an instrument-panel field that is always already in motion when you arrive. Pattern: **ambient-establishing**, not in-medias-res.

## Quotable moments

Slow, continuous, loopless ambient field — closer to a lava lamp than a video loop, with a metronomic 2.85s breath underneath.

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

_Total: 60. Hero frames flagged with star._

* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0001.jpg` (t=00:00)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0002.jpg` (t=00:01)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0003.jpg` (t=00:02)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0004.jpg` (t=00:03)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0005.jpg` (t=00:04)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0006.jpg` (t=00:05)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0007.jpg` (t=00:06)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0008.jpg` (t=00:07)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0009.jpg` (t=00:08)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0010.jpg` (t=00:09)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0011.jpg` (t=00:10)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0012.jpg` (t=00:11)
* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0013.jpg` (t=00:12)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0014.jpg` (t=00:13)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0015.jpg` (t=00:14)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0016.jpg` (t=00:15)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0017.jpg` (t=00:16)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0018.jpg` (t=00:17)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0019.jpg` (t=00:18)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0020.jpg` (t=00:19)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0021.jpg` (t=00:20)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0022.jpg` (t=00:21)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0023.jpg` (t=00:22)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0024.jpg` (t=00:23)
* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0025.jpg` (t=00:24)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0026.jpg` (t=00:25)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0027.jpg` (t=00:26)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0028.jpg` (t=00:27)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0029.jpg` (t=00:28)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0030.jpg` (t=00:29)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0031.jpg` (t=00:30)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0032.jpg` (t=00:31)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0033.jpg` (t=00:32)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0034.jpg` (t=00:33)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0035.jpg` (t=00:34)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0036.jpg` (t=00:35)
* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0037.jpg` (t=00:36)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0038.jpg` (t=00:37)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0039.jpg` (t=00:38)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0040.jpg` (t=00:39)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0041.jpg` (t=00:40)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0042.jpg` (t=00:41)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0043.jpg` (t=00:42)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0044.jpg` (t=00:43)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0045.jpg` (t=00:44)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0046.jpg` (t=00:45)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0047.jpg` (t=00:46)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0048.jpg` (t=00:47)
* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0049.jpg` (t=00:48)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0050.jpg` (t=00:49)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0051.jpg` (t=00:50)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0052.jpg` (t=00:51)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0053.jpg` (t=00:52)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0054.jpg` (t=00:53)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0055.jpg` (t=00:54)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0056.jpg` (t=00:55)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0057.jpg` (t=00:56)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0058.jpg` (t=00:57)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0059.jpg` (t=00:58)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-hero/frames/frame_0060.jpg` (t=00:59)
