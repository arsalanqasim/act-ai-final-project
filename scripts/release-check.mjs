import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const failures = [];
const forbiddenBrowserKeyName = ['VITE', 'GEMINI', 'API_KEY'].join('_');

function fail(message) {
  failures.push(message);
}

function readText(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function run(command, args) {
  console.log(`\n[release-check] Running ${command} ${args.join(' ')}`);
  try {
    const output = execFileSync(command, args, { cwd: root, encoding: 'utf8', windowsHide: true, shell: process.platform === 'win32' });
    process.stdout.write(output);
  } catch (error) {
    const commandError = error instanceof Error ? error : new Error(String(error));
    const stdout = typeof commandError.stdout === 'string' ? commandError.stdout : '';
    const stderr = typeof commandError.stderr === 'string' ? commandError.stderr : '';
    process.stdout.write(stdout);
    process.stderr.write(stderr);
    fail(`${command} ${args.join(' ')} failed. Fix the reported output and run the same command again.`);
  }
}

function trackedFiles() {
  try {
    return execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8', windowsHide: true })
      .split(/\r?\n/)
      .map((file) => file.trim())
      .filter(Boolean);
  } catch {
    fail('Unable to read the tracked file list. Run this check from the repository root.');
    return [];
  }
}

function filesUnder(directory) {
  if (!existsSync(directory)) return [];
  const result = [];
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const info = statSync(fullPath);
    if (info.isDirectory()) result.push(...filesUnder(fullPath));
    else result.push(fullPath);
  }
  return result;
}

function assertContains(label, text, patterns) {
  for (const pattern of patterns) {
    if (!text.includes(pattern)) fail(`${label} is missing required marker: ${pattern}`);
  }
}

const tracked = trackedFiles();
const secretFilePattern = /(^|[\\/])\.env(?:\.|$)|\.(?:pem|key)$|credentials|secrets/i;
for (const file of tracked) {
  if (file === '.env.example') continue;
  if (secretFilePattern.test(file)) fail(`Secret-looking tracked file found: ${file}`);
}

const scanPaths = [
  ...tracked.filter((file) => file.startsWith('src/') || file.startsWith('api/')),
  'README.md',
  '.env.example',
  ...filesUnder(join(root, 'docs')).map((file) => relative(root, file)),
  ...filesUnder(join(root, 'dist')).map((file) => relative(root, file))
].filter((file, index, files) => files.indexOf(file) === index);

const sourceText = scanPaths
  .filter((file) => existsSync(join(root, file)))
  .map((file) => readText(join(root, file)))
  .join('\n');
const valueScanText = scanPaths
  .filter((file) => file !== '.env.example' && existsSync(join(root, file)))
  .map((file) => readText(join(root, file)))
  .join('\n');

if (sourceText.includes(forbiddenBrowserKeyName)) {
  fail('A forbidden browser provider-key environment variable reference was found. Keep provider credentials server-only.');
}

const providerLeakPatterns = [
  /AIza[0-9A-Za-z_-]{20,}/,
  /(?:^|[^A-Za-z])sk-[A-Za-z0-9]{20,}/,
  /(?:^|[^A-Za-z])re_[A-Za-z0-9]{20,}/,
  /eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  /GEMINI_API_KEY\s*=\s*[^\s#]+/,
  /RESEND_API_KEY\s*=\s*[^\s#]+/,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s#]+/
];
for (const pattern of providerLeakPatterns) {
  if (pattern.test(valueScanText)) fail(`Secret-looking value detected by ${pattern}. Remove it from source, dist, screenshots, or documentation.`);
}

const browserSource = tracked
  .filter((file) => file.startsWith('src/'))
  .map((file) => readText(join(root, file)))
  .join('\n');
if (browserSource.includes('@google/genai') || browserSource.includes('GoogleGenAI')) {
  fail('A Google provider SDK import was found in browser source. Keep Gemini access in api/ only.');
}
if (browserSource.includes('SUPABASE_SERVICE_ROLE_KEY') || browserSource.includes('RESEND_API_KEY')) {
  fail('A server-only credential name was found in src/. Keep it out of browser code.');
}

const envText = readText(join(root, '.env.example'));
const readmeText = readText(join(root, 'README.md'));
const publicEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const serverEnv = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GEMINI_API_KEY', 'CRON_SECRET', 'EMAIL_FROM', 'RESEND_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const name of [...publicEnv, ...serverEnv]) {
  if (!envText.includes(name) || !readmeText.includes(name)) fail(`Required environment variable ${name} is not documented in both .env.example and README.md.`);
}

const migrationDirectory = join(root, 'supabase', 'migrations');
for (const number of ['001', '002', '003', '004', '005']) {
  if (!readdirSync(migrationDirectory).some((file) => file.startsWith(`${number}_`) && file.endsWith('.sql'))) {
    fail(`Required migration ${number} is missing from supabase/migrations.`);
  }
}

const migrationText = readdirSync(migrationDirectory)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map((file) => readText(join(migrationDirectory, file)))
  .join('\n');
assertContains('Supabase RLS migrations', migrationText, [
  'profiles',
  'saved_opportunities',
  'custom_opportunities',
  'applications',
  'notification_preferences',
  'notification_deliveries',
  'action_tasks',
  'ENABLE ROW LEVEL SECURITY'
]);

const aiText = readText(join(root, 'api', 'ai.ts'));
const ingestText = readText(join(root, 'api', 'ingest.ts'));
const cronText = readText(join(root, 'api', 'cron', 'digest.ts'));
const urlSecurityText = readText(join(root, 'api', 'utils', 'urlSecurity.ts'));
assertContains('AI route', aiText, ['Bearer', 'auth.getUser', 'Secure Server AI Gateway']);
assertContains('Ingestion route', ingestText, ['Bearer', 'auth.getUser', 'validateUrlSecurityAndDomain', 'https']);
assertContains('Cron route', cronText, ['CRON_SECRET', 'SUPABASE_SERVICE_ROLE_KEY']);
assertContains('URL security utility', urlSecurityText, ['https:', 'redirect', '169.254', '15000']);
const serviceWorkerText = readText(join(root, 'public', 'sw.js'));
if (!serviceWorkerText.includes("url.pathname.startsWith('/api/')")) fail('Service worker must bypass API requests so authenticated responses are never cached.');

const markdownLinks = [...readmeText.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1].trim());
for (const link of markdownLinks) {
  if (/^https?:\/\//i.test(link)) continue;
  const cleanLink = link.split('#')[0].split('?')[0].replace(/^<|>$/g, '');
  if (cleanLink && !existsSync(resolve(root, cleanLink))) fail(`README local link is broken: ${link}`);
}

if (failures.length > 0) {
  console.error('\n[release-check] Static audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('[release-check] Static repository and security audit passed.');
}

if (process.exitCode === undefined) {
  run('npm.cmd', ['run', 'build']);
  run('npm.cmd', ['test']);
  run('npm.cmd', ['run', 'typecheck:server']);
  if (existsSync(join(root, 'node_modules', '@playwright', 'test'))) run('npm.cmd', ['run', 'test:e2e']);
  else console.log('[release-check] Playwright is not installed; E2E gate skipped with an actionable local note.');
}

if (failures.length > 0) {
  console.error('\n[release-check] Failed. Resolve every item above before submission.');
  process.exitCode = 1;
} else {
  console.log('\n[release-check] Passed: repository audit, build, unit tests, server typecheck, and available browser suite.');
}
