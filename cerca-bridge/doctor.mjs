/** Non-destructive preflight. No API calls and no printing of credentials. */
import {settings} from './bridge-control.mjs';
import {isIP} from 'node:net';
import {lookup} from 'node:dns/promises';

export function inspectConfig(env=process.env) {
 const check=settings(env); // validates independent webhook and API key settings
 const postgres=String(env.BRIDGE_POSTGRES_PASSWORD||'');
 const redis=String(env.BRIDGE_REDIS_PASSWORD||'');
 if (!/^[0-9a-f]{64,}$/i.test(postgres)||!/^[0-9a-f]{64,}$/i.test(redis))
   throw new Error('invalid_private_database_passwords');
 if (check.apiKey===check.secret || check.apiKey===postgres || check.apiKey===redis ||
     check.secret===postgres || check.secret===redis || postgres===redis)
   throw new Error('reused_secret');
 if (isIP(check.host)) throw new Error('hostname_required_for_tls');
 if (['localhost','local','example.com','example.org','example.net'].some(x=>check.host===x))
   throw new Error('public_hostname_required');
 return {host:check.host};
}

if (process.argv[1] && import.meta.url === new URL('file://'+process.argv[1]).href) {
 try {
  const {host}=inspectConfig();
  const results=await lookup(host,{all:true});
  if (!results.length) throw new Error('dns_unresolved');
  process.stdout.write(`CERCA VPS configuration validated. DNS records for ${host}: ${results.length}. No credentials displayed.\n`);
 } catch {
  process.stderr.write('CERCA VPS preflight failed: review the .env file, DNS records and secrets.\n');
  process.exitCode=1;
 }
}