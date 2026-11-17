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