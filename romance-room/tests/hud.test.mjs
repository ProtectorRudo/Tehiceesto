import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/ui/style.css',import.meta.url),'utf8');
test('timer stays visible from game start, not only in the final stage',()=>{
 assert.match(app,/started&&<div className="game-hud"/);
 assert.match(app,/formatRemaining\(countdownIsFinal\?remaining:explorationRemaining\)/);
 assert.match(app,/explorationClock\.current\.start\(performance\.now\(\),540000\)/);
 assert.match(app,/ÚLTIMA CAMPANADA/);
 assert.match(css,/\.game-hud\{position:absolute;z-index:9/);
});
test('visible hint button shows clear label, current puzzle hint, and remains above dialogs',()=>{
 assert.match(app,/aria-label=\{showHelp\?'Cerrar pista':'Ver pista del acertijo actual'\}/);
 assert.match(app,/showHelp\?'Cerrar':'Pista'/);
 assert.match(app,/copy\[progress\.stage\]\.hint/);
 assert.match(css,/\.help-panel\{position:absolute;top:calc\(128px.*z-index:11/);
});
test('timers pause in background to prevent unfair losses on mobile',()=>{
 assert.match(app,/explorationClock\.current\.pause\(performance\.now\(\)\)/);
 assert.match(app,/rushClock\.current\.pause\(performance\.now\(\)\)/);
 assert.match(app,/explorationClock\.current\.resume\(performance\.now\(\)\)/);
});
