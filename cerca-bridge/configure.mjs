/** Run on private Docker network: docker compose run --rm monitor node configure.mjs
 * Creates the CERCA Evolution instance if missing, and verifies the signed webhook.
 * No WhatsApp device pairing or outbound messaging takes place here.
 */
import {makeClient,initializeBridge} from './bridge-control.mjs';
try {
  const state = await initializeBridge(makeClient());
  process.stdout.write(`CERCA instance ready; webhook ${state}. Messages remain disabled in CERCA until explicit activation.\n`);
} catch {
  process.stderr.write('CERCA bridge initialization failed. Check VPS, DNS and Evolution container logs.\n');
  process.exitCode = 1;
}