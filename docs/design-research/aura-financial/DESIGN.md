# Aura Financial — Design System Spec

Extracted from <https://aura-financial-paid.aura.build/> on 2026-08-11 for **internal design
reference**. Every value here traces to a raw dump in `raw/` (126/126 tokens verified). Every rule
carries its derivation and its counterexample count — rules violated more than ~10% of the time were
downgraded to observations rather than asserted.

> **Scope note.** The source is a commercial template (`aura-financial-*paid*`); what is sold _is_
> the design. This document captures the **system** — ratios, rhythm, motion bands, copy shape — which
> is what transfers. It deliberately contains no verbatim marketing copy, no logos, and no imagery.
> Treat it as a study, not a drop-in skin for a client site.

---

## 0. How to use this document

1. Copy `tokens.css` into your project and `@import` it.
2. Read **§1 Rules** before anything else. The values in §3–§10 are a vocabulary; §1 is the grammar.
   A rebuild using the right tokens and the wrong rules will not look like this design.
3. Scaffold with **§2 Grid**, then build components from **§8**.
4. For anything that moves, read **§9** and **§10a** together — §9 is the CSS layer, §10a is the
   WebGL field. §10a is measured from the live site; treat it, not §10's sourcing note, as the
   description of the background.
5. Before shipping, read **§13 Accessibility** — this template has two defects you must **fix**, not
   inherit.

**What this design is.** A near-black institutional fintech surface with a single sky-blue accent, a
living WebGL field behind the hero, and a hard three-way split of typographic labour: _italic serif_
for display, _sans_ for reading, _uppercase tracked mono_ for machine labels. It reads as
"instrument panel for serious money" — precise, dark, quietly in motion.

> **Refinement (2026-08-31).** "Behind everything" is true but misleading. The canvas is
> `position: fixed` at viewport rows 0–900 and never moves; the sections in front are
> semi-transparent veils, so the field reads at full strength in the hero and at a faint 9–25%
> wash for the rest of the page. It is not hero-only, and it is not full-strength throughout.
> Measured in **§10a**.

---

## 1. Rules & design principles

These are derived mechanically from `raw/census-*.json` and `raw/section-anatomy.json`, then
falsified against the same data. `raw/derived-rules.json` holds the full evidence.

| #   | Rule                                                                                                                                                                                                                                           | Support / violations   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| R1  | **One ink, alpha-graded.** Text hierarchy is white at 1.0 / .9 / .8 / .7 / .6 / .5 / .4 / .3 / .2 — never distinct grey hues. The only non-white inks are the accent and near-black on light fills.                                            | 365 / 19 (4.9%)        |
| R2  | **One accent, ~9% of colour signatures.** `#38BDF8` is the _only_ non-neutral hue on the page. It is spent on: active state, data values, icons, the featured pricing tier, and links. Never as a large fill.                                  | 46 of 493 sigs         |
| R3  | **Depth without shadow.** Elevation is 1px translucent border + `backdrop-filter` blur + accent glow. Only 4 real box-shadows exist page-wide (nav lift, CTA inset ring, button hover, inset accent glow).                                     | 79 / 6 (7.1%)          |
| R4  | **Serif is always italic.** Newsreader appears only in italic, and only for display headlines and prices. Every italic element is serif; every serif element is italic.                                                                        | 15 / 1 (6.2%)          |
| R5  | **Tracking is role-keyed in three bands.** Sans display/UI tightens to `-0.025em`; small sans labels sit at `+0.025em`; uppercase mono micro-labels open to `+0.05em … +0.2em`. The wide band is _always_ paired with uppercase + mono.        | 61 / 0                 |
| R6  | **Leading is inverse to size.** Display sets solid (1.0–1.2); body sets loose (1.5–1.625). The 1.333–1.429 band belongs to small UI text only.                                                                                                 | 376 / 0                |
| R7  | **Weight range is 300–600.** 400 default, 500 for UI/nav, 300 reserved for large lede text, 600 only on buttons and card titles. 700 is effectively unused (1 element page-wide).                                                              | 371 / 1 (0.3%)         |
| R8  | **Constant section rhythm.** Every content `<section>` is `128px` top _and_ bottom at desktop. Rhythm is never tuned per section.                                                                                                              | 7 / 0                  |
| R9  | **Sections separate by hairline + alpha, never by gap.** A 1px `rgba(255,255,255,0.05)` top border plus a change in background alpha over the WebGL field. No shadows, no spacer elements, no dividers between sections.                       | 8 / 0                  |
| R10 | **Pill by default.** `9999px` is the shape for anything interactive or label-like (72 of 110 radius signatures). Rectangles use a 4/8/12/16/24/32 ladder; 32px is reserved for top-level cards.                                                | 108 / 3 (2.7%)         |
| R11 | **Tiny, named layer stack.** −10 background canvas · 0 grid overlay · 10 all content · 20 in-section overlays · 50 nav. Nothing exceeds 50.                                                                                                    | 56 / 0                 |
| R12 | **Three motion bands by element scale.** 150ms colour/text · 300ms components · 500ms cards/panels · 700ms–1s images. One easing curve everywhere (`cubic-bezier(0.4,0,0.2,1)`) except the hero CTA.                                           | 57 / 4 (6.6%)          |
| R13 | **Motion is ambient, not scroll-triggered.** DOM element count is _identical_ before and after a full-page scroll (879 = 879). There are no reveal animations and no IntersectionObserver. Instead 42 infinite CSS animations run perpetually. | 42 infinite / 0 finite |
| R14 | **Type steps, never flows.** Zero `clamp()`, zero `vw` font sizes. The ramp steps at breakpoints, so display type is identical at 1440 and 1920.                                                                                               | 0 clamp                |
| R15 | **All photography is monochrome.** Every photographic image carries `grayscale(1)` and most also `mix-blend-mode: luminosity`. Colour in imagery is surrendered entirely so the single accent stays the only hue.                              | 8 / 0 images           |

### Rules that failed falsification

Recorded because a wrong rule is worse than no rule:

- _"Tracking is bipolar — tight or wide, nothing between."_ Falsified at **31%**. The `+0.025em`
  middle band is real (12 signatures, small sans labels). R5 is the corrected three-band form.
