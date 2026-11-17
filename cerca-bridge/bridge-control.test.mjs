import test from 'node:test';
import assert from 'node:assert/strict';
import {settings,webhookMatches,makeClient,instancePresent,reconcileWebhook,initializeBridge} from './bridge-control.mjs';

const env={EVOLUTION_HOST:'evo.cerca-test.example',EVOLUTION_INTERNAL_URL:'http://evolution:8080',
 EVOLUTION_API_KEY:'a'.repeat(64),CERCA_BRIDGE_WEBHOOK_SECRET:'b'.repeat(64)};
const expected=settings(env);
const url='https://cerca-piloto.onrender.com/webhooks/evolution';
const instance=[{name:'cerca-piloto'}];

function mock({instances=instance,webhook=expected.webhook,find404=false}={}) {
 const calls=[];
 let stored=webhook;
 const fetcher=async (uri,opts)=>{
  const u=new URL(uri);calls.push({path:u.pathname,method:opts.method,body:opts.body?JSON.parse(opts.body):null,apikey:opts.headers.apikey});
  const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
  switch (u.pathname) {
   case '/instance/fetchInstances':return response(instances);
   case '/instance/create':instances.push({name:'cerca-piloto'});return response({instance:{instanceName:'cerca-piloto'}},201);
   case '/webhook/find/cerca-piloto':return (!stored&&find404)?response({error:'not found'},404):response(stored||{});
   case '/webhook/set/cerca-piloto':stored=JSON.parse(opts.body).webhook;return response({webhook:stored},201);
   default:return response({error:'unknown'},404);
  }
 };
 return {client:makeClient(env,fetcher),calls,getStored:()=>stored};
}

test('private configuration validates exact internal endpoint and strong independent secrets',()=>{
 assert.equal(expected.origin,'http://evolution:8080');
 assert.equal(expected.webhook.url,url);
 for (const bad of [
  {...env,EVOLUTION_API_KEY:'short'},
  {...env,CERCA_BRIDGE_WEBHOOK_SECRET:'replace-me'},
  {...env,EVOLUTION_INTERNAL_URL:'https://evil.example'},
  {...env,EVOLUTION_HOST:'evo.example.com'},
  {...env,EVOLUTION_INTERNAL_URL:'http://169.254.169.254'}
 ]) assert.throws(()=>settings(bad),/invalid_bridge_settings/);
});

test('healthy exact webhook needs no write and no outbound WhatsApp calls',async()=>{
 const m=mock();assert.equal(await reconcileWebhook(m.client),'healthy');
 assert.deepEqual(m.calls.map(x=>x.method+' '+x.path),['GET /instance/fetchInstances','GET /webhook/find/cerca-piloto']);
 assert.ok(m.calls.every(x=>x.apikey===env.EVOLUTION_API_KEY));
});

test('webhook without url, headers or events is automatically restored and verified',async()=>{
 const m=mock({webhook:{enabled:true,url:'',events:[],headers:null}});
 assert.equal(await reconcileWebhook(m.client),'repaired');
 assert.equal(webhookMatches(m.getStored(),expected.webhook),true);
 assert.deepEqual(m.calls.map(x=>x.method+' '+x.path),[
  'GET /instance/fetchInstances','GET /webhook/find/cerca-piloto',
  'POST /webhook/set/cerca-piloto','GET /webhook/find/cerca-piloto']);
 assert.deepEqual(Object.keys(m.calls[2].body),['webhook']);
});

test('missing secret, wrong events, and enabled extra events all trigger repair',async()=>{
 for (const broken of [
  {...expected.webhook,headers:{}},
  {...expected.webhook,events:[]},
  {...expected.webhook,events:['MESSAGES_UPSERT','CONTACTS_UPSERT']},
  {...expected.webhook,url:'https://other.example/webhook'},
  {...expected.webhook,enabled:false},
  {...expected.webhook,webhookByEvents:true}
 ]) {
  const m=mock({webhook:broken});assert.equal(await reconcileWebhook(m.client),'repaired');
  assert.equal(webhookMatches(m.getStored(),expected.webhook),true);
 }
});

test('instance missing stays missing: monitor must never create device or trigger linking',async()=>{
 const m=mock({instances:[]});assert.equal(await instancePresent(m.client),false);
 assert.equal(await reconcileWebhook(m.client),'instance_missing');
 assert.equal(m.calls.some(x=>x.path.startsWith('/instance/create')),false);
});

test('operator initializer explicitly creates a missing instance before configuring the webhook',async()=>{
 const m=mock({instances:[],webhook:null,find404:true});
 assert.equal(await initializeBridge(m.client),'repaired');
 assert.equal(m.calls.some(x=>x.method==='POST'&&x.path==='/instance/create'),true);
 assert.equal(m.getStored().headers['X-Cerca-Bridge-Secret'],env.CERCA_BRIDGE_WEBHOOK_SECRET);
});

test('webhook readback verification prevents silent false success',async()=>{
 const calls=[];
 const fetcher=async (uri,opts)=>{
  const path=new URL(uri).pathname;calls.push(path);
  const reply=path==='/instance/fetchInstances'?instance:path==='/webhook/find/cerca-piloto'?{enabled:true,url:'',events:[],headers:null}:{status:'ok'};
  return new Response(JSON.stringify(reply),{status:200});
 };
 await assert.rejects(()=>reconcileWebhook(makeClient(env,fetcher)),/webhook_repair_unverified/);
 assert.equal(calls.includes('/webhook/set/cerca-piloto'),true);
});

test('connection failure aborts safely without sending or creating messages',async()=>{
 const client=makeClient(env,async()=>new Response('{}',{status:503}));
 await assert.rejects(()=>reconcileWebhook(client),/evolution_request_failed_503/);
});