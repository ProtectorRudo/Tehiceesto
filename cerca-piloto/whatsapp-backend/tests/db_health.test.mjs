import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyDbFailure} from '../src/db_pg.mjs';

test('DB health categories never leak credentials or raw database messages',()=>{
 const cases=[
  [{code:'28P01',message:'password authentication failed for user "cerca_worker"'},'authentication'],
  [{code:'28000',message:'role "cerca_worker" does not exist'},'role_or_pooler'],
  [{code:'UNABLE_TO_VERIFY_LEAF_SIGNATURE',message:'unable to verify first certificate'},'tls_certificate'],
  [{code:'ETIMEDOUT',message:'Connection terminated due to connection timeout'},'timeout'],
  [{code:'ENOTFOUND',message:'getaddrinfo ENOTFOUND example'},'dns'],
  [{code:'ECONNREFUSED',message:'connection refused'},'network'],
  [{message:'Client password must be a string'},'configuration'],
  [{message:'SENSITIVE_CONN_DETAILS=must-not-leak'},'unclassified'],
 ];
 for(const [err,expected] of cases){
   const result=classifyDbFailure(err);
   assert.equal(result,expected);
   assert.ok(!result.includes('cerca_worker')&&!result.includes('SENSITIVE'));
 }
});