- _Not a rule: optical alignment._ Display headings measure `deltaLeft = 0` against their container
  padding box at every size — this design applies **no** optical overhang correction. Do not add one.

---

## 2. Grid, container & breakpoints

```
container      1280px  (max-w-7xl), centred
gutter         24px mobile → 48px from lg
section rhythm 128px top and bottom
```

| Breakpoint | px   | Uses in source |
| ---------- | ---- | -------------- |
| `sm`       | 640  | 7              |
| `md`       | 768  | 19             |
| `lg`       | 1024 | **82**         |
| `xl`       | 1280 | 0              |
| `2xl`      | 1536 | 0              |

**The layout is final at 1024px.** `xl` and `2xl` are never used, so beyond `lg` the design only
centres inside its 1280px container. Capturing or designing at 1920 tells you nothing new.

The responsive move is almost always the same one: `flex-col` → `lg:flex-row`, and `grid-cols-1` →
`lg:grid-cols-2|3`. Mobile is a single stacked column at 24px gutters.

**Measure ladder** for text blocks: 384 / 448 / 576 / 672 / 768 / 1024px. Centred intro paragraphs
use 672px; hero lede uses 448px.

---

## 3. Colour & contrast

### Surfaces (the near-black ladder)

| Token                      | Value     | Use                         |
| -------------------------- | --------- | --------------------------- |
| `--color-surface-page`     | `#030303` | Page background             |
| `--color-surface-raised`   | `#050505` | Raised panel                |
| `--color-surface-panel`    | `#080808` | Testimonial / content cards |
| `--color-surface-inset`    | `#0a0a0a` | Inset wells inside cards    |
| `--color-surface-elevated` | `#151515` | Floating chips              |

Sections alternate **translucency**, not colour: `bg-black/50` → `#030303/80` → `#030303/50` →
solid `#030303`. Translucent sections carry `backdrop-blur`, letting the WebGL field bleed through;
solid sections block it entirely and act as visual rests. The stats band and footer are the two
solid ones.

### Veils (translucent white fills)

`0.02 · 0.03 · 0.04 · 0.05 · 0.06 · 0.10 · 0.20` — these are the card and control fills. There is no
opaque light surface anywhere except white buttons.

### Ink ladder (R1)

| Alpha | Role                | Contrast on `#030303`     |
| ----- | ------------------- | ------------------------- |
| 1.0   | Headings, primary   | **20.62** ✅ AAA          |
| 0.9   | Emphasised body     | **16.49** ✅ AAA          |
| 0.8   | Body                | **12.92** ✅ AAA          |
| 0.7   | Secondary body      | **9.88** ✅ AAA           |
| 0.6   | Muted body          | **7.06** ✅ AAA           |
| 0.5   | Tertiary / nav rest | **4.74** ✅ AA            |
| 0.4   | Micro-labels        | **3.47** ⚠️ AA-large only |
| 0.3   | Decorative          | **2.50** ❌ fails         |
| 0.2   | Rules, dots         | **1.69** ❌ fails         |

### Accent

`--color-accent: #38BDF8` with `deep: #0ea5e9` for gradients. Alphas .9/.6/.3/.2/.1/.05.
Contrast **9.63** on page background ✅ AAA. Black on accent: **9.63** ✅.

### Borders

`section 0.05` · `component 0.1` · `hover 0.2` · `accent 0.3`. A 1px border at 5–10% white is the
single most-repeated device in the entire design (61 signatures).

Full matrix: `raw/derived-rules.json → contrastMatrix`.

---

## 4. Typography

Three families, three jobs — this split is the design's clearest signature.

| Role           | Family                 | Weights            | Style                       |
| -------------- | ---------------------- | ------------------ | --------------------------- |
| Display        | **Newsreader** (serif) | 300, 400           | **always italic** (R4)      |
| UI & body      | **Inter** (sans)       | 300, 400, 500, 600 | normal                      |
| Machine labels | system **mono** stack  | 400                | **uppercase, tracked wide** |

> The other four families in the page source (Google Sans Flex, Oswald, DM Sans, Cormorant) are
> injected by the aura.build platform and report `status: unloaded`. They are **not** part of this
> design — do not carry them over.

### Ramp (px, stepped — R14)

`10 · 12 · 14 · 16 · 18 · 20 · 24 · 30 · 36 · 48 · 60 · 72`

Successive ratios sit at **1.111–1.25** through the text range, then jump **1.333** from 36 → 48.
That gap is deliberate: there is a _body_ world (≤36) and a _display_ world (60/72) with nothing
in between. Reproduce the gap or the design loses its voice.

`8px` and `9px` appear once each on micro-badges — one-offs, not rungs.

### Responsive steps (measured, not guessed)

Because there is no fluid type (R14), display sizes step at breakpoints. Largest sizes actually
rendered per viewport:

| Viewport   | 375    | 768 | 1024   | 1440 |
| ---------- | ------ | --- | ------ | ---- |
| Hero h1    | **48** | 60  | **72** | 72   |
| Section h2 | 36     | 48  | 60     | 60   |
| Card title | 24     | 24  | 24     | 24   |

The pattern is `text-5xl → md:text-6xl → lg:text-7xl` for h1 and `text-4xl → md:text-5xl →
lg:text-6xl` for h2. **Body and UI sizes never change** — only display type steps. 1440 and 1920 are
identical.

### Pairing per role

| Role           | Size          | Family       | Weight  | Leading | Tracking                     |
| -------------- | ------------- | ------------ | ------- | ------- | ---------------------------- |
| Display h1/h2  | 72 (60 at md) | serif italic | 300–400 | 1.0–1.1 | −0.025em                     |
| Section h3     | 36            | serif italic | 400     | 1.111   | —                            |
| Card title     | 24            | sans         | 600     | 1.2     | −0.025em                     |
| Lede           | 20–24         | sans         | **300** | 1.625   | —                            |
| Body           | 16            | sans         | 400     | 1.5     | —                            |
| UI / nav       | 14            | sans         | 500     | 1.429   | —                            |
| Small          | 12            | sans         | 400–500 | 1.333   | +0.025em                     |
| **Mono label** | 10–12         | mono         | 400     | 1.333   | **+0.1 … +0.2em**, uppercase |

