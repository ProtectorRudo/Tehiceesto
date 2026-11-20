import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyEvolutionInbound} from '../src/server.mjs';

const instance='cerca-piloto';
const event={instance,event:'messages.upsert',data:{key:{fromMe:false}}};
test('Evolution inbound diagnostics report only fixed categories, never personal data',()=>{
 const message={phone:'5492210123456',text:'Sensitive private content',id:'secret-message'};
 const outputs=[
  classifyEvolutionInbound(event,message,true,instance),
  classifyEvolutionInbound(event,message,false,instance),
  classifyEvolutionInbound({...event,instance:'unknown-person'},null,false,instance),
  classifyEvolutionInbound({...event,event:'OTHER'},null,false,instance),
  classifyEvolutionInbound({...event,data:{key:{fromMe:true}}},null,false,instance),
  classifyEvolutionInbound(event,null,false,instance)
 ];
 assert.deepEqual(outputs,['accepted','not_allowlisted','instance_mismatch','event_type_unexpected','message_key_unaccepted','message_unsupported_or_identity']);
 assert.ok(!outputs.join(' ').includes(message.phone));
 assert.ok(!outputs.join(' ').includes(message.text));
});
