# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# VORTWAY — Marketing Website

Static marketing site for **Vortway Logistics & Solutions** — premium European freight forwarding HQ in Kaunas, Lithuania. Public landing page at `vortway.lt`. This folder is its **own git repository** (pushed to `github.com/muhammtvarol01/vortway-website`), separate from the brand-engineering workspace at `..` and the Next.js operational app at `../vortway-app/`. None of those parents travel with this repo.

## Stack

- **Vanilla HTML/CSS/JS** — no build step, no bundler, no `package.json`, no tests.
- **CDN libs (loaded in `index.html`, defer-ordered)**: Lucide (icons, eager), GSAP 3.12.5 + ScrollTrigger, Three.js r134, Vanta.FOG, tsParticles 3.9.1. Three.js is shared between Vanta and the logistics scene — load order matters.
- **Fonts**: Cinzel (headings, 300/400/600/800), Montserrat (body, 300/400/500/600) — Google Fonts. No other families or weights without explicit user ask.

## Dev workflow

```bash
# Run locally
python -m http.server 8765        # from this folder, then http://localhost:8765

# Commit & push after every shippable change
git add . && git commit -m "<type>: <short message>" && git push
```

Commit prefixes used in this repo: `feat:`, `fix:`, `style:`, `ui:`, `refactor:`, `chore:`, `docs:`. Push always goes to `origin/main`.

There is no lint and no test command. UI changes get a Playwright smoke test via the `ui-tester` agent **only when** behavior depends on something that can't be verified statically (form submission, modal state, autocomplete, theme toggle, animations). For pure HTML reorders or text-only edits, grep-verify and skip the smoke test.

## Pages

| File | Purpose |
|---|---|
| `index.html` | The SPA — hero → services → stats → vision → trust → contact, all in-page anchors |
| `about.html`, `services.html`, `terms.html`, `privacy.html`, `privacy.lt.html`, `404.html` | Sibling pages, simplified nav, do NOT load `app.js` / `translations.js` / Vanta / Three.js |
| `style.css` | All shared styling; CSS custom props in `:root` + `[data-theme="light"]` overrides |
| `app.js` | All homepage behavior — one `DOMContentLoaded` callback plus top-level `initFoo()` helpers |
| `translations.js` | i18n dictionary, 7 locales (`en, lt, de, es, fr, it, tr`); keyed by `data-i18n` |
| `icon.svg`, `favicon.svg`, `vortway-logo-horizontal-{dark,light}.svg`, `vortway-mark-flat-gold.svg` | Brand assets (also live in `../vortway-app/public/brand/svg/`; these are sync'd copies) |

## Architecture — things that span multiple files

**Single-page, no router.** All visible sections are in `index.html`. Module-scope state (current language, testimonial index, modal open/closed, selected autocomplete cities) lives in variables inside the `DOMContentLoaded` handler at the top of `app.js`. There is no module system; keep new handlers in that same callback.

**Init layout in `app.js`**: a `DOMContentLoaded` listener runs numbered sections (1. icons → 2. mobile menu → 2.5 theme → 3. language → 3.6 testimonial → 4. smooth scroll → 5. connect → 6. quote modal → 6b. quote calculator engine → 7. contact form → 9. FAQ → 10. cookie banner → 10. preloader). Heavier init helpers — `initVantaFog`, `initHeroDust`, `initThemeToggle`, `initLogisticsScene`, `initCursorDot`, `initMagneticButtons`, `initExtendedSpotlight`, `initButtonRipple`, `initServiceCardTilt` — are top-level functions defined below the listener and called from inside it.

**i18n flow**: every user-visible string in `index.html` carries `data-i18n="some_key"`. `translatePage(lang)` walks `[data-i18n]` and rewrites `innerHTML` from `translations[lang][key]`. HTML default text is the EN fallback during the JS-loading flash — keep it in sync with the EN entry in `translations.js`. Sibling pages (`privacy.html`, etc.) are **statically translated** via separate files; they don't use `data-i18n`.

**Theme system**: `[data-theme="dark"|"light"]` on `<html>`, persisted in `localStorage` under `vortway-theme`. A tiny inline `<script>` in `<head>` reads the saved value BEFORE first paint to prevent FOUC. The toggle button (`#themeToggle`) flips the attribute and calls `window.__vortwayApplyVantaTheme(theme)` to re-init Vanta with the new color config. All theme-conditional CSS lives in a single `[data-theme="light"]` block in `style.css`.

**Quote calculator** (the most logic-heavy feature):
- Origin/Destination use `.quote-autocomplete` comboboxes backed by `EU_CITIES` (54 cities, `{name, country, lat, lng}`) in `app.js`. Selection is stored in `selectedCity.{origin,destination}`.
- Pricing engine: `haversineKm()` → road km = haversine × 1.35 → `max(roadKm × €2.00, €350)` minimum → weight surcharge (per 1000 kg over 5000) + volume surcharge (per m³ over 33) → `× CARGO_MULTIPLIERS` (1.0–1.4) `× SPEED_MULTIPLIERS` (1.0–1.6). All constants are at the top of section 6b.
- Modal DOM: `.modal-overlay > .modal > [.modal-close, .modal-body]`. `.modal` is `display:flex; overflow:hidden`; `.modal-body` holds padding + `overflow-y:auto`. The X button is anchored to `.modal` so it stays visible while the body scrolls. Modal overlay `z-index: 3000` (above the cookie banner at 2500).
- All four close paths (X, overlay click, Escape, in-result CLOSE button) route through `dismissQuoteModal()`, which removes `.active`, clears `documentElement.style.overflow` + `body.style.overflow` (body scroll lock), and calls `resetQuoteModalState()` to wipe form + cities + suggestion DOM + errors.

**Hero atmosphere**: `initVantaFog()` paints animated fog behind `.hero` (re-inits on theme toggle via `window.__vortwayApplyVantaTheme`). `initHeroDust()` adds tsParticles gold dust at `#heroParticles` (no link-lines — only drifting specks). An SMIL-animated SVG watermark of the mark sits behind the hero title (`.hero-mark-bg`) with a `heroMarkAura` keyframe breathing 0→0.24→0.2.

**Vision section**: `initLogisticsScene()` builds a Three.js scene (truck, cargo containers, route tube, particle trail) into `#logisticsCanvas`. It's lazy — boots on `IntersectionObserver` first-intersection, skips heavy geometry on `(max-width: 1024px)` or `prefers-reduced-motion`.

**Sibling pages**: each has its own simplified `<nav>`, its own `<style>` block (only place in the repo allowed to embed CSS, scoped to `.legal-*`), and a minimal inline `<script>` for navbar-scroll + Lucide init. They share `style.css` for global theme but skip `app.js`, `translations.js`, Vanta, and Three.js. Mirror this pattern when adding new legal/info siblings.

## Branding rules (IMMUTABLE — do not change without explicit user ask)

- **Primary palette** (CSS tokens): `--bg-dark #030504`, `--gold-primary #D4AF37`, `--gold-secondary #FFC300`, `--border-color #141a17`.
- **Extended palette** (CSS tokens): `--bg-card #080a09`, `--gold-dim #A88645` (large display only — fails AA on dark for body), `--text-main #ffffff`, `--text-muted #888888`. Use `var(--token)` rather than hardcoding hex.
- **Gradient-stop palette** (SVG `<linearGradient>` defs only — NEVER as CSS tokens): `#FFFDF0`, `#B27300`, `#4A2F00`, `#0F0900`.
- **Light-theme palette** (used only inside `[data-theme="light"]` selectors in `style.css`): `#f8f6f0` (cream bg), `#ffffff` (surface), `#1a1a1a` (text), `#555` (muted text), `#e0ddd5` (border), `#7A5400` (accent gold). These were originally print-only hexes; their use on the digital UI is authorized exclusively for the light theme.
- **Banned**: `#C59E5B` (old "Gold Warm" — pre-removed by `VORTWAY-BRAND-PLAN.md` Phase 3) and `#8c7340` (failed-AA tagline gold). Any occurrence is a violation.
- **Fonts**: Cinzel + Montserrat only. Weights listed in Stack section. No swaps.
- **Text content**: do not rewrite copy. Translation files own all user-facing strings. Adding new labels means adding `data-i18n` keys across all 7 locales.
- **Logo**: the canonical SVG (highway path + shield path with `globalGold` gradient + `shield3D` / `highway3D` filters) lives in `<defs>` at the top of `index.html` and is referenced via `<use>` and CSS `url(#globalGold)`. Reuse — don't re-create.
- **Icons**: Lucide via `<i data-lucide="...">`. No other icon libraries.

## Locale coverage

Active: `en, lt, de, es, fr, it, tr` (7). The language dropdown is ordered EN → LT → alphabetical by translated label. Missing vs. the canonical 10-locale set: `pl, nl, pt` — intentionally omitted (marketing audience doesn't justify maintenance). Only add on explicit user request.

When you change copy in one locale, sync all 7. The pillar block has historically been the canonical out-of-sync example.

## Things that bite

- **CDN load order matters**: Three.js must load before Vanta (which depends on it) and before `initLogisticsScene` runs. All three Vanta/tsParticles/Three.js scripts use `defer` so they execute in document order — don't reorder them in `<head>`.
- **`favicon.ico` 404 in console is known and ignorable** — the site uses `favicon.svg` only. Don't add a .ico without an actual file.
- **`og-image.png` is referenced but missing** — every LinkedIn / WhatsApp share of `vortway.lt` is currently broken. See `../VORTWAY-BRAND-PLAN.md` Phase 5.6.a (in the parent workspace, not in this repo).
- **`scrollIntoView` inside the modal scrolls the page** — when you need to scroll a modal child into view, use `.modal-body.scrollTo({...})` directly. The modal's body-scroll lock prevents drift but `scrollIntoView` ignores it.
- **The cookie banner has `z-index: 2500`** — anything that needs to appear above content (modals, toasts) must be ≥ 3000. The quote modal is at 3000 for this reason.