### The two-tone headline

The recurring display device: one headline, split mid-phrase into full-white and `~0.4` white, both
italic serif. _"Banking intelligence"_ bright, _"made effortless."_ faded. It is used on nearly every
section heading and is the single cheapest way to reproduce the house voice.

### Text glow

`--shadow-text-glow: 0 0 25px rgba(56,189,248,0.4)` applied to accent-coloured display type only
(`.text-glow`). Used on the hero h1's accent half.

---

## 5. Spacing & rhythm

Base unit **4px**. Scale in use:

`2 · 4 · 6 · 8 · 10 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64 · 80 · 96 · 128`

| Context                 | Value                              |
| ----------------------- | ---------------------------------- |
| Section padding block   | **128** (R8)                       |
| Gutter                  | 24 → 48 at `lg`                    |
| Card padding            | 28 (testimonial) · 24–32 (feature) |
| Grid gap, cards         | 24–32                              |
| Grid gap, major columns | 80–96                              |
| Stack gap, controls     | 8 · 12                             |
| Heading → body          | 24–32                              |
| Body → CTA              | 40–48                              |

**Section rhythm does not scale between mobile and desktop** — 128px holds at every breakpoint.
The mobile compression happens in the _gutter_ (48→24) and in column stacking, not the vertical
rhythm. This is unusual and worth keeping: it is why the mobile layout still feels expensive.

---

## 6. Surfaces, borders & micro-details

**Radius** (R10): `4 · 8 · 12 · 16 · 24 · 32 · full`.
`full` = anything interactive or label-like. `32` = top-level cards. `16` = testimonial cards and
inner wells. `12` = FAQ rows. The only off-ladder radii are the deliberately asymmetric chat bubbles
(`2px 16px 16px` / `16px 2px 16px 16px`) — a speech-tail effect.

**Border**: 1px everywhere; 2px only on the hero CTA.

**Backdrop blur** — the real depth mechanism (R3):

| Token       | Value | Use                        |
| ----------- | ----- | -------------------------- |
| `--blur-sm` | 4px   | Inline chips               |
| `--blur-md` | 12px  | Chat bubbles, small panels |
| `--blur-lg` | 24px  | **Nav**, most sections     |
| `--blur-xl` | 64px  | The features section       |

**Shadows** — only four exist:

- `--shadow-nav` — a **6-stop** stacked shadow (2.8px → 100px, alpha .034 → .12). This physically-
  graduated stack is what makes the floating nav pill read as genuinely above the page. Reproduce
  all six stops; a single `0 10px 30px` does not look the same.
- `--shadow-button-hover` — `0 4px 20px rgba(0,0,0,0.5)`
- `--shadow-cta-ring` — `inset 0 0 0 1px #1a1818`
- `--shadow-accent-glow` — `inset 0 -1ex 2rem 4px #0ea5e9`

**Selection**: `::selection` → background `#38BDF8`, text `#000`. A small detail that carries the
accent into an interaction almost nobody styles.

**Dividers**: 1px `rgba(255,255,255,0.05–0.1)` borders. No `<hr>`, no gradient rules.

---

## 7. Iconography & imagery

