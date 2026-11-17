/** Self-healing for an upstream Evolution webhook persistence issue.
 * Checks only the private bridge webhook; never generates a QR, sends messages,
 * enables scheduled jobs, creates user accounts, or modifies other instances.
 */
import {makeClient,reconcileWebhook} from './bridge-control.mjs';
const frequencyMs = 60000;
let stopping = false;
const wait = ms => new Promise(resolve => setTimeout(resolve,ms));
process.on('SIGTERM',() => { stopping = true; });
process.on('SIGINT',() => { stopping = true; });
let client;
try { client=makeClient(); }
catch { process.stderr.write('CERCA monitor has invalid private settings.\n');process.exit(1); }
let previous='initial';
while (!stopping) {
  let state;
  try {state=await reconcileWebhook(client);}
  catch {state='unreachable';}
  if (state==='repaired') process.stdout.write('CERCA webhook configuration repaired and verified.\n');
  else if (state!==previous && state!=='healthy') process.stderr.write(`CERCA bridge status: ${state}.\n`);
  else if (state==='healthy' && previous!=='healthy') process.stdout.write('CERCA webhook healthy.\n');
  previous=state;
  if (!stopping) await wait(frequencyMs);
}