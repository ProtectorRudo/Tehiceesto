import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/scene/World.ts',import.meta.url),'utf8');
test('book spines protrude beyond bookshelf back panel',()=>{
 assert.match(src,/colorGroups\[color\]\.push\(\{x,y,z:\.74/);
 assert.doesNotMatch(src,/colorGroups\[color\]\.push\(\{x,y,z:\.35/);
});
test('gramophone silhouette is corrected without altering puzzle record choices',()=>{
 assert.match(src,/hornProfile/);
 assert.doesNotMatch(src,/\[\.6,1\.02\]/);
 assert.match(src,/'rojo','azul','oro'/);
});