**Icons** — [Iconify](https://iconify.design), two sets:

- `solar:*-bold-duotone` for all UI icons — a duotone style where the secondary shape sits at
  `opacity: .5`. This duotone treatment is a real signature; a plain outline set will read differently.
- `logos:*` for third-party brand marks.

Sizes cluster hard: **16px** (23 uses) · 24px (9) · 32px (4) · 14px. Stroke-width **1.5** dominant.
Icon-to-adjacent-text ratio is ~1:1 with the text's font-size. Icons inherit the ink ladder or take
the accent; they are never a third colour.

**Imagery (R15)** — the strictest rule in the system:

| Property         | Value                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| `filter`         | `grayscale(1)`, sometimes `contrast(1.25) grayscale(1)`                                            |
| `mix-blend-mode` | `luminosity` on editorial images                                                                   |
| `object-fit`     | `cover`                                                                                            |
| Avatars          | 40×40, `rounded-full`, `grayscale(1)`                                                              |
| Logo wall        | `grayscale(100%) brightness(150%) contrast(0.5)`, `opacity .5` → `1` + `brightness(200%)` on hover |

Every photograph is desaturated to monochrome. **The accent is the only hue in the entire design.**
When sourcing new assets: composition and luminance are all that matter, because colour will be
stripped.

---

## 8. Components

### Nav — floating pill

`position: fixed`, `top: 24px`, centred, `rounded-full`, `z-50`. `bg-gradient-to-br from-white/10
to-white/0`, `ring-1 ring-white/10`, `backdrop-blur-lg`, plus `--shadow-nav`. Padding `6px 6px 6px
16px` — asymmetric, because the right side holds a pill button that supplies its own padding.
Hover raises the ring to `white/20`. Links: 12–14px, weight 500, ink 0.5 → 1.0 on hover, 150ms.

### Buttons

| Variant         | Fill                                 | Text      | Radius | Padding   | Use                 |
| --------------- | ------------------------------------ | --------- | ------ | --------- | ------------------- |
| Primary (hero)  | `.shiny-cta` — animated conic border | white 500 | full   | 20px 40px | One per page        |
| Primary (solid) | white                                | `#030303` | full   | 14px 32px | Section CTAs        |
| Accent          | `#38BDF8`                            | `#030303` | full   | 14px 32px | In-panel actions    |
| Secondary       | `white/5` + 1px `white/10`           | ink 0.8   | full   | 12px 24px | Paired with primary |
| Ghost icon      | transparent, 1px border              | ink 0.6   | full   | 40×40     | Card corners        |

Hover changes **border-colour and background only** — plus `scale(1.02)` on cards. No shadow
appears on hover except the one button variant. `:active` → `translateY(1px)`.

**Nav responsive behaviour**: `width: 100%; max-width: 90vw` on mobile, `width: max-content` from
`lg`. The links are **hidden below `md`** — on mobile the pill carries only the logo and the CTA.
There is no hamburger and no mobile menu in this design. Omitting this produces horizontal overflow
at 375px.

> **Cascade trap.** When a button lives inside the nav, the nav-link colour rule will out-specify
> the button's own colour and render the label invisibly (white-on-white). Scope nav-link colour to
> `nav a:not(.btn)`. Found only by building — see `_starter/SPEC-HOLES.md` #4.

### Stat block

Figure in **italic serif** at `--text-6xl`, weight 300, leading solid. Any unit or symbol (`%`,
`µs`, `/mo`) drops **out** of italic into sans at `--text-xl` and ink 0.5 — the figure is display
type, the unit is not. Label beneath at `--space-3`, uppercase mono, ink 0.6. Laid out
`grid-cols-2` → `lg:grid-cols-4`.

### Table / data display

Not present in the source; derived from the ink ladder and hairline convention, and validated in
the starter:

| Part         | Treatment                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| `<th>`       | uppercase mono, `--text-xs`, `+0.1em`, ink 0.6, weight 400, 1px `white/0.1` bottom border            |
| `<td>`       | `--text-sm`, ink 0.8, 1px `white/0.05` bottom border, 16px padding                                   |
| Numeric cell | mono, `font-variant-numeric: tabular-nums`, **accent** — figures are data, and data takes the accent |
| Row hover    | background → `white/[0.02]`, 150ms                                                                   |

### Hero

Not a token, but a consistent convention: the hero is a tall standalone region (`min-h-[1100px]` in
the source, ~820px is enough without a diagram), outside the `<section>` rhythm and carrying **no**
top border — it sits directly on the WebGL field.

### The hero CTA (`.shiny-cta`) — the set piece

The most elaborate object in the design, worth reproducing carefully:

- Four **registered custom properties** (`@property --gradient-angle`, `--gradient-angle-offset`,
  `--gradient-percent`, `--gradient-shine`) so the gradient angle is _animatable_ — plain custom
  properties cannot be transitioned.
- Border painted with `conic-gradient(...) border-box` over a `linear-gradient(#030303,#030303)
padding-box`, spinning via `border-spin 2.5s linear infinite`.
- `::before` — a dot-grid (`radial-gradient` 0.5px dots, `background-repeat: space`) masked by a
  rotating conic gradient, `opacity .4`.
- `::after` — a `linear-gradient(-50deg, transparent, #0ea5e9, transparent)` sweep masked to the
  bottom, `shimmer 4s linear infinite`.
- `span::before` — an inset accent glow that `breathe`s (scale 1 → 1.2) over 4.5s.
- Transition on the custom properties themselves at 800ms `cubic-bezier(0.25,1,0.5,1)`.

### Cards

| Type        | Radius | Padding | Fill           | Border                           |
| ----------- | ------ | ------- | -------------- | -------------------------------- |
| Feature     | 32     | 24–32   | `white/[0.02]` | 1px `white/10`                   |
| Pricing     | 32     | 32      | `white/[0.02]` | 1px `white/10`; featured: accent |
| Testimonial | 16     | 28      | `#080808`      | 1px `white/10`                   |
| FAQ row     | 12     | 32/16   | transparent    | 1px bottom                       |

**Staggered grid.** In the 3-card feature and pricing rows the **middle card is offset upward** and
rendered slightly brighter. That asymmetry is deliberate and is what stops the grid reading as a
generic three-up.

**Featured-tier marking** uses exactly three signals at once: accent border, a white `PRO` pill
badge, and a solid-white `+` button where siblings have ghost buttons. One accent per card (R2).

### Badge / pill / eyebrow

Uppercase mono, 10–12px, `+0.1…0.2em` tracking, ink 0.4 or accent, often with a leading 6–8px
accent dot. The section eyebrow additionally wraps in a `rounded-full` 1px `white/10` bordered pill.

### Status dots

6 / 8 / 11 / 15px circles. Accent = live, `white/0.2–0.4` = inactive. Frequently wrapped in an
`animate-ping` halo.

### Forms — **not derivable**

The template contains **zero** `<input>`, `<textarea>` and `<select>` elements. Input, label, helper
and error styling **cannot** be extracted from this source and must be authored. Suggested starting
point consistent with the system: `white/[0.02]` fill, 1px `white/10` border, `full` or `12px`
radius, 12px/24px padding, ink 0.8 text, ink 0.4 placeholder, accent border on focus **plus a
visible focus ring** (see §13).

---

## 9. Motion & interaction states

### Transition bands (R12)

| Token                  | Value  | Applies to                            |
| ---------------------- | ------ | ------------------------------------- |
| `--duration-micro`     | 150ms  | Text/icon colour, nav links (26 sigs) |
| `--duration-component` | 300ms  | Nav, buttons, borders (12 sigs)       |
| `--duration-card`      | 500ms  | Cards, panels, spotlight (13 sigs)    |
| `--duration-slow`      | 700ms  | Large decorative elements             |
| `--duration-image`     | 1000ms | Image scale on hover                  |

Easing is **one curve**: `cubic-bezier(0.4, 0, 0.2, 1)` (53 signatures). The hero CTA is the single
exception at `cubic-bezier(0.25, 1, 0.5, 1)`.

### Ambient animation (R13)

There are **no scroll reveals**. Instead, 42 infinite animations run continuously — the page is
never visually still:

Verified against live playback on 2026-08-31 via `document.getAnimations()`: **42 total, 42
infinite, 0 finite, 42 running, 0 paused.** R13 confirmed exactly. The `count` column is the number
of live instances — it was never recorded before, and it is what tells you which rhythms actually
dominate the page.

| Keyframe               | Duration (observed)             | Count | Role                                          |
| ---------------------- | ------------------------------- | ----- | --------------------------------------------- |
| `beam`                 | 3s ×6, **4s ×1**                | 7     | SVG path draw, `stroke-dashoffset 1000 → 0`   |
| `pulse`                | 2s ×6, **1.5s ×1**              | 7     | Live indicators                               |
| `spin` / `spin-slow`   | 12s / 15s / 20s ×2 / 30s ×2 / 40s | 8   | Concentric orbit rings in diagrams            |
| `ping`                 | 1s ×4, 3s ×1, 4s ×1             | 6     | Status-dot halos                              |
| `sonar-wave`           | 3s                              | 3     | Radar pulse, `r: 10px → 80px`, opacity .8 → 0 |
| `marquee` / `-reverse` | 60s                             | 3     | Logo wall, opposing directions                |
| `border-spin`          | 2.5s                            | 2     | CTA conic border                              |
| `shimmer`              | 4s                              | 2     | CTA sweep                                     |
| `breathe`              | 4.5s                            | 2     | CTA glow, scale 1 → 1.2                       |
| `bounce`               | **1s ×1, 4s ×1**                | 2     | Draggable affordance                          |

Corrections the static CSS read got wrong (bold above): `pulse` also runs at **1.5s**, `beam` also
at **4s**, and `bounce` — previously logged as `—` — runs at **1s and 4s**. `beam` and `pulse` tie
as the most-instanced rhythms at 7 each.

**Effect-level easing on all 42 is `linear`.** The `--ease-*` tokens in `tokens.css` govern
*transitions*, not these keyframes — do not apply them to ambient loops.

The slow orbits (15–40s) are the key to the "instrument panel" feel: motion that is clearly alive
but too slow to distract.

**Scroll behaviour**: `scroll-behavior: smooth` on `<html>`. No snap, no sticky sections, no
scroll-jacking library. Note that the scroll container is the **`about:srcdoc` iframe**
(`scrollHeight` 9177px), not the top document — the top document is a fixed 900px shell.

### Interaction states

| State        | Treatment                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------- |
| Hover, link  | ink 0.5 → 1.0, 150ms                                                                      |
| Hover, card  | border `white/10 → white/20` or accent/30; bg `white/[0.02] → [0.04–0.06]`; `scale(1.02)` |
| Hover, image | `scale`, 1s                                                                               |
| Hover, logo  | opacity .5 → 1, brightness 150% → 200%                                                    |
| Active       | `translateY(1px)`                                                                         |
| **Focus**    | **none — see §13**                                                                        |
| Disabled     | dimmed to ink 0.3 with an `×` glyph replacing the accent `✓`                              |

#### Hover vocabulary (added 2026-08-31)

The resolved-style census in `raw/census-*.json` records **default** computed styles, so it was
structurally blind to hover. Counted from `raw/template-source.html`: **41 distinct `hover:`
utilities** plus a parallel `group-hover:` set. Full inventory in
`raw/motion-observed.json → interaction_states`.

| Utility                     | Uses | Utility                     | Uses |
| --------------------------- | ---- | --------------------------- | ---- |
| `hover:grayscale-0`         | 18   | `hover:text-brand-sky/50`   | 14   |
| `hover:bg-white/[0.02]`     | 18   | `hover:border-white/20`     | 8    |
| `hover:border-brand-sky/30` | 16   | `hover:translate-x-0.5`     | 5    |
| `hover:text-brand-sky`      | 15   | `hover:bg-brand-sky`        | 5    |
| `hover:opacity-100`         | 15   | `hover:rotate-90`           | 4    |
| `hover:text-white`          | 14   | `hover:scale-110` / `-105`  | 3+3  |

`group-hover:` mirrors it for compound cards — `group-hover:text-brand-sky/50` (14),
`group-hover:grayscale-0` (14), `group-hover:opacity-100` (13), `group-hover:rotate-90` (4). The
dominant idiom is **a whole card lighting up together**, not individually hoverable children.

**Transition budget** — `transition-colors` 68 · `transition-all` 47 · `transition-transform` 14 ·
`transition-opacity` 14, at `duration-300` (47) · `duration-500` (16) · `duration-700` (3) ·
`duration-1000` (3). These map exactly onto `--duration-component / card / slow / image`.
**No hover utility uses 150ms**, so `--duration-micro` is never exercised by a hover — it applies
only to the link-ink transition above.

#### Three interactions worth copying

1. **The logo marquee pauses on hover** — `hover:[animation-play-state:paused]`. Verified live:
   the track's animation went `running` (t=370950ms) → `paused` (t=371066ms) → still frozen at
   371066ms after 1.6s → `running` (t=372350ms) on mouse-out. A 60s marquee that stops when you try
   to read it, at zero JS cost.
2. **Shimmer accelerates on hover** — `hover:animate-[shimmer_1.5s_infinite]` against a 4s base: a
   2.7× speed-up that reads as the element becoming eager.
3. **The accordion is CSS-only** — `hover:h-auto` drives disclosure with no JS toggle.

---

## 10. Background, texture & what CSS cannot reproduce

Three stacked layers behind all content:

1. **WebGL field** — `z-index: -10`, `position: fixed`, full viewport. A **Unicorn Studio** scene
   (`data-us-project="FixNvEwvWwbu3QX9qC3F"`, `unicornstudio.js v1.4.29` from jsDelivr) rendering a
   2160×1350 `webgl2` canvas at 1440×900 (dpi 1.5, 60fps target). Masked with
   `linear-gradient(transparent, black 0%, black 80%, transparent)` so it fades out at the page foot.
   Fully characterised in **§10a** below — that section is the observed record; this is just the
   stacking position.
2. **Grid overlay** — `z-index: 0`, `position: fixed`. 100×200px grid of 1px `rgba(255,255,255,0.03)`
   lines, masked by `radial-gradient(circle at center, black 40%, transparent 100%)` so it is only
   visible in the middle of the viewport. Pure CSS, fully reproducible.
3. **Per-section grids** — `rgba(255,255,255,0.02)` at 1px, masked `radial-gradient(at 50% 0%, black
40%, transparent)`.

Plus a radial accent glow from the Tailwind config:
`radial-gradient(circle at 70% 50%, rgba(56,189,248,0.25) 0%, rgba(5,5,5,0) 60%)`.

Section-level blend modes: `soft-light`, `screen`, `overlay` on decorative wash layers;
`luminosity` on photography.

### ⚠️ Not reproducible with CSS alone

**The defining background is a third-party WebGL shader.** No token set reproduces it. A rebuild
needs one of:

- its own Unicorn Studio scene (account + project ID required),
- a hand-written WebGL/shader canvas,
- an animated mesh-gradient approximation (closest pure-CSS option), or
- a looping muted video.

This is also why live and locally-served captures of the hero differ: the shader animates
continuously and `animations: 'disabled'` does not affect canvas rendering. Both renders are
correct, just different frames.

Everything else in the design — every colour, type, spacing, border, blur, and CSS animation — is
fully reproducible from `tokens.css`.

---

## 10a. The WebGL field, observed

> Added 2026-08-31. The 2026-08-11 pass documented this field only as a **sourcing problem** and
> recorded nothing about what it looks like or does. `raw/probes.json` reported `canvas: 0` because
> the probe read the **top document**, while the whole template — canvas included — lives inside an
> `about:srcdoc` iframe; the capture session also drove a locally-served copy on `:8899`. This
> section is the empirical record. Evidence: `raw/motion-observed.json`, `raw/unicorn-scene.json`,
> `motion/frames/hero-shader-*.jpg`.

### What it looks like

A single large **amorphous vortex** — a soft luminous loop with a dark core — drifting across the
hero, rendered through a **halftone dot-matrix**. The dithering is a real texture, not a CSS
overlay: the scene's top layer is a `glyphDither` effect sampling
`assets.unicorn.studio/media/glyphs/squares.png`, which is what gives every bright region its
visible square-pixel grain (clearest in `motion/frames/hero-shader-t0003.jpg`).

### Two independent timescales

| Timescale     | Period                          | What moves                                                                                  |
| ------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| **Fast pulse**| **2.85s**                       | Whole-field brightness breathing. Mean luma 36.3, swinging 30.6 → 48.4 (a 1.58× swing).     |
| **Macro morph**| ~30–60s, **non-repeating**     | The vortex grows to fill the viewport, then recedes to a small dark lens. Noise-driven.     |

The 2.85s figure is measured, not authored: 20 luminance peaks spanning t=0.5s → 57.5s across a
60s canvas-only capture at 2 Hz → `(57.5 − 0.5) / 20 = 2.85s`. Full series in
`raw/motion-observed.json → shader_pulse`.

The macro morph never loops cleanly — layer 12 is a `noise` effect at `speed: 0.37`, so the
silhouette is a continuous random walk. **Do not budget for a loop point.** Compare
`hero-shader-t0003.jpg` and `t0057.jpg` (near-peak, viewport-filling) against `t0022.jpg` and
`t0042.jpg` (receded to a dark lens) — 20s apart and structurally unrecognisable.

### Palette — and why it does not match the accent token

Sampled from the brightest 8% of canvas pixels:

| Role                  | Observed   |
| --------------------- | ---------- |
| Core cyan             | `#00A8C0` — `#00C0C0` |
| Mid blue              | `#0090C0`  |
| Wash blue             | `#3078C0`  |
| Dim blue              | `#004878`  |
| Mean bright, at peak  | `#25AED0`  |
| Mean bright, receded  | `#39789E`  |

> **The shader is measurably more teal than the design system's accent.** `--color-accent` is
> `#38BDF8` (sky-400, hue ≈ 199°); the shader's core sits at `#00A8C0`–`#00C0C0` (hue ≈ 187–190°,
> and far more saturated in green). **A CSS substitute keyed only to `#38BDF8` will read visibly
> bluer and flatter than the original.** Any approximation should push toward cyan for the glow core
> and reserve `#38BDF8` for the UI accent it actually governs.
>
> Authored colours inside the compiled shaders are `#0081F7` (beam layer 8) and `#459AFF` (beam
> layer 6) — both bluer than what renders, because the `glyphDither` and `blur` passes shift the
> composite toward cyan. Two other `vec3` literals (`#4C961D`, `#36B612`) are **luma coefficient
> vectors**, not colours.

