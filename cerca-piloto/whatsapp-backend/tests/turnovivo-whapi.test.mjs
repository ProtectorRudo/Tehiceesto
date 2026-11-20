import assert from 'node:assert/strict';
import {extractTurnoVivoWhapi,isTurnoVivoOperator,receiveTurnoVivoMessage,completeTurnoVivoMessage} from '../src/turnovivo-whapi.mjs';
const now=new Date();const stamp=Math.round(Date.now()/1000);const channel='CHNL12345';
const payload={channel_id:channel,event:{type:'messages',event:'post'},messages:[
 {from_me:false,type:'text',from:'5492211234567',chat_id:'5492211234567@s.whatsapp.net',timestamp:stamp,id:'abcdef0123456',text:{body:'Reservame a Mauro mañana a las 15'}},
 {from_me:false,type:'voice',from:'5492211234567',chat_id:'5492211234567@s.whatsapp.net',timestamp:stamp,id:'abcdef0456789',voice:{id:'oga-e405da000001',file_size:14002}},
 {from_me:false,type:'text',from:'5492211234567',chat_id:'5492211234567@g.us',timestamp:stamp,id:'abcdef0000001',text:{body:'grupo no'}}
]};
const items=extractTurnoVivoWhapi(payload,{channelId:channel,now});
assert.equal(items.length,2);assert.equal(items[0].message_type,'text');assert.equal(items[1].message_type,'audio');assert.equal(items[0].from_phone,'+5492211234567');
assert.equal(extractTurnoVivoWhapi(payload,{channelId:'OTHER',now}).length,0);
assert.equal(extractTurnoVivoWhapi({...payload,messages:[{...payload.messages[0],from_me:true}]},{channelId:channel,now}).length,0);
let called=[];
const env={TURNOVIVO_WHATSAPP_BRIDGE_ENABLED:'true',TURNOVIVO_BRIDGE_SECRET:'abcdefghijklmnopqrstuvWXYZ0123456789ABCDEFGHIJ',TURNOVIVO_OPERATOR_REPLIES_ENABLED:'false'};
const fetcher=async(url,opts={})=>{
 called.push({action:new URL(url).searchParams.get('action'),url,body:JSON.parse(opts.body)});
 if(url.includes('action=lookup'))return Response.json({registered:true});
 if(url.includes('action=ingest'))return Response.json({accepted:true,new_message:true});
 if(url.includes('action=process'))return Response.json({processed:true,reply:'Listo, turno registrado'});
 if(url.includes('action=ack'))return Response.json({accepted:true});
 throw Error('unexpected URL '+url);
};
assert.equal(await isTurnoVivoOperator(items[0].from_phone,{env,fetcher}),true);
assert.equal((await receiveTurnoVivoMessage(items[0],{env,fetcher})).accepted,true);
let sent=0;const result=await completeTurnoVivoMessage(items[0],{env,fetcher,send:async()=>{sent++}});
assert.equal(result.processed,true);assert.equal(sent,0);assert.equal(called[1].body.text,'Reservame a Mauro mañana a las 15');
const done=await completeTurnoVivoMessage(items[0],{env:{...env,TURNOVIVO_OPERATOR_REPLIES_ENABLED:'true'},fetcher,send:async()=>{sent++;return 'PROVIDERMSG1234567';}});
assert.equal(done.responded,true);assert.equal(sent,1);assert.ok(called.some(x=>x.action==='ack'&&x.body.provider_message_id==='PROVIDERMSG1234567'));
assert.equal((await isTurnoVivoOperator(items[0].from_phone,{env:{...env,TURNOVIVO_WHATSAPP_BRIDGE_ENABLED:'false'},fetcher})),false);
console.log('OK: 9 pruebas (texto, audio, grupos, canal, origen, registro, ingesta, procesamiento, envío seguro)');