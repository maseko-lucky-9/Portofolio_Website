---
source: full-scroll.webm
title: full-scroll.webm
duration: 01:50
watched_at: 2026-08-31T21:51:25.254227+02:00
intent: per-section ambient animations: orbit rings, sonar, beam paths, marquee, status dots; how the WebGL field behaves down-page and where its mask fades
hero_frames: [frame_0001.jpg, frame_0013.jpg, frame_0025.jpg, frame_0037.jpg, frame_0049.jpg]
transcript_source: none
---


> **Note.** Frame paths below point at an ephemeral `/watch` working directory that no longer
> exists, and the source `.webm` is not committed (large, and reproducible from the recipe in
> `DESIGN.md` → Method — motion pass). The frames worth keeping were copied to
> `motion/frames/`; the measurements derived from them are in `raw/motion-observed.json`.

# full-scroll.webm

## TL;DR

- The WebGL field is **occluded, not scrolled**: sections below the hero paint opaque near-black backgrounds over the fixed canvas.
- The field is therefore visible only across the **hero + logo-wall band** — roughly the first 1100px of 9177px total.
- 8 of 10 sections have **no shader contribution at all**; their depth comes from CSS radial glows.
- The closing CTA contains the page's **only large solid-accent fill** — a 1280×504 `#38BDF8` panel.
- No scroll-triggered reveals anywhere: element count is identical before and after scrolling, confirming R13.

## Key moments

- **[00:22]** The occlusion boundary crosses mid-viewport — shader above, flat black below, a hard cut (`scroll-field-occlusion-t0022.jpg`).
- **[00:22]** Logo wall: two marquee tracks at 60s running in opposing directions.
- **[00:40]** Editorial split section — pure black, zero shader.
- **[01:02]** Pricing cards — three columns, accent used only for check glyphs and a highlighted tier badge.
- **[01:24]** Knowledge-base accordion with a soft blue radial glow behind it — CSS, not WebGL (`scroll-knowledge-base-t0084.jpg`).
- **[01:46]** Closing CTA: full-bleed cyan panel, the brightest frame in the entire clip (`scroll-cta-panel-t0106.jpg`).

## Hook microscope (0-10s)

_Skipped: focused mode or short video or --no-hook-microscope._

## Editorial profile

_No scene-change data — likely a static/screen-recorded source._

_Not applicable — this clip starts mid-page by design; the hook microscope was disabled._

## Quotable moments

Long, even, unhurried scroll with no reveal choreography; visual interest comes from per-section ambient loops rather than entrance animation.

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

* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0001.jpg` (t=00:00)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0002.jpg` (t=00:02)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0003.jpg` (t=00:04)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0004.jpg` (t=00:06)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0005.jpg` (t=00:07)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0006.jpg` (t=00:09)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0007.jpg` (t=00:11)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0008.jpg` (t=00:13)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0009.jpg` (t=00:15)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0010.jpg` (t=00:17)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0011.jpg` (t=00:18)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0012.jpg` (t=00:20)
* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0013.jpg` (t=00:22)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0014.jpg` (t=00:24)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0015.jpg` (t=00:26)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0016.jpg` (t=00:28)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0017.jpg` (t=00:29)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0018.jpg` (t=00:31)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0019.jpg` (t=00:33)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0020.jpg` (t=00:35)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0021.jpg` (t=00:37)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0022.jpg` (t=00:39)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0023.jpg` (t=00:40)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0024.jpg` (t=00:42)
* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0025.jpg` (t=00:44)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0026.jpg` (t=00:46)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0027.jpg` (t=00:48)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0028.jpg` (t=00:50)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0029.jpg` (t=00:51)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0030.jpg` (t=00:53)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0031.jpg` (t=00:55)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0032.jpg` (t=00:57)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0033.jpg` (t=00:59)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0034.jpg` (t=01:01)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0035.jpg` (t=01:02)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0036.jpg` (t=01:04)
* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0037.jpg` (t=01:06)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0038.jpg` (t=01:08)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0039.jpg` (t=01:10)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0040.jpg` (t=01:12)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0041.jpg` (t=01:13)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0042.jpg` (t=01:15)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0043.jpg` (t=01:17)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0044.jpg` (t=01:19)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0045.jpg` (t=01:21)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0046.jpg` (t=01:23)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0047.jpg` (t=01:24)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0048.jpg` (t=01:26)
* `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0049.jpg` (t=01:28)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0050.jpg` (t=01:30)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0051.jpg` (t=01:32)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0052.jpg` (t=01:34)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0053.jpg` (t=01:35)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0054.jpg` (t=01:37)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0055.jpg` (t=01:39)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0056.jpg` (t=01:41)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0057.jpg` (t=01:43)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0058.jpg` (t=01:45)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0059.jpg` (t=01:46)
  `/private/tmp/claude-502/-Users-ltmas--claude/9790783b-4d8f-43a2-b6ac-835ce54347d1/scratchpad/watch-scroll/frames/frame_0060.jpg` (t=01:48)