### Layer stack (from `raw/unicorn-scene.json`)

14 layers. Scene format `1.4.36` run by runtime `v1.4.29`; `fps: 60`, `dpi: 1.5`, `scale: 1`.

| #  | Type          | Parameters                                        |
| -- | ------------- | ------------------------------------------------- |
| 0  | `gradient`    | `speed: 0.25`, `downSample: 0.5`, `isBackground`  |
| 1  | `rectangle`   | shape "Border", `strokeWidth: 10`                 |
| 2  | `rectangle`   | shape "sha"                                       |
| 3  | `diffuse`     | `speed: 0`, animating                             |
| 4  | `rectangle`   | shape "Bram no blend" — main composite, 4 children|
| 5  | `text`        | a single `.` glyph, Inter 10px, `blendMode: OVERLAY` |
| 6  | `beam`        | `speed: 0.43`                                     |
| 7  | `beam`        | `speed: 0.43`                                     |
| 8  | `beam`        | `speed: 0.2`, animating, `pos: (0.5, 0.5)`        |
| 9  | `replicate`   | `speed: 0.5`                                      |
| 10 | `replicate`   | `speed: 0.5`                                      |
| 11 | `blur`        | separable 2-pass, `downSample: 0.25`              |
| 12 | `noise`       | `speed: 0.37`, animating — **drives the morph**   |
| 13 | `glyphDither` | halftone via `glyphs/squares.png` — **the grain** |

