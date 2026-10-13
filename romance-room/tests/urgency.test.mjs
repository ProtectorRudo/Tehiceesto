import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const dir=mkdtempSync(join(tmpdir(),'campanada-urgency-'));
const src=fileURLToPath(new URL('../src/game/urgency.ts',import.meta.url));
try{execFileSync('tsc',['--target','ES2022','--module','ES2022','--skipLibCheck','--outDir',dir,src],{stdio:'pipe'});}
catch(err){rmSync(dir,{recursive:true,force:true});throw err}
const {crossedCue,explorationCues,rushCues,bloomDeterioration}=await import(pathToFileURL(join(dir,'urgency.js')));
process.on('exit',()=>rmSync(dir,{recursive:true,force:true}));
test('Exploración: los avisos son progresivos y nunca se repiten en el siguiente tick',()=>{
 assert.equal(crossedCue('exploration',361,359)?.id,'exploration-360');
 assert.equal(crossedCue('exploration',359,358),null);
 assert.equal(crossedCue('exploration',181,179)?.id,'exploration-180');
 assert.equal(crossedCue('exploration',61,59)?.id,'exploration-60');
 assert.equal(crossedCue('exploration',1,0)?.id,'exploration-0');
});
test('Fase final: advertencias a 2:00, 1:30, 1:00, 0:30 y 0:10',()=>{
 assert.deepEqual(rushCues.map(x=>x.seconds),[120,90,60,30,10]);
 assert.equal(crossedCue('rush',91,89)?.id,'rush-90');
 assert.equal(crossedCue('rush',61,59)?.id,'rush-60');
 assert.equal(crossedCue('rush',31,29)?.id,'rush-30');
 assert.equal(crossedCue('rush',11,9)?.id,'rush-10');
});
test('No revela las respuestas ni la ubicación de la llave',()=>{
 const all=[...explorationCues,...rushCues].map(x=>x.title+' '+x.description).join(' ');
 assert.doesNotMatch(all,/\b(?:escritorio|274|08:40|disco azul|luna.*lluvia.*flor)\b/i);
});
test('Se descarta el aviso viejo si salta más de un umbral',()=>{
 assert.equal(crossedCue('rush',93,28)?.id,'rush-30');
 assert.equal(crossedCue('exploration',400,25)?.id,'exploration-60');
});
test('El deterioro de plantas es gradual, limitado y se recupera al reiniciar',()=>{
 assert.equal(bloomDeterioration('exploration',540000,540000),0);
 assert.equal(bloomDeterioration('exploration',0,540000),.28);
 assert.equal(bloomDeterioration('rush',120000,120000),.28);
 assert.equal(bloomDeterioration('rush',0,120000),1);
});
test('Al comenzar se busca una llave, pero sin indicar dónde está',()=>{
 const source=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
 const mission=source.match(/title:'El reloj detenido'.*?task:'([^']+)'/s)?.[1];
 assert.match(mission,/llave de bronce/i);
 assert.doesNotMatch(mission,/escritorio|mesa|dónde/i);
});
