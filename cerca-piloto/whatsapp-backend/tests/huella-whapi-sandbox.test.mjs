import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWhapiWebhook,extractWhapiMessages,extractWhapiStatuses,sendWhapi,whapiReady,formatWhapiText} from '../src/whapi.mjs';
import {isSessionMessagingReady,isMessagingReady} from '../src/scheduler.mjs';
const env={CERCA_PROVIDER:'whapi',CERCA_SEND_MODE:'test',CERCA_TEST_WA_IDS:'5492211234567',
 WHAPI_TOKEN:'test-token-not-a-real-credential-123456',WHAPI_CHANNEL_ID:'HUELLA-01',
 WHAPI_WEBHOOK_SECRET:'test-webhook-secret-for-local-tests-only-not-real'};
const now=new Date('2026-11-20T18:00:00Z');
const msg=(overrides={})=>({
 id:'p.w30M7fgwWD4XwHu.g4CA-gBgTwl0rVw',from_me:false,type:'text',
 chat_id:'5492211234567@s.whatsapp.net',from:'5492211234567',
 timestamp:Math.floor(now.getTime()/1000),text:{body:'Papá'},...overrides
});
const payload=(messages,event='post',channel_id='HUELLA-01')=>({
 event:{type:'messages',event},channel_id,messages
});
test('Whapi credentials gate test replies without enabling proactive templates',()=>{
 assert.equal(whapiReady(env),true);
 assert.equal(isSessionMessagingReady(env),true);
 assert.equal(isMessagingReady({...env,CERCA_TEMPLATES_APPROVED:'true',CERCA_WHAPI_SCHEDULED_ALLOWED:'true'}),false);
 assert.equal(isSessionMessagingReady({...env,WHAPI_TOKEN:''}),false);
 assert.equal(isSessionMessagingReady({...env,CERCA_SEND_MODE:'disabled'}),false);
});
test('Whapi webhook secret is required and cannot use outbound Bearer token',()=>{
 assert.equal(validateWhapiWebhook(env.WHAPI_WEBHOOK_SECRET,env.WHAPI_WEBHOOK_SECRET),true);
 assert.equal(validateWhapiWebhook(env.WHAPI_TOKEN,env.WHAPI_WEBHOOK_SECRET),false);
 assert.equal(validateWhapiWebhook('',env.WHAPI_WEBHOOK_SECRET),false);
 assert.equal(validateWhapiWebhook('anything','short'),false);
});
test('Whapi extracts current 1:1 text only with matching exact channel',()=>{
 assert.deepEqual(extractWhapiMessages(payload([msg()]),{channelId:env.WHAPI_CHANNEL_ID,now}),[{
  id:'whapi:HUELLA-01:p.w30M7fgwWD4XwHu.g4CA-gBgTwl0rVw',
  phone:'5492211234567',text:'Papá',receivedAt:now.toISOString()
 }]);
 for(const invalid of [
  msg({from_me:true}),msg({chat_id:'120363000000000@g.us'}),msg({chat_id:'99999999999@s.whatsapp.net'}),
  msg({id:'invalid id'}),msg({type:'image'}),msg({text:{body:' '}}),
  msg({timestamp:Math.floor((now.getTime()-24*3600000)/1000)}),
  msg({timestamp:Math.floor((now.getTime()+20*60000)/1000)}),
  msg({from:'@lid'}),msg({chat_id:'random-identifier@lid'})
 ]) assert.equal(extractWhapiMessages(payload([invalid]),{channelId:env.WHAPI_CHANNEL_ID,now}).length,0);
 assert.equal(extractWhapiMessages(payload([msg()],'put'),{channelId:env.WHAPI_CHANNEL_ID,now}).length,0);
 assert.equal(extractWhapiMessages(payload([msg()],'post','OTHER-11'),{channelId:env.WHAPI_CHANNEL_ID,now}).length,0);
});
test('Whapi privacy LID is accepted only with provider-supplied numeric from',()=>{
 assert.equal(extractWhapiMessages(payload([msg({chat_id:'123456789012345@lid'})]),{channelId:env.WHAPI_CHANNEL_ID,now}).length,1);
 assert.equal(extractWhapiMessages(payload([msg({chat_id:'123456789012345@lid',from:'abc'})]),{channelId:env.WHAPI_CHANNEL_ID,now}).length,0);
});
test('Whapi statuses can update delivery acknowledgements',()=>{
 const result=extractWhapiStatuses({channel_id:'HUELLA-01',event:{type:'statuses',event:'post'},statuses:[
  {id:'id.sending-abc123',status:'delivered'}, {id:'id.sending-abc123',status:'unknown'},
  {id:'Invalid id',status:'read'}]}, {channelId:env.WHAPI_CHANNEL_ID});
 assert.deepEqual(result,[{messageId:'id.sending-abc123',status:'delivered'}]);
});
test('Whapi only sends sandbox service replies with token and validated message id',async()=>{
 let url,body,headers;
 const id=await sendWhapi({body:'¿Cuántos hijos querés registrar?',options:['1','2']},'5492211234567',{
  env,fetcher:async(u,init)=>{
   url=u;body=JSON.parse(init.body);headers=init.headers;
   return new Response(JSON.stringify({sent:true,message:{id:'p.w30M7fgwWD4XwHu.g4CA-gBgTwl0rVw'}}),{status:200});
  }
 });
 assert.equal(id,'p.w30M7fgwWD4XwHu.g4CA-gBgTwl0rVw');
 assert.equal(url,'https://gate.whapi.cloud/messages/text');
 assert.equal(headers.authorization,'Bearer '+env.WHAPI_TOKEN);
 assert.deepEqual(body,{to:'5492211234567',body:'¿Cuántos hijos querés registrar?\n\nRespondé: 1 | 2',no_link_preview:true});
 await assert.rejects(sendWhapi({kind:'template',name:'DAILY',params:[]},'5492211234567',{env}),/whapi_scheduled_disabled/);
 await assert.rejects(sendWhapi({body:'hola'},'5492211234567',{env,fetcher:async()=>new Response('limit',{status:402})}),/whapi_http_402/);
 await assert.rejects(sendWhapi({body:'hola'},'5492211234567',{env,fetcher:async()=>new Response(JSON.stringify({sent:true}),{status:200})}),/whapi_missing_message_id/);
 assert.throws(()=>formatWhapiText({body:''}),/whapi_invalid_message/);
});