### It does not react to anything

| Input      | Verdict  | Evidence                                                                              |
| ---------- | -------- | ------------------------------------------------------------------------------------- |
| **Cursor** | **None** | `trackMouse: 0` and `mouseMomentum: 0` on all 14 layers. A/B test: canvas sampled one pulse period apart, mouse parked vs mouse sweeping — within-condition change was **10.27** parked vs **9.79** sweeping, ranges fully overlapping. Sweeping the cursor changes nothing. |
| **Scroll** | **None** | The canvas is `position: fixed` (wrapper `.aura-background-component`, `top-0 h-screen -z-10`) and renders identically regardless of scroll offset. |

What *reads* as scroll response is **attenuation**, not repainting. The canvas is fixed at viewport
rows 0–900 forever; what changes is how much of it the sections in front let through. Those sections
are **semi-transparent veils, not opaque covers** — `rgba(0,0,0,0.5)`, `rgba(3,3,3,0.8)`,
`rgba(3,3,3,0.5)` — and only section 6 (`25k-active-institutions-worldwide`, page-y 5420) is a
solid `rgb(3,3,3)`.

Measured by screenshotting each scroll position twice, once with the canvas visible and once with
`visibility: hidden`, and taking the luminance of the difference:

| Scroll position     | Shader contribution (YAVG) | vs hero |
| ------------------- | -------------------------- | ------- |
| Hero (y = 0)        | **19.02**                  | 100%    |
| y = 1600 (section 2)| 4.69                       | 25%     |
| y = 3000 (section 3)| 1.74                       | 9%      |
| y = 6000 (section 6)| 2.07                       | 11%     |

