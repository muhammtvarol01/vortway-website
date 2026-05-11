#!/usr/bin/env node
/**
 * VORTWAY WEBSITE · Security Sentinel
 * ───────────────────────────────────
 * PreToolUse hook. Runs before every Write / Edit / Bash invocation.
 *
 * Three layers of defense:
 *   1. Path block      — refuses to write to .env, *.pem, id_rsa, etc.
 *   2. Credential scan — pattern-matches known secret formats from
 *                        AWS / Stripe / GitHub / OpenAI / Anthropic /
 *                        Slack / JWT / SSH / PGP plus generic
 *                        API_KEY=<long-hex> assignments.
 *   3. Bash gate       — blocks irreversible commands without explicit
 *                        user confirmation: rm -rf /, git push --force,
 *                        git reset --hard, chmod 777, curl…|sh, etc.
 *
 * Pattern catalog informed by gitleaks/trufflehog/detect-secrets rules.
 *
 * Output protocol (Claude Code hooks):
 *   exit 0  — silent allow
 *   exit 2  — block; stderr message is shown to the agent and the user
 */

const fs = require('fs');

let event;
try {
  event = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  // Malformed input → fail OPEN (don't break the agent on hook bugs)
  process.exit(0);
}

const tool = event.tool_name;
const input = event.tool_input || {};

// ─── 1. Forbidden file paths ─────────────────────────────────────────
const FORBIDDEN_PATHS = [
  /\.env(?:\.[^/\\]+)?$/i,
  /\.pem$/i,
  /(?:^|[\\/])id_rsa(?:\.pub)?$/,
  /(?:^|[\\/])id_ed25519(?:\.pub)?$/,
  /(?:^|[\\/])id_ecdsa(?:\.pub)?$/,
  /\.p12$/i,
  /\.pfx$/i,
  /\.jks$/i,
  /(?:^|[\\/])credentials\.json$/i,
  /\.aws[\\/]credentials$/,
  /(?:^|[\\/])\.netrc$/,
];

// ─── 2. Credential signatures ────────────────────────────────────────
const SECRETS = [
  // Cloud providers
  { name: 'AWS Access Key',          re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'AWS Secret (assignment)', re: /aws[_\s-]?secret[_\s-]?(?:access[_\s-]?)?key[\s\S]{0,8}["']?[A-Za-z0-9/+=]{40}["']?/i },
  { name: 'GCP Service Account',     re: /"type"\s*:\s*"service_account"/ },
  { name: 'Azure Storage Key',       re: /AccountKey=[A-Za-z0-9+/=]{86}/ },
  // Payment / SaaS
  { name: 'Stripe Live Key',         re: /\bsk_live_[0-9a-zA-Z]{24,}\b/ },
  { name: 'Stripe Test Key',         re: /\bsk_test_[0-9a-zA-Z]{24,}\b/ },
  { name: 'Stripe Restricted',       re: /\brk_(?:live|test)_[0-9a-zA-Z]{24,}\b/ },
  { name: 'Twilio API Key',          re: /\bSK[a-z0-9]{32}\b/ },
  { name: 'SendGrid Key',            re: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/ },
  { name: 'Mailgun Key',             re: /\bkey-[0-9a-zA-Z]{32}\b/ },
  // Code-host / VCS
  { name: 'GitHub PAT',              re: /\bghp_[A-Za-z0-9]{36}\b/ },
  { name: 'GitHub OAuth',            re: /\bgho_[A-Za-z0-9]{36}\b/ },
  { name: 'GitHub App Token',        re: /\bghs_[A-Za-z0-9]{36}\b/ },
  { name: 'GitHub Refresh Token',    re: /\bghr_[A-Za-z0-9]{36}\b/ },
  { name: 'GitLab PAT',              re: /\bglpat-[A-Za-z0-9_-]{20,}\b/ },
  // AI providers
  { name: 'OpenAI Project Key',      re: /\bsk-proj-[A-Za-z0-9_-]{40,}\b/ },
  { name: 'OpenAI Classic Key',      re: /\bsk-[A-Za-z0-9]{20,}T3BlbkFJ[A-Za-z0-9]{20,}\b/ },
  { name: 'Anthropic API Key',       re: /\bsk-ant-(?:api\d+|admin\d+)-[A-Za-z0-9_-]{50,}\b/ },
  // Chat platforms
  { name: 'Slack Bot Token',         re: /\bxoxb-[0-9]{10,}-[0-9]{10,}-[A-Za-z0-9]{24,}\b/ },
  { name: 'Slack User Token',        re: /\bxoxp-[0-9]{10,}-[0-9]{10,}-[0-9]{10,}-[A-Za-z0-9]{32,}\b/ },
  { name: 'Slack Webhook URL',       re: /\bhttps:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+\b/ },
  { name: 'Discord Bot Token',       re: /\b[MNO][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27,}\b/ },
  // Generic crypto material
  { name: 'JWT Token',               re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: 'SSH Private Key',         re: /-----BEGIN (?:RSA|DSA|EC|OPENSSH|PRIVATE) (?:PRIVATE )?KEY-----/ },
  { name: 'PGP Private Key',         re: /-----BEGIN PGP PRIVATE KEY BLOCK-----/ },
  // Generic high-entropy near sensitive var names
  { name: 'API_KEY=<hex64>',         re: /\b(?:API_KEY|API_TOKEN|SECRET_KEY|AUTH_TOKEN|ACCESS_TOKEN|PRIVATE_KEY)\s*[:=]\s*["']?[A-Fa-f0-9]{32,}["']?/i },
  { name: 'secret/token=<hex40+>',   re: /\b(?:secret|token|password|passwd|apikey)\s*[:=]\s*["']?[A-Fa-f0-9]{40,}["']?/i },
];

// ─── 3. Dangerous bash commands ──────────────────────────────────────
const BASH_BLOCKLIST = [
  { name: 'rm -rf on home',          re: /\brm\s+(?:-[a-zA-Z]*[rRf][a-zA-Z]*\s+)+(?:\$HOME|~|\$\{HOME\})(?:\/|\s|$)/ },
  { name: 'rm -rf on root',          re: /\brm\s+(?:-[a-zA-Z]*[rRf][a-zA-Z]*\s+)+\/(?:\s|$|\*)/ },
  { name: 'rm -rf on /c (Windows)',  re: /\brm\s+(?:-[a-zA-Z]*[rRf][a-zA-Z]*\s+)+\/c\/(?:\s|$|Users)/ },
  { name: 'force-push to remote',    re: /\bgit\s+push\s+(?:[^&;|]*\s+)?(?:--force\b|--force-with-lease\b|-f\b)/ },
  { name: 'git reset --hard',        re: /\bgit\s+reset\s+--hard\b/ },
  { name: 'git history rewrite',     re: /\bgit\s+filter-(?:branch|repo)\b/ },
  { name: 'chmod 777',               re: /\bchmod\s+(?:-[a-zA-Z]+\s+)?777\b/ },
  { name: 'pipe-to-shell install',   re: /\b(?:curl|wget|fetch)\s+[^|]*\|\s*(?:bash|sh|zsh|fish)\b/ },
  { name: 'fork bomb',               re: /:\(\)\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/ },
  { name: 'dd to block device',      re: /\bdd\s+[^|]*\bof=\/dev\/(?:sd|nvme|hd|disk)/ },
  { name: 'mkfs on real device',     re: /\bmkfs(?:\.[a-z0-9]+)?\s+\/dev\/(?:sd|nvme|hd|disk)/ },
];

function block(reason, hits) {
  const detail = hits.length ? ` (matched: ${hits.join(', ')})` : '';
  process.stderr.write(`🛡️  Security Sentinel · BLOCKED · ${reason}${detail}\n`);
  process.stderr.write(`    If this is a deliberate, audited operation, ask the user to whitelist it.\n`);
  process.exit(2);
}

function scanAll(content, patterns) {
  const hits = [];
  for (const p of patterns) {
    if (p.re.test(content)) hits.push(p.name);
  }
  return hits;
}

// ─── Dispatch ────────────────────────────────────────────────────────
if (tool === 'Write' || tool === 'Edit') {
  const filePath = input.file_path || '';
  for (const re of FORBIDDEN_PATHS) {
    if (re.test(filePath)) {
      block(`refusing to ${tool.toLowerCase()} sensitive file path "${filePath}". Use a gitignored config or env var.`, []);
    }
  }
  const target = tool === 'Write' ? (input.content || '') : (input.new_string || '');
  const credHits = scanAll(target, SECRETS);
  if (credHits.length) {
    block(`credential pattern detected in payload for "${filePath}". Move to env var, .gitignored config, or rotate.`, credHits);
  }
}

if (tool === 'Bash') {
  let cmd = input.command || '';
  cmd = cmd.replace(/<<-?\s*['"]?(\w+)['"]?\b[\s\S]*?\n[\t ]*\1\b/g, '<<HEREDOC>>');
  cmd = cmd.replace(/"(?:[^"\\]|\\.)*"/g, '"STR"');
  cmd = cmd.replace(/'[^']*'/g, "'STR'");

  const hits = scanAll(cmd, BASH_BLOCKLIST);
  if (hits.length) {
    block(`destructive / irreversible command refused.`, hits);
  }
}

// Default: allow silently
process.exit(0);
