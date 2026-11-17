/** Private Evolution v2 bridge configuration. No customer traffic or pairing here.
 * This module never logs credentials. It only audits and repairs the configured webhook.
 */
const INSTANCE = 'cerca-piloto';
const EVENTS = Object.freeze(['MESSAGES_UPSERT']);
const WEBHOOK_URL = 'https://cerca-piloto.onrender.com/webhooks/evolution';
const HEADER = 'X-Cerca-Bridge-Secret';

export function settings(env = process.env) {
  const apiKey = String(env.EVOLUTION_API_KEY || '');
  const secret = String(env.CERCA_BRIDGE_WEBHOOK_SECRET || '');
  const origin = String(env.EVOLUTION_INTERNAL_URL || 'http://evolution:8080').replace(/\/$/, '');
  const host = String(env.EVOLUTION_HOST || '');
  if (!/^[a-z0-9.-]+$/i.test(host) || !host.includes('.') ||
      host === 'evo.example.com' ||
      !/^[0-9a-f]{64,}$/i.test(apiKey) || !/^[0-9a-f]{64,}$/i.test(secret) ||
      !['http://evolution:8080', 'http://127.0.0.1:8080'].includes(origin)) {
    throw new Error('invalid_bridge_settings');
  }
  return { apiKey, secret, origin, host, instance:INSTANCE,
    webhook:{enabled:true,url:WEBHOOK_URL,webhookByEvents:false,webhookBase64:false,
      headers:{[HEADER]:secret},events:[...EVENTS]}};
}

export function webhookMatches(actual, expected) {
  if (!actual || typeof actual !== 'object') return false;
  const w = actual.webhook || actual;
  if (w.enabled !== true || w.url !== expected.url) return false;
  if (w.webhookByEvents === true || w.byEvents === true ||
      w.webhookBase64 === true || w.base64 === true) return false;
  if (!Array.isArray(w.events) || w.events.length !== expected.events.length ||
      !expected.events.every(e => w.events.includes(e))) return false;
  const headers = w.headers && typeof w.headers === 'object' ? w.headers : {};
  const actualSecret = Object.entries(headers).find(([name]) => name.toLowerCase() === HEADER.toLowerCase())?.[1];
  return actualSecret === expected.headers[HEADER];
}

export function makeClient(env = process.env, fetcher = fetch) {
  const conf=settings(env);
  async function request(path, {method='GET', body, allowMissing=false}={}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetcher(conf.origin+path,{method,
        headers:{apikey:conf.apiKey,'content-type':'application/json'},
        ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:controller.signal});
      if (res.status === 404 && allowMissing) return null;
      if (!res.ok) throw new Error('evolution_request_failed_'+res.status);
      return await res.json();
    } finally { clearTimeout(timer); }
  }
  return {conf,request};
}

export async function instancePresent(client) {
  const result=await client.request('/instance/fetchInstances');
  const items=Array.isArray(result)?result:result?.instances;
  if (!Array.isArray(items)) throw new Error('evolution_instances_unexpected');
  return items.some(i => (i?.name || i?.instance?.instanceName || i?.instanceName) === client.conf.instance);
}

/** No instance creation here: deleting or disconnecting a number stays a manual action. */
export async function reconcileWebhook(client) {
  if (!await instancePresent(client)) return 'instance_missing';
  const path='/webhook/find/'+client.conf.instance;
  const existing=await client.request(path,{allowMissing:true});
  if (webhookMatches(existing,client.conf.webhook)) return 'healthy';
  await client.request('/webhook/set/'+client.conf.instance,{
    method:'POST',body:{webhook:client.conf.webhook}
  });
  const updated=await client.request(path);
  if (!webhookMatches(updated,client.conf.webhook)) throw new Error('webhook_repair_unverified');
  return 'repaired';
}

/** Explicit operator action to initialize CERCA only, never sends a customer message. */
export async function initializeBridge(client) {
  if (!await instancePresent(client)) {
    await client.request('/instance/create',{method:'POST',body:{
      instanceName:client.conf.instance,integration:'WHATSAPP-BAILEYS',qrcode:true
    }});
  }
  const result=await reconcileWebhook(client);
  if (result==='instance_missing') throw new Error('instance_was_not_created');
  return result;
}