Noise floor for this method is **0.04** (two captures 0.4s apart with the shader off in both), so
every figure above is real signal, not measurement drift.

> **Do not read this as "hero-only".** An earlier draft of this section said the field was fully
> occluded below the hero; the measurement refutes that. The field keeps contributing a faint
> 9–25% wash all the way down the page, which is part of why the lower sections do not read as flat
> black despite being near-black. The visible *hard edge* in
> `motion/frames/scroll-field-occlusion-t0022.jpg` is the veil boundary, not the end of the field.

**Consequence for a rebuild:** most of the shader's visual value is in the hero, but a substitute
that hard-stops at the hero boundary will make the rest of the page flatter than the original. Carry
a faint version of the field — or an equivalent low-alpha wash — behind the whole page.

---

## 11. Section blueprints

10 top-level regions. Slugs are the exact join key shared by `raw/section-anatomy.json`, the
screenshot filenames (`screens/{slug}-{375,1440}.png`), and this table.

| #   | Slug                                                | Height | Background            | Blur     | Anatomy                                                                                                        |
| --- | --------------------------------------------------- | ------ | --------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| 0   | `nav-0`                                             | 44     | gradient `white/10→0` | 24px     | Floating pill, logo + 3 links + CTA                                                                            |
| 1   | `architect-your-wealth-with-absolute-prec`          | 1100   | transparent           | —        | Hero. Two-column: left copy, right SVG instrument diagram (orbit rings + sonar + beam paths). `min-h-[1100px]` |
| 2   | `banking-intelligence-made-effortless`              | 1380   | `black/50`            | **64px** | Eyebrow pill → two-tone h2 → centred lede → 3 staggered feature cards with inset product-UI mockups → pill CTA |
| 3   | `the-modern-investor-doesn-t-fit-in-a-sin`          | 1116   | `#030303/80`          | 24px     | Split feature, monochrome editorial image                                                                      |
| 4   | `liquidate-exchange-global-assets-instant`          | 915    | `#030303/50`          | 24px     | Exchange UI showcase                                                                                           |
| 5   | `scale-your-market-exposure` (`#pricing`)           | 909    | `#030303/50`          | 24px     | Two-tone h2 → monthly/annual pill toggle → 3 tiers, middle featured                                            |
| 6   | `25k-active-institutions-worldwide`                 | 1585   | solid `#030303`       | —        | Stats band + testimonial grid + logo marquee. **Solid — a visual rest**                                        |
| 7   | `protocol-specifications-decoded-for-clar` (`#faq`) | 977    | `#030303/50`          | 24px     | Accordion, 12px radius rows, 1px bottom borders                                                                |
| 8   | `uncertain-about-your-allocation-strategy`          | 761    | `#030303/80`          | 24px     | Closing CTA. **Contains the page's only large solid-accent fill**: a 1280×504 `bg-brand-sky` (`#38BDF8`) panel at `rounded-[32px]`, page-y 8111. The section background is dark; the panel inside it is the single brightest moment on the page. See `motion/frames/scroll-cta-panel-t0106.jpg`. |
| 9   | `footer-9`                                          | 434    | solid `#030303`       | —        | 48px padding (not 128) — the one rhythm exception                                                              |

The alternation `translucent → translucent → solid → translucent → solid` is the page's breathing
pattern: the WebGL field shows through, then is blocked, then shows through again.

---

## 12. Copy voice & content shape

Rules, not sentences — the transferable part.

| Slot    | Shape                                                            |
| ------- | ---------------------------------------------------------------- |
| h1      | **6 words**, sentence case, ends in a period                     |
| h2      | median **5 words** (range 4–23), sentence case, ends in a period |
| h3      | median **2 words**                                               |
| Eyebrow | 1–3 words, **UPPERCASE**, mono, tracked, often with a status dot |
| Lede    | ~20–25 words, one or two sentences                               |
| Body    | median ~30 words                                                 |
| CTA     | **2–3 words**, verb-first                                        |

**Voice.** Second person is largely absent; the register is institutional and mechanical. CTA verbs
are deliberately technical rather than commercial — _Initialize_, _Start Engine_, _View Ecosystem_,
_Explore_, _Consult_ — never "Sign up free" or "Get started today". Nouns skew to infrastructure:
protocol, throughput, latency, clearance, allocation, custody.

Numerals are set in the mono face inside data contexts, and in **italic serif** for prices and
display figures. The unit always drops out of italic: `$299` is serif italic, `/mo` is sans at
`--text-sm` and ink 0.5. Same for `99.99%` and `840µs` — figure display, unit not. Metric labels are
uppercase mono. Tabular figures (`font-variant-numeric: tabular-nums`) in any column of numbers.

Headlines split two-tone (see §4) — the emphasis half carries the concept, the faded half carries
the verb or qualifier.

---

## 13. Accessibility — **two defects to fix, not inherit**

| Issue                      | Finding                                                                                                                                                                                | Severity                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Focus invisible**        | The _only_ focus rule in the entire generated stylesheet is `.focus\:outline-none:focus { outline: transparent solid 2px }`. There is no replacement ring anywhere, across 16 buttons. | **WCAG 2.1 SC 2.4.7 failure — must fix**             |
| **No reduced-motion path** | Zero `prefers-reduced-motion` rules while 42 infinite animations run perpetually.                                                                                                      | **WCAG 2.1 SC 2.3.3 / vestibular safety — must fix** |
| Low-contrast inks          | ink 0.3 (2.50), 0.2 (1.69), 0.1 (1.21) fail AA-large. Decorative-only in the source.                                                                                                   | Use with care                                        |
| ink 0.4                    | 3.47 — passes AA-large only; it is used for 12px mono labels, i.e. below the large-text threshold.                                                                                     | Borderline                                           |

Minimum remediation when reusing:

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: inherit;
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Never use ink ≤0.3 for text. Promote 12px mono labels from ink 0.4 to 0.6 (7.06, AAA).

---

## 14. Reuse & adaptation notes

**What makes this design feel the way it does** — ranked by how much each contributes, and how
cheap it is to reproduce:

