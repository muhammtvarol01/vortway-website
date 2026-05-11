# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# VORTWAY — Marketing Website

Static marketing site for **Vortway Logistics & Solutions** — premium European freight forwarding HQ in Vilnius, Lithuania. This is the public landing page (`vortway.lt`), separate from the Next.js operational app in `../vortway-app/`.

## Stack

- **Vanilla HTML/CSS/JS** — no build step, no bundler, no package.json
- **CDN-loaded libs**: Lucide (icons), Globe.gl 2.28.1 (3D earth, bundles its own Three.js), GSAP 3.12.5 + ScrollTrigger
- **Fonts**: Cinzel (headings), Montserrat (body) — Google Fonts
- **Local dev**: `python -m http.server 8765` from this folder, then http://localhost:8765

## Files

| File | Purpose |
|---|---|
| `index.html` | Single-page structure; sections from hero → contact wrapped in `<main>` |
| `style.css` | All styling for the homepage; uses CSS custom props from `:root` (gold/dark theme) |
| `app.js` | All homepage behavior; one `DOMContentLoaded` callback orchestrates everything |
| `translations.js` | i18n dictionary; 7 locales (en/de/fr/it/lt/tr/es); `data-i18n` keys |
| `privacy.html` | English GDPR Privacy Policy (sibling page, not part of SPA) |
| `privacy.lt.html` | Lithuanian Privacy Policy; linked via `hreflang` and EN/LT toggle |

## Architecture

The homepage is a **single HTML file with no routing** — all sections (hero, services, stats, vision, trust, contact) live in `index.html` and are scrolled to via in-page anchors. There is no SPA framework. State that does exist (current language, testimonial index, modal open/closed) lives in module-scope variables inside the single `DOMContentLoaded` handler at the top of [app.js](app.js).

**Legal pages are siblings, not part of the SPA.** `privacy.html` and `privacy.lt.html` each include their own simplified nav, embed page-specific styles in a `<style>` block (the `.legal-*` classes), and have their own minimal inline `<script>` for navbar scroll + Lucide init. They share `style.css` for the global theme but **do not load `app.js` or `translations.js`** — globe/GSAP/translations are unnecessary and would slow these pages down. Mirror this pattern when adding `terms.html` or any other legal sibling.

**i18n flow**: every user-visible string in `index.html` carries `data-i18n="some_key"`. On page load and on language-button click, `translatePage(lang)` walks `[data-i18n]` and rewrites `innerHTML` from `translations[lang][key]`. The HTML default text is a fallback for the brief moment before JS runs — it should match the EN translation. Legal pages do **not** use `data-i18n`; they are statically translated via separate sibling files instead.

**Globe**: initializes only if `window.Globe` is loaded (defensive). Camera at `lat:50, lng:10, altitude:2`. Auto-rotate on, zoom off, drag-to-spin. Arc data is hardcoded in [app.js](app.js) — 15 European freight corridors anchored on Vilnius.

## Branding rules (IMMUTABLE — never change without explicit user ask)

- **Colors — primary palette**: do not introduce new colors. Tokens are `--bg-dark #030504`, `--gold-primary #D4AF37`, `--gold-secondary #FFC300`, `--border-color #141a17`.
- **Colors — extended palette (declared in `style.css`, ratified by `VORTWAY-BRAND-PLAN.md` Phase 3)**: `--bg-card #080a09`, `--gold-dim #A88645` (large display text only — fails AA on dark for body), `--text-main #ffffff`, `--text-muted #888888`. Use these via `var(--token)` rather than hardcoding hex.
- **Colors — gradient-stop palette (logo SVG only, NOT exposed as CSS tokens)**: `#FFFDF0`, `#B27300`, `#4A2F00`, `#0F0900` — these live inside `<linearGradient>` defs only. Never declare as `style.css` tokens.
- **Colors — print/light-bg-only (asset hexes, NOT in `style.css`)**: `#1a1a1a` (Text Dark) and `#7A5400` (Tagline Dark Gold, AA 7:1 on white) appear ONLY in light-bg variant SVGs (variants 2/4/6/7/8 of the brand asset set) and NEVER on `vortway.lt` digital UI surfaces. These are pre-authorized for print/legal/partner-doc collateral.
- **Banned**: `#C59E5B` ("Gold Warm") — listed historically in old drafts; explicitly removed by `VORTWAY-BRAND-PLAN.md` Phase 3. Any occurrence is a violation.
- **Fonts**: do not swap font families. Cinzel for `h1–h6` + brand text; Montserrat for body and UI. Allowed weights: Cinzel 300/400/600/800, Montserrat 300/400/500/600 — no others without amending the brand plan first.
- **Text content**: do not rewrite copy. Translation files own all user-facing strings via `data-i18n`.
- **Logo**: the SVG (highway path + shield path with `globalGold` gradient + `shield3D`/`highway3D` filters) is canonical — reuse from `<defs>` rather than re-creating.
- **Icons**: use Lucide via `<i data-lucide="...">`. Do not introduce other icon libraries.
- **Visual layout**: do not redesign sections. Adjustments must preserve the existing visual hierarchy.

## Locale coverage

Active: `en, lt, tr, es, it, de, fr` (7).
Missing vs. canonical VORTWAY 10-locale set: `pl, nl, pt` — these were intentionally **not** added; the marketing audience for a Vilnius freight forwarder doesn't justify the maintenance cost. Only add if user explicitly requests.

When you change copy in one locale, sync all 7. The pillar block is the canonical example of what "out of sync" looks like — it had 5 locales lagging EN/TR for a while.

## Conventions

- `data-i18n` attribute on any user-visible text element in [index.html](index.html); `translatePage(lang)` in [app.js](app.js) re-renders. Keep the HTML default text in sync with the EN translation.
- GSAP + ScrollTrigger animate sections on scroll; initial `gsap.set` hides, then ScrollTrigger reveals. Reduced-motion media query in [style.css](style.css) disables animations and particles.
- All homepage event handlers live inside the `DOMContentLoaded` listener at the top of [app.js](app.js). Keep new handlers there too — there is no module system.
- Legal pages: keep their styles in their own `<style>` block (not in `style.css`). They are the only pages allowed to embed CSS, and only for their `.legal-*` namespace.
- Footer: 2-column layout (Navigation + Legal). Privacy Policy → `privacy.html`; Terms of Service and Compliance → `mailto:` placeholders until lawyer-drafted text exists.

## Testing

No automated test suite. Smoke test via Playwright MCP when needed: start the local server, navigate to both `index.html` and `privacy.html`, check console errors (the `favicon.ico` 404 is known and ignorable), verify the language switcher and EN/LT toggle round-trip, scroll the homepage to confirm GSAP reveals fire. 17-point acceptance checklist exists — re-run before shipping any large change.
