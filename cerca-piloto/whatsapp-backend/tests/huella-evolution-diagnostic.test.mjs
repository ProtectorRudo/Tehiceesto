import test from 'node:test';
import assert from 'node:assert/strict';
import {probeEvolutionTransport} from '../src/evolution.mjs';

const env={
 EVOLUTION_API_URL:'https://test-bridge.example.com/',
 EVOLUTION_INSTANCE:'huella_piloto',
 EVOLUTION_API_KEY:'example-key-with-20-plus-characters',
 CERCA_BRIDGE_WEBHOOK_SECRET:'secret-0123456789-01234567890123456789'
};
test('evolution probe recognizes authenticated open session but never returns hostname',async()=>{
 let target=null,apiKey=null;
 const state=await probeEvolutionTransport({env,fetcher:async(url,opts)=>{
  target=url;apiKey=opts.headers.apikey;
  return new Response(JSON.stringify({instance:{instanceName:'huella_piloto',state:'open'}}),{status:200});
 }});
 assert.equal(state,'open');
 assert.equal(target,'https://test-bridge.example.com/instance/connectionState/huella_piloto');
 assert.equal(apiKey,env.EVOLUTION_API_KEY);
 assert.ok(!state.includes('huella_piloto'));
});
test('evolution probe classifies unavailable provider without leaking response or secrets',async()=>{
 const status=await probeEvolutionTransport({env,fetcher:async()=>new Response('SECRET',{status:503})});
 assert.equal(status,'http_503');
 const dns=await probeEvolutionTransport({env,fetcher:async()=>{throw Object.assign(new Error('secret host'),{cause:{code:'ENOTFOUND'}});}});
 assert.equal(dns,'dns');
 const unexpected=await probeEvolutionTransport({env,fetcher:async()=>new Response(JSON.stringify({instance:{state:'other-PRIVATE-TOKEN'}}),{status:200})});
 assert.equal(unexpected,'unexpected_state');
 const notReady=await probeEvolutionTransport({env:{...env,EVOLUTION_API_URL:''}});
 assert.equal(notReady,'not_configured');
});