| Signature                                   | Cost          | Notes                                            |
| ------------------------------------------- | ------------- | ------------------------------------------------ |
| Italic serif display against sans body (R4) | Free          | The single highest-impact move                   |
| One ink alpha-graded (R1)                   | Free          | Replaces an entire grey palette                  |
| Uppercase tracked mono micro-labels (R5)    | Free          | What makes it read "instrument", not "marketing" |
| Border + blur instead of shadow (R3)        | Free          |                                                  |
| Single accent at ~9% (R2)                   | Free          | Discipline, not technique                        |
| Monochrome imagery (R15)                    | Free          | One CSS filter                                   |
| Two-tone headlines (§4)                     | Free          |                                                  |
| Constant 128px rhythm (R8)                  | Free          |                                                  |
| Slow ambient orbits, 15–40s (R13)           | Cheap         | CSS only                                         |
| Staggered middle card (§8)                  | Cheap         |                                                  |
| 6-stop nav shadow (§6)                      | Cheap         | Copy all six stops                               |
| `.shiny-cta` (§8)                           | Moderate      | Needs `@property` support                        |
| **WebGL background (§10, §10a)**            | **Expensive** | Third-party or substitute. Target cyan `#00A8C0` (not the `#38BDF8` accent), a 2.85s brightness pulse, and a **non-repeating** morph; skip cursor tracking, the original has none. Full strength in the hero, a faint 9–25% wash below — do not hard-stop it at the hero edge. |

**To adapt to another brand**, change in this order: the accent hue (one token), the serif display
face (keep it italic), the imagery subject. Keep the ink ladder, the rhythm, the mono labels, and
the border-and-blur depth model — those _are_ the system.

**Do not** port: the copy, the logo, the Unicorn Studio project ID, or the platform-injected font
links (Google Sans Flex, Oswald, DM Sans, Cormorant — all unused).

---

## Provenance

| Artifact                                   | What it holds                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `raw/template-source.html`                 | 168KB authored source, lifted from the page's `srcdoc` iframe — ground truth                               |
| `raw/probes.json`                          | Phase-0 gates: theme mechanism, breakpoints, libraries, overlays                                           |
| `raw/authored-css.json`                    | Recursive CSSOM walk; 24 keyframes, 4 `@property`, 76 state rules; 6 cross-origin sheets fetched Node-side |
| `raw/census-{375,768,1024,1440,1920}.json` | Resolved-style census, initial values filtered, counted by distinct element signature                      |
| `raw/section-anatomy.json`                 | Sections (with slug join key), 31 component clusters, media, icons, optical alignment                      |
| `raw/derived-rules.json`                   | Every rule with support/violation counts + the full contrast matrix                                        |
| `screens/`                                 | 4 full-page + 20 section crops at 375 and 1440                                                             |
| `_starter/index.html`                      | Different-content page built from this spec alone (the acceptance test)                                    |
| `raw/unicorn-scene.json`                   | **(2026-08-31)** The Unicorn Studio scene for `FixNvEwvWwbu3QX9qC3F` — 14-layer stack with per-layer speeds, `trackMouse` flags, and the `glyphDither` texture URL. Compiled GLSL stripped; refetch from the `_provenance.source_url` inside the file. |
| `raw/motion-observed.json`                 | **(2026-08-31)** Observed motion: shader pulse period + luminance series, palette sampling, the 42-animation `getAnimations()` audit, the cursor-reactivity A/B test, and the 41-utility hover census |
| `motion/frames/hero-shader-t{0003,0022,0042,0057}.jpg` | **(2026-08-31)** Canvas-only captures at 1440×900 showing the macro morph at near-peak and receded states |
| `motion/frames/scroll-*.jpg`               | **(2026-08-31)** Field occlusion below the hero, the knowledge-base glow, and the full-bleed CTA panel     |
| `raw/watch-report-{hero,scroll,hover}.md`  | **(2026-08-31)** Per-clip `/watch` analyses of the three screen recordings. Narrative sections are filled; entity/quote sections are marked N/A because the source is a silent screen recording. Source `.webm` files are not committed. |

**Method.** Authored CSS text was treated as ground truth; the computed census as corroborating
evidence, because computed values destroy exactly the authored intent a template needs (`clamp()`
collapses to one number, `var(--accent)` loses its role, unitless line-height resolves to px). The
census counts **distinct element signatures** rather than raw occurrences, so a 40-item card grid
counts as one design decision instead of forty.

**Method — motion pass (2026-08-31).** The static pass could not see motion, and its two blind
spots were structural, not careless:

1. **Wrong document.** Probes read the top document; the entire template — canvas included — lives
   in an `about:srcdoc` iframe. That is why `raw/probes.json` says `canvas: 0` and why every
   library gate reads `false` (Unicorn Studio is loaded by an inline IIFE inside the iframe).
2. **Wrong target.** The capture session drove a locally-served copy on `:8899`, where the shader
   never ran.

The motion pass therefore drove the **live** URL in headed Chrome via `playwright-cli`, confirmed
the canvas was present *and animating* (two screenshots 3s apart differed by YAVG 10.3 on a
difference blend) before recording anything, and then measured rather than described:

- **Shader timing** from a 60s canvas-element capture at 2 Hz, luminance per frame via ffmpeg
  `signalstats`, period derived from peak spacing.
- **Shader parameters** from the scene JSON at
  `storage.googleapis.com/unicornstudio-production/embeds/FixNvEwvWwbu3QX9qC3F`, not from
  eyeballing.
- **Animation inventory** from `document.getAnimations()` on the live page, which both confirmed
  R13's 42/0 split and corrected three durations the keyframe text had wrong.
- **Reactivity** from a controlled A/B (mouse parked vs sweeping, sampled one pulse period apart),
  because a free-running shader makes any two captures differ and a naive before/after diff proves
  nothing.
- **Hover states** from a utility census over the authored source plus a live play-state probe,
  since a resolved-style census is blind to `:hover` by construction.

Video clips (`hero-hold`, `full-scroll`, `hover-pass`) were analysed with the `watch` skill and are
**not committed** — they are large, reproducible, and their findings are captured in
`raw/motion-observed.json` and `motion/frames/`.
