# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, dependency-free presentation site ("Technopark Design Options" / SB Redesign Options) that shows before/after architectural redesign options for several spaces, built for a client. No build step, no framework, no package manager — plain HTML, one CSS file, one JS file. Deployed via GitHub Pages.

This is a **client deliverable**, not the reusable starting point. The reusable version of this presentation pattern (slide-scroll engine, compare-slider, design system) lives in the separate template project at `../Presentation Template` — pull improvements from there rather than reinventing them here, and port genuinely reusable fixes back to the template when found.

## Running locally

No build or test tooling. Serve the folder over HTTP (opening `file://` breaks relative asset paths and scroll behavior):

```powershell
python -m http.server 5500
# or
npx serve .
```

A preview config also exists at `.claude/launch.json` (`static-preview`) for the Claude Code preview tools; it uses `autoPort` since port 5500 is often taken by other sessions.

## Architecture

**Page structure.** `index.html` is the cover + menu; each space has its own top-level page (`atrium.html`, `canteen.html`, `congress-hall.html`, `congress-hall-lobby.html`). Every space page follows the same skeleton: a fixed `.back-btn`, a fixed `.option-dots` nav (one `.dot` per design option), a `.hero` slide (original proposal), a series of `.option-slide` slides (one per design option), and a `.closing` slide that returns to the menu. All pages share `css/style.css` and `js/script.js`.

**Slide navigation is fully custom.** `js/script.js` overrides normal scrolling: `wheel`, `keydown` (arrows/page keys), and `.scroll-cue` clicks are all intercepted and translated into a single animated snap to the next/previous `.slide` via `animateScrollTo` (with an `isAnimating` lock and a `safetyRelease` timeout that prevents the lock from sticking if `requestAnimationFrame` stalls). CSS scroll-snap (`scroll-snap-type: y mandatory` on `html`, `.slide { scroll-snap-align }`) is a secondary layer. The `.option-dots` are wired to jump to specific `.option-slide`s and highlight the active one on scroll.

**Greening slider (Atrium only).** The Atrium's Design Option 1 is a special `.greening-slide`: a `.greening-stack` holds 5 stacked, absolutely-positioned images that the `.greening-slider` crossfades between, with "magnetism" that snaps to a staged image on release so it never rests on a mid-blend. This is the client-specific instance of the template's generic compare-slider pattern.

**Styling conventions.** Everything is driven by CSS custom properties in `:root` (dark theme, `--accent` gold `#cda86e`). Reuse these variables rather than hardcoding colors. Visual language: full-bleed image + bottom scrim gradient + bottom-left caption (`.hero-media` / `.hero-scrim` / `.hero-caption`).

## Image asset pipeline

- `Original Images/` and `Design Options/` are **source/working** assets (human-named, e.g. `Design Options/Congress Hall/3.png`). Not referenced by any HTML.
- `images/` holds the **web copies** with kebab-case names the pages actually load (e.g. `images/congress-hall-option-3.png`, `images/atrium-greening/1.png`).

When adding or changing a design option, place the file in `images/` with the naming scheme the HTML expects and update the corresponding `<img>` in that space's page. The number of `.option-slide`s must match the number of `.dot`s in `.option-dots`.

## Notes

- `.claude/` is gitignored.
- The `main` branch is deployed; there is a `backup-before-congress-hall-slider` branch preserving an earlier Congress Hall design. The Congress Hall slider approach was tried and reverted back to 5 separate option slides — check git log before reworking that page.
