import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectConfig} from './doctor.mjs';
const base={EVOLUTION_HOST:'evo.cerca-test.example',EVOLUTION_API_KEY:'a'.repeat(64),
 CERCA_BRIDGE_WEBHOOK_SECRET:'b'.repeat(64),
 BRIDGE_POSTGRES_PASSWORD:'c'.repeat(64),BRIDGE_REDIS_PASSWORD:'d'.repeat(64)};
test('safe VPS config checks all separate credentials without disclosing them',()=>{
 assert.equal(inspectConfig(base).host,'evo.cerca-test.example');
 assert.throws(()=>inspectConfig({...base,BRIDGE_POSTGRES_PASSWORD:'short'}));
 assert.throws(()=>inspectConfig({...base,BRIDGE_REDIS_PASSWORD:base.BRIDGE_POSTGRES_PASSWORD}));
 assert.throws(()=>inspectConfig({...base,CERCA_BRIDGE_WEBHOOK_SECRET:base.EVOLUTION_API_KEY}));
 assert.throws(()=>inspectConfig({...base,EVOLUTION_HOST:'127.0.0.1'}));
 assert.throws(()=>inspectConfig({...base,EVOLUTION_HOST:'example.com'}));
});