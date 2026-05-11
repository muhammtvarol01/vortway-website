#!/usr/bin/env node
/**
 * VORTWAY WEBSITE · Mission Control
 * ─────────────────────────────────
 * Three-phase session-state guardian:
 *
 *   SessionStart       — read memory/active_task.md; if a task is IN
 *                        PROGRESS, inject its first 35 lines into the
 *                        agent's context so resume is automatic.
 *
 *   Stop               — append a session-tail snapshot (timestamp +
 *                        git status) to memory/.session-tail.md so
 *                        every session ends with a recoverable record.
 *
 *   UserPromptSubmit   — scan the prompt for token-pressure trigger
 *                        phrases ("tokens running out", "freeze the
 *                        mission", "continue from where you stopped",
 *                        "before limit ends"). If matched, inject an
 *                        emergency-protocol reminder telling the agent
 *                        to flush state to the journal IMMEDIATELY
 *                        before doing more work.
 *
 * The phase is passed as argv[2]: "start" | "stop" | (default: prompt).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// Website project memory dir (canonical — Claude Code's own scheme)
const WEBSITE_MEMORY = 'C:/Users/muham/.claude/projects/c--Users-muham-Desktop-Vortway-Logo-website/memory';
const journalPath     = path.join(WEBSITE_MEMORY, 'active_task.md');
const sessionTailPath = path.join(WEBSITE_MEMORY, '.session-tail.md');

const phase = process.argv[2] || 'prompt';

let event = {};
try { event = JSON.parse(fs.readFileSync(0, 'utf8')); } catch {}

// ─── git snapshot helper ─────────────────────────────────────────────
function gitSnapshot() {
  try {
    const status = execSync(`git -C "${projectRoot}" status --short`, {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    const branch = execSync(`git -C "${projectRoot}" rev-parse --abbrev-ref HEAD`, {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    const lastCommit = execSync(`git -C "${projectRoot}" log -1 --pretty=format:"%h %s"`, {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    return { status: status || '(clean)', branch, lastCommit };
  } catch {
    return { status: '(git unavailable — website is not a git repo)', branch: '', lastCommit: '' };
  }
}

// ─── token-pressure trigger phrases ──────────────────────────────────
const TRIGGER_PHRASES = [
  /\btoken[s]?\s+(?:going to (?:end|run out)|running (?:low|out)|left|remaining)/i,
  /\bcontext\s+(?:limit|window|running out)/i,
  /\bcredit[s]?\s+(?:going to (?:end|run out)|running (?:low|out)|left|remaining)/i,
  /\b(?:freeze|save) (?:the )?(?:mission|progress|state|step|task)/i,
  /\bcontinue (?:from |after )?(?:where (?:you|we) (?:left|stopped)|interrupt|refresh|renew)/i,
  /\bdo not miss (?:the )?(?:previous|in[- ]flight)? ?(?:job|task|step|work)/i,
  /\bbefore (?:tokens?|context|credit|limit)s? (?:end|run out|expire|hit)/i,
  /\bonly\s+\d+\s*%\s+(?:of\s+)?(?:tokens?|credits?|usage)/i,
];

// ─── Phase: SessionStart ─────────────────────────────────────────────
if (phase === 'start') {
  if (!fs.existsSync(journalPath)) process.exit(0);
  const journal = fs.readFileSync(journalPath, 'utf8');
  const isInProgress = /Status:\s*IN PROGRESS/i.test(journal);
  if (!isInProgress) process.exit(0);

  const head = journal.split('\n').slice(0, 35).join('\n');
  const ctx = [
    '🎯 MISSION CONTROL · resume protocol activated',
    '',
    'active_task.md is IN PROGRESS. Read the journal first; do NOT start',
    'fresh work until you confirm with the user that the previous task is',
    'either complete or being deliberately abandoned.',
    '',
    '── First 35 lines of active_task.md ──',
    head,
    '────────────────────────────────────────',
    'Continue from the next unchecked sub-step in the checklist above.',
  ].join('\n');

  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: ctx,
    },
  }));
  process.exit(0);
}

// ─── Phase: Stop ─────────────────────────────────────────────────────
if (phase === 'stop') {
  const snap = gitSnapshot();
  const stamp = new Date().toISOString();
  const lines = [
    '',
    `── session ended ${stamp} ──`,
    `branch:      ${snap.branch}`,
    `last commit: ${snap.lastCommit}`,
    `working tree:`,
    snap.status.split('\n').map(l => '  ' + l).join('\n'),
    '',
  ].join('\n');
  try {
    fs.mkdirSync(path.dirname(sessionTailPath), { recursive: true });
    fs.appendFileSync(sessionTailPath, lines);
  } catch {}
  process.exit(0);
}

// ─── Phase: UserPromptSubmit (default) ───────────────────────────────
const prompt = event.prompt || '';
const matched = TRIGGER_PHRASES.some(re => re.test(prompt));
if (!matched) process.exit(0);

const snap = gitSnapshot();
const reminder = [
  '🚨 MISSION CONTROL · token-pressure phrase detected in user prompt.',
  '',
  'EMERGENCY PROTOCOL — execute in this order:',
  '',
  `  1. Update ${journalPath}`,
  '     RIGHT NOW with: current sub-step status, exact file paths + line',
  '     ranges of in-flight edits, the next concrete action.',
  '  2. Pick the SMALLEST atomic next action that leaves the codebase in',
  '     a parseable, ship-ready state. Avoid starting any multi-step',
  '     refactor that cannot be rolled back to "done" in one tool call.',
  '  3. After each save, journal again. Never let the journal lag the',
  '     working tree by more than one edit when token pressure is on.',
  '',
  '── Git state snapshot for resume ──',
  `branch:      ${snap.branch}`,
  `last commit: ${snap.lastCommit}`,
  `working tree:`,
  snap.status.split('\n').map(l => '  ' + l).join('\n'),
].join('\n');

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'UserPromptSubmit',
    additionalContext: reminder,
  },
}));
process.exit(0);
