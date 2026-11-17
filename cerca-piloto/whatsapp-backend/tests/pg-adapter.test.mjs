import test from 'node:test';
import assert from 'node:assert/strict';
import {makePgDb} from '../src/db_pg.mjs';
import {makeDb} from '../src/db.mjs';

test('shared Supabase selection never falls back to administrative REST credential',async()=>{
 const unsafe={SUPABASE_URL:'https://shared.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'do-not-use'};
 assert.equal(makeDb(unsafe).available(),false);
 assert.equal(makeDb({...unsafe,CERCA_DATABASE_URL:'postgres://worker@localhost/postgres'}).available(),true);
});

test('private PostgreSQL adapter uses only cerca schema and enforces TLS',async()=>{
 const queries=[];let config;
 class MockPool{
  constructor(x){config=x}
  async query(query,args=[]){
   queries.push({query,args});
   if(query.includes('cerca.apply_event'))return {rows:[{value:{status:'applied',revision:1}}]};
   if(query.includes('from cerca.families'))return {rows:[{id:'f1',revision:1,state:{status:'active'}}]};
   if(query.includes('from cerca.outbox')&&query.includes("status='pending'"))return {rows:[]};
   return {rows:[]};
  }
 }
 const db=makePgDb({CERCA_DATABASE_URL:'postgres://cerca_worker@pooler.invalid/postgres',CERCA_DB_CA_PEM:''},{poolFactory:MockPool});
 assert.equal(db.available(),true);
 assert.equal((await db.family('5492211111111')).id,'f1');
 const accepted=await db.commit('5492211111111',0,'test-event-123',{status:'pending'},[]);
 assert.equal(accepted.status,'applied');
 assert.deepEqual(await db.pending(),[]);
 await db.setCancelled('some-job');
 await db.sentThisMonth('2026-11-01T00:00:00Z');
 assert.equal(config.max,2);
 assert.equal(config.ssl.rejectUnauthorized,true);
 assert.ok(queries.every(q=>q.query.includes('cerca.')));
 assert.ok(queries.every(q=>!/(comp_private|public\.|auth\.|service_role)/.test(q.query)));
});

test('private adapter converts optimistic concurrency errors for webhook retry',async()=>{
 class ConflictPool{async query(){throw Error('cerca_conflict')}}
 const db=makePgDb({CERCA_DATABASE_URL:'postgres://fake'},{poolFactory:ConflictPool});
 await assert.rejects(db.commit('5492211111111',0,'event-123456',{},[]),/database_409/);
});


test('pooler host plus separate secret constructs a private PostgreSQL URL safely', async()=>{
 let config;
 class MockPool{constructor(c){config=c}async query(){return {rows:[]}}}
 const vars={CERCA_DB_HOST:'aws-0-sa-east-1.pooler.supabase.com',CERCA_DB_PASSWORD:'randomSecretWith@!',CERCA_DB_PROJECT_REF:'efvvadfxuyieswdqnsjg'};
 const db=makePgDb(vars,{poolFactory:MockPool});
 assert.equal(db.available(),true);await db.ping();
 assert.match(config.connectionString,/^postgresql:\/\/cerca_worker\.efvvadfxuyieswdqnsjg:/);
 assert.match(config.connectionString,/randomSecretWith%40!/);
 assert.match(config.connectionString,/@aws-0-sa-east-1\.pooler\.supabase\.com:5432\/postgres$/);
 assert.equal(config.ssl.rejectUnauthorized,true);
 assert.equal(makeDb(vars).available(),true);
 assert.throws(()=>makePgDb({...vars,CERCA_DB_HOST:'attacker.example.org'}),/invalid_cerca_pooler_host/);
});


test('database prioritizes opt-out and onboarding replies ahead of 150 queued campaigns',async()=>{
 const marketing=Array.from({length:150},(_,i)=>({job_key:'m'+i,channel:'marketing',created_at:'2026-11-15'}));
 const service={job_key:'reply',channel:'service',created_at:'2026-11-17'};
 let examinedQuery='';
 class CongestedPool {
  async query(query){
   examinedQuery=query;
   const jobs=[...marketing,service];
   if(query.includes("(channel='service') desc"))jobs.sort((a,b)=>(a.channel==='service'?-1:1)-(b.channel==='service'?-1:1));
   return {rows:jobs.slice(0,100)};
  }
 }
 const db=makePgDb({CERCA_DATABASE_URL:'postgres://test@localhost/postgres'},{poolFactory:CongestedPool});
 const pending=await db.pending();
 assert.equal(pending.length,100);
 assert.equal(pending[0].job_key,'reply');
 assert.match(examinedQuery,/order by \(channel='service'\) desc, created_at asc limit 100/);
});

test('legacy REST test adapter requests service jobs before marketing jobs',async()=>{
 const urls=[];
 const fetcher=async url=>{urls.push(url);return new Response('[]',{status:200})};
 const db=makeDb({CERCA_TEST_REST_ADAPTER:'true',SUPABASE_URL:'https://fake-cerca.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'fake-test'},fetcher);
 await db.pending();
 assert.match(urls[0],/order=channel\.desc,created_at\.asc/);
});