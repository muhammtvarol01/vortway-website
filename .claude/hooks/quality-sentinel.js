#!/usr/bin/env node
/**
 * VORTWAY WEBSITE · Quality Sentinel
 * ──────────────────────────────────
 * PostToolUse hook. After every successful Write / Edit, parse-checks
 * the file. If the file no longer parses, surfaces the error to the
 * agent so it fixes the breakage BEFORE telling the user the work is
 * done — instead of after, when the user reloads the browser and sees
 * a blank page.
 *
 * Coverage:
 *   .js / .mjs / .cjs   →  new Function(content)  (catches syntax errors)
 *   .html / .htm        →  extract every inline <script>, parse-check each
 *   .json               →  JSON.parse
 *   .css                →  brace balance check (cheap structural sanity)
 *
 * Every check appends to .claude/hooks/quality-audit.log so you have
 * a permanent ledger of every save and its outcome.
 */

const fs = require('fs');
const path = require('path');

let event;
try {
  event = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const filePath = event.tool_input && event.tool_input.file_path;
if (!filePath || !fs.existsSync(filePath)) process.exit(0);

const ext = path.extname(filePath).toLowerCase();
const projectRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const logDir = path.join(projectRoot, '.claude', 'hooks');
try { fs.mkdirSync(logDir, { recursive: true }); } catch {}
const logPath = path.join(logDir, 'quality-audit.log');

function log(level, msg) {
  const line = `${new Date().toISOString()} [${level.padEnd(4)}] ${path.basename(filePath)} · ${msg}\n`;
  try { fs.appendFileSync(logPath, line); } catch {}
}

function fail(msg) {
  log('FAIL', msg);
  process.stderr.write(`⚙️  Quality Sentinel · PARSE ERROR · ${msg}\n`);
  process.stderr.write(`    File: ${filePath}\n`);
  process.stderr.write(`    Fix the syntax before claiming the change is done.\n`);
  process.exit(2);
}

function ok(msg) { log('OK', msg); process.exit(0); }

let content;
try { content = fs.readFileSync(filePath, 'utf8'); }
catch (e) { log('SKIP', 'unreadable: ' + e.message); process.exit(0); }

if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
  // Strip shebang line before parsing.
  const sanitized = content.replace(/^#![^\r\n]*\r?\n/, '');
  try {
    new Function(sanitized);
    ok(`JS parse OK · ${content.length} bytes`);
  } catch (e) {
    if (/import statement|Unexpected token 'export'|import\.meta|Cannot use import/i.test(e.message)) {
      log('SKIP', 'ESM module — parser cannot validate top-level import/export; rely on bundler/runtime');
      process.exit(0);
    }
    fail(`JS syntax error: ${e.message}`);
  }
}

if (ext === '.html' || ext === '.htm') {
  // Capture the opening-tag attributes (group 1) so we can read `type=` and skip non-JS blocks.
  // JSON-LD, importmaps, and template scripts are data, not JavaScript — parse-checking them as JS is wrong.
  const re = /<script\b(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
  const JS_TYPES = /^(text\/javascript|application\/javascript|application\/ecmascript|module)$/i;
  let m, idx = 0, parsed = 0, skipped = 0;
  const errors = [];
  while ((m = re.exec(content))) {
    idx++;
    const typeMatch = m[1].match(/\btype\s*=\s*["']([^"']+)["']/i);
    const scriptType = typeMatch ? typeMatch[1].trim() : '';
    if (scriptType && !JS_TYPES.test(scriptType)) {
      skipped++;
      continue; // e.g. application/ld+json, importmap, text/template — not JS
    }
    parsed++;
    try { new Function(m[2]); }
    catch (e) {
      const lineNo = content.slice(0, m.index).split('\n').length;
      errors.push(`script #${idx} (HTML line ~${lineNo}): ${e.message}`);
    }
  }
  if (errors.length) fail(`inline-script parse error(s) — ${errors.join(' | ')}`);
  ok(`HTML inline scripts parsed · ${parsed} JS block(s) clean${skipped ? `, ${skipped} non-JS skipped` : ''}`);
}

if (ext === '.json') {
  try { JSON.parse(content); ok('JSON valid'); }
  catch (e) { fail(`JSON parse error: ${e.message}`); }
}

if (ext === '.css') {
  const opens  = (content.match(/\{/g) || []).length;
  const closes = (content.match(/\}/g) || []).length;
  if (opens !== closes) fail(`CSS bracket mismatch: ${opens} '{' vs ${closes} '}'`);
  ok(`CSS brackets balanced (${opens})`);
}

// Other extensions: skip silently (markdown, txt, sql, etc.)
log('SKIP', `extension ${ext || '(none)'} not checked`);
process.exit(0);
