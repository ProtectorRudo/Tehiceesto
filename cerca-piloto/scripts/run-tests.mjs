/**
 * CERCA CI test runner.
 *
 * Render makes service environment variables available to build commands. Our HTTP
 * integration tests deliberately use local REST fakes, and must never inherit a
 * real database connection (or live WhatsApp / OpenAI credentials). Apart from
 * accidentally calling live services, such inheritance selects the real PG
 * adapter and makes fake onboarding tests fail.
 *
 * Keep production startup unchanged; sanitize only the child test processes.
 */
import {readdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const privatePrefixes = /^(?:CERCA_|EVOLUTION_|SUPABASE_|META_|TWILIO_|OPENAI_|BRIDGE_|PG|CLOUDFLARE_)/i;
const privateExact = new Set(['DATABASE_URL', 'CRON_SECRET', 'PORT', 'NODE_OPTIONS']);
const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
  !privatePrefixes.test(key) && !privateExact.has(key.toUpperCase())
));

const suites = [
  join(root, 'whatsapp-backend', 'tests'),
  join(root, '..', 'cerca-bridge'),
];
const testFiles = suites.flatMap(folder => readdirSync(folder).filter(name => name.endsWith('.test.mjs')).sort().map(name => join(folder, name)));
if (!testFiles.length) throw new Error('CERCA: no test files found; refusing to build');
const child = spawnSync(process.execPath, ['--test', ...testFiles], {
  cwd: root,
  env: environment,
  stdio: 'inherit',
  timeout: 120000,
  windowsHide: true,
});
if (child.error) throw child.error;
process.exit(child.status ?? 1);
