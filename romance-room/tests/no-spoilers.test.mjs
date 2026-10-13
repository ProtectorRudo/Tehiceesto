import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');

test('el inicio no anticipa dónde está la llave',()=>{
  const start=src.split('const begin=()=>{')[1].split('const resetAll=')[0];
  assert.doesNotMatch(start,/toast\(/);
  assert.match(start,/setNotification\(''\)/);
  const mission=src.split("title:'El reloj detenido'")[1].split('},')[0];
  assert.match(mission,/task:'Encontrá una pequeña llave de bronce/);
  assert.doesNotMatch(mission,/task:'[^']*(?:escritorio|sobre la mesa|está escondida)/i);
});
test('la ubicación exacta solo se revela en pista voluntaria de nivel 3',()=>{
  const entry=src.split("if(what==='desk')")[1].split("if(what==='clock')")[0];
  assert.doesNotMatch(entry,/(?:llave está|llave de bronce).*?(?:sobre|escritorio)/i);
  const clock=src.split("if(what==='clock')")[1].split("if(what==='gramophone')")[0];
  assert.doesNotMatch(clock,/llave.*escritorio/i);
  assert.match(src,/La ubicación|Sobre el escritorio hay una llave de bronce/);
  assert.match(src,/setShowHelp\(v=>!v\)/);
});
test('ocho y cuatro aparecen en minúsculas en los mensajes de los objetos',()=>{
  assert.match(src,/sol de cobre tiene ocho rayos/);
  assert.match(src,/fuente hay cuatro ondas/);
  assert.doesNotMatch(src,/\b(?:OCHO|CUATRO)\b/);
});
