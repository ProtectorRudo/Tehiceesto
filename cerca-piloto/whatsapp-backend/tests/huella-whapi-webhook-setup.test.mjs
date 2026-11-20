import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWhapiWebhookSettings,configureWhapiWebhook} from '../src/whapi-webhook-setup.mjs';
const secret='a'.repeat(64);
const expectedUrl='https://cerca-piloto.onrender.com/webhooks/whapi';
const env={
 WHAPI_TOKEN:'private-mock-token-123456789012',
 WHAPI_WEBHOOK_SECRET:secret,
 WHAPI_CHANNEL_ID:'CAPTAM-NWK3P',
 HUELLA_WHAPI_SETUP:'true'
};
const validHook={url:expectedUrl,mode:'body',events:[
 {type:'messages',method:'post'}, {type:'statuses',method:'post'}
 ],headers:{'X-Whapi-Secret':secret}};
test('Whapi setup is disabled unless explicitly authorized',async()=>{
 const result=await configureWhapiWebhook({env:{...env,HUELLA_WHAPI_SETUP:'false'},fetcher:()=>{throw Error('should never call network');}});
 assert.equal(result,'disabled');
});
test('Whapi setup builds a complete preserved webhooks array without deleting others',()=>{
 const current={webhooks:[
  {url:'https://some-other-service.example/hook',mode:'body',events:[{type:'groups',method:'post'}]},
  {url:expectedUrl,mode:'method',headers:{'X-Keep-Header':'keep'},events:[{type:'messages',method:'post'}]}
 ],callback_persist:true,offline_mode:true,pdo_sync:false,auto_read_messages:false};
 const build=buildWhapiWebhookSettings(current,secret);
 assert.equal(build.status,'update_needed');
 assert.equal(build.payload.webhooks.length,2);
 assert.deepEqual(build.payload.webhooks[0],current.webhooks[0]);
 assert.equal(build.payload.webhooks[1].headers['X-Keep-Header'],'keep');
 assert.equal(build.payload.webhooks[1].headers['X-Whapi-Secret'],secret);
 assert.equal(build.payload.offline_mode,true);
 assert.equal(build.payload.pdo_sync,false);
 assert.equal(build.payload.callback_persist,true);
 assert.deepEqual(buildWhapiWebhookSettings({...current,webhooks:[build.payload.webhooks[1]]},secret),{status:'already_configured',payload:null});
});
test('Whapi setup refuses malformed settings or repeated destination without writing',()=>{
 assert.equal(buildWhapiWebhookSettings({},secret),null);
 assert.equal(buildWhapiWebhookSettings({webhooks:[{url:expectedUrl},{url:expectedUrl}]},secret),null);
});
test('Whapi setup reads, updates and checks verified settings with token only in request header',async()=>{
 let count=0,stored={webhooks:[],callback_persist:true,offline_mode:true};
 const fetcher=async(url,opts)=>{
  assert.equal(url,'https://gate.whapi.cloud/settings');
  assert.equal(opts.headers.authorization,'Bearer '+env.WHAPI_TOKEN);
  count++;
  if(opts.method==='PATCH'){
   const data=JSON.parse(opts.body);
   assert.equal(data.webhooks[0].headers['X-Whapi-Secret'],secret);
   stored={...stored,...data};
   return new Response(JSON.stringify({ok:true}),{status:200});
  }
  return new Response(JSON.stringify(stored),{status:200});
 };
 assert.equal(await configureWhapiWebhook({env,fetcher}),'configured');
 assert.equal(count,3);
 assert.equal(await configureWhapiWebhook({env,fetcher}),'already_configured');
 assert.equal(count,4);
});
test('Whapi setup rejects gateway authentication errors without attempting patch',async()=>{
 const r=await configureWhapiWebhook({env,fetcher:async()=>new Response('bad auth',{status:401})});
 assert.equal(r,'get_http_401');
});
