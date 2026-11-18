import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(n)=>readFileSync(new URL(n,import.meta.url),'utf8');
test('local composer only publishes Caddy to loopback and preserves private databases',()=>{
 const s=read('./compose.local.yaml');
 assert.match(s,/127\.0\.0\.1:8787:8080/);
 assert.doesNotMatch(s,/"80:80"|"443:443"|"5432:5432"|"6379:6379"/);
 assert.match(s,/cloudflare\/cloudflared:latest/);
 assert.match(s,/tunnel --no-autoupdate --url http:\/\/caddy:8080/);
 assert.match(s,/cerca_evolution_sessions:\n/);
 assert.match(s,/cerca_evolution_pg:\n/);
});
test('local Caddy publishes only the two CERCA endpoints',()=>{
 const s=read('./Caddyfile.local');
 assert.match(s,/:8080\s*\{/);
 assert.match(s,/\/message\/sendText\/cerca-piloto/);
 assert.match(s,/\/instance\/connect\/cerca-piloto/);
 assert.match(s,/respond "Not Found" 404/);
 assert.doesNotMatch(s,/\/instance\/create/);
});
test('Windows initializer uses cryptographic keys and never stores tokens in Git',()=>{
 const s=read('./setup-local.ps1');const ignore=read('./.gitignore');
 assert.match(s,/RandomNumberGenerator/);
 assert.match(s,/BRIDGE_POSTGRES_PASSWORD/);
 assert.match(s,/CERCA_BRIDGE_WEBHOOK_SECRET/);
 assert.match(ignore,/\.env\.local/);
 assert.match(ignore,/local-link\.txt/);
});
test('shutdown retains the persistent Docker volumes',()=>{
 const s=read('./stop-local.ps1');
 assert.match(s,/\sdown/);
 assert.doesNotMatch(s,/down\s+-v|--volumes/);
});
test('local startup only configures Evolution, not messages or phone pairing',()=>{
 const s=read('./start-local.ps1');
 assert.match(s,/docker @dc run --rm monitor node configure\.mjs/);
 assert.doesNotMatch(s,/CERCA_SEND_MODE=test|messages?\/sendText|instance\/connect/);
});