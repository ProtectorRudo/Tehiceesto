import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyOutboundFailure} from '../src/server.mjs';

test('outbound failures expose only fixed safe diagnostic codes',()=>{
 assert.equal(classifyOutboundFailure(new Error('evolution_http_503')),'evolution_http_503');
 assert.equal(classifyOutboundFailure(new Error('evolution_http_401')),'evolution_http_401');
 assert.equal(classifyOutboundFailure(new Error('evolution_missing_message_id')),'evolution_missing_message_id');
 assert.equal(classifyOutboundFailure(Object.assign(new Error('took too long'),{name:'AbortError'})),'provider_timeout');
 assert.equal(classifyOutboundFailure(Object.assign(new Error('connect failed'),{cause:{code:'ENOTFOUND'}})),'network_enotfound');
 assert.equal(classifyOutboundFailure(new Error('apikey=super-secret and number=5492210000000')),'transport_unclassified');
 assert.ok(!classifyOutboundFailure(new Error('private WhatsApp data')).includes('WhatsApp'));
});

test('recovery diagnostics never display private payload or telephone numbers',()=>{
 const failures=[
  {message:'Provider returned a private response and recipient=5492210000000'},
  {message:'key=hidden',cause:{code:'ECONNRESET'}},
  {message:'evolution_http_404',privateBody:'sensitive family data'}
 ];
 for(const failure of failures){
  const result=classifyOutboundFailure(failure);
  assert.match(result,/^[a-z0-9_]+$/);
  assert.ok(!result.includes('549221'));
  assert.ok(!result.includes('hidden'));
  assert.ok(!result.includes('family data'));
 }
});
