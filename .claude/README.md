# `.claude/` — Vortway Website Claude Code Setup

This folder contains the Claude Code infrastructure for the Vortway marketing website. It is committed alongside the codebase so every session — yours, a teammate's, a future agent's — runs with the same hooks, agents, and permissions.

## Layout

```
.claude/
├── README.md                      ← you are here
├── settings.json                  ← hook wiring + auto-allowed dev commands
├── settings.local.json            ← machine-local permission overrides (not synced)
├── hooks/
│   ├── security-sentinel.js       ← PreToolUse  — blocks secrets + destructive bash
│   ├── quality-sentinel.js        ← PostToolUse — parse-checks every save
│   ├── mission-control.js         ← Session lifecycle + token-pressure trigger
│   └── quality-audit.log          ← (generated) per-save audit ledger
└── agents/                        ← project-level agent overrides
    ├── brand-guardian.md
    ├── a11y-auditor.md
    ├── seo-auditor.md
    ├── animation-tuner.md
    ├── copy-editor.md
    ├── i18n-linter.md             ← overrides the 10-locale operational-app version
    ├── compliance-auditor.md      ← overrides the EU-logistics version
    ├── legal-page-builder.md      ← drafts terms/cookies/imprint sibling pages
    ├── css-architect.md           ← token discipline + structural hygiene
    ├── deploy-prepper.md          ← pre-launch checklist
    ├── forms-engineer.md          ← Formspree + validation + anti-spam
    └── content-strategist.md      ← IA + content briefs (read-only planner)
```

## Hooks

### security-sentinel.js (PreToolUse · Write/Edit/Bash)

Refuses to proceed when:
- The target path matches `.env`, `*.pem`, `id_rsa`, `credentials.json`, etc.
- The new content contains a recognized secret pattern (AWS, Stripe, GitHub, OpenAI, Anthropic, Slack, JWT, SSH/PGP private keys, generic `API_KEY=<hex>`)
- The Bash command is destructive (`rm -rf /`, `git push --force`, `git reset --hard`, `chmod 777`, `curl … | sh`, fork bombs, `dd of=/dev/sd*`, etc.)

On block: exit 2 + clear stderr explanation.

### quality-sentinel.js (PostToolUse · Write/Edit)

Parse-checks every saved file:
- `.js`/`.mjs`/`.cjs` → `new Function(content)` (catches syntax errors; ESM modules with top-level `import` are skipped — bundler/runtime catches those)
- `.html` → extracts every inline `<script>` block and parses each
- `.json` → `JSON.parse`
- `.css` → bracket balance check

Logs every check to `quality-audit.log`. Exits 2 on parse failure so the agent fixes the breakage before claiming the change is done.

### mission-control.js (SessionStart / Stop / UserPromptSubmit)

Three phases:

| Phase | What it does |
|---|---|
| `SessionStart` | Reads `memory/active_task.md`. If `Status: IN PROGRESS`, injects first 35 lines into the agent context so resume is automatic. |
| `Stop` | Appends timestamp + git status + last commit to `memory/.session-tail.md`. |
| `UserPromptSubmit` | Scans the user's prompt for token-pressure phrases ("tokens running out", "freeze the mission", etc.). If matched, injects emergency protocol: flush state to journal, take smallest atomic next action. |

Memory directory: `C:\Users\muham\.claude\projects\c--Users-muham-Desktop-Vortway-Logo-website\memory\`.

## Agents

The `~/.claude/agents/` global roster (orchestrator, researcher, coder, reviewer, ui-tester, security-auditor, performance-profiler, doc-writer, release-manager) is fully available. The project-level `.claude/agents/` here adds ten marketing-site specialists and overrides two for project-specific scope:

| Agent | Purpose | When to use |
|---|---|---|
| **brand-guardian** | Enforces gold/dark palette + Cinzel/Montserrat | Before accepting any CSS/UI change |
| **a11y-auditor** | WCAG 2.1 AA + EN 301 549 review | After modal/form/animation changes |
| **seo-auditor** | Meta tags, JSON-LD, sitemap, hreflang, OG | Before content launches |
| **animation-tuner** | GSAP + ScrollTrigger + Globe.gl perf | When user reports lag or before merging animations |
| **copy-editor** | B2B logistics voice + cross-locale consistency | After translation changes |
| **i18n-linter** *(override)* | 7-locale `translations.js` coverage check | After UI text changes |
| **compliance-auditor** *(override)* | GDPR + ePrivacy + VDAI for marketing site | Before form / cookie / privacy work |
| **legal-page-builder** | Drafts legal sibling pages (terms.html, cookies.html, imprint.html, 404.html) following the privacy.html pattern | When a new legal/sibling page is needed |
| **css-architect** | Token discipline, magic-number hunting, dead-rule detection, !important audit | Before merging non-trivial CSS or when style.css feels bloated |
| **deploy-prepper** | Pre-launch checklist — strips dev artifacts, verifies links, kills mailto: placeholders, checks CDN pinning + SRI | Before first production deploy + every release after |
| **forms-engineer** | Formspree wiring, client validation, honeypot + Turnstile, GDPR consent UX, mailto fallback | When implementing real form submission (Priority 1.1) |
| **content-strategist** | IA decisions, page outlines, content gap analysis, FAQ + blog topic sequencing | When planning new content pages (Priority 4) or considering site expansion |

Project-level agents take precedence over user-level ones with the same name.

## Permissions (settings.json `allow`)

Auto-approved (no permission prompt):
- `python -m http.server` / `py -m http.server` — local dev server
- `npx http-server` / `npx serve` — alternates
- `node -e`, `node -v` — quick scripts
- `curl http://localhost:*` — local-only health checks
- Playwright MCP browser tools — for `ui-tester`

Anything else still prompts. Hooks always run.

## Memory directory

Outside the project tree, at `C:\Users\muham\.claude\projects\c--Users-muham-Desktop-Vortway-Logo-website\memory\`:

- `MEMORY.md` — index, always loaded into agent context
- `project_overview.md`, `user_profile.md`, `plan_reference.md`, `tooling_setup.md` — semantic memory chunks
- `active_task.md` — journal for in-progress work; Mission Control reads this on session start
- `.session-tail.md` — auto-appended at session end

Memory is per-machine, not committed. Don't put it in git.

## How to invoke an agent

Just describe what you want. The main session picks the right agent. Examples:

- *"Audit the new modal for a11y"* → `a11y-auditor`
- *"Did I break the brand?"* → `brand-guardian`
- *"Why is the globe section laggy?"* → `animation-tuner`
- *"Are the LT translations natural?"* → `copy-editor` then human native-speaker review
- *"Is this GDPR-safe?"* → `compliance-auditor`

Or specify directly: *"Use the seo-auditor to check the new about page."*

## Troubleshooting

- **Hook isn't firing** → Verify `node` is on PATH. The hooks shell out to Node 18+.
- **Agent not found** → Run `claude /agents` to see the merged roster.
- **Brand violation slipped through** → Run `brand-guardian` after the fact. Hooks don't enforce brand — only parse correctness and security.
- **`active_task.md` not loading on resume** → It only loads when `Status: IN PROGRESS` literally appears in the file. Otherwise `mission-control.js` exits silently.
- **Quality audit log getting big** → It's append-only. Truncate or rotate manually if needed; not committed.

## Adding a new agent

1. Drop `<name>.md` in `.claude/agents/` (project-level) or `~/.claude/agents/` (global).
2. Frontmatter must include `name`, `description`, `tools` (comma-separated allowlist), `model` (sonnet/opus/haiku).
3. Body is the system prompt. Be specific about workflow + report format.
4. No registration step; auto-discovered next session.

Project-level wins over global if names collide.
