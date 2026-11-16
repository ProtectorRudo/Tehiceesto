import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
import {html as entreDos} from "../lib/private-entre-dos.mjs";
import {html as memeMatch} from "../lib/private-meme-match.mjs";
import {originalWordBank} from "../lib/private-trazo-words.mjs";
import {GET as getGame} from "../app/api/games/route.js";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const source=path=>readFileSync(resolve(root,path),"utf8");
test("se reutilizan los tres juegos completos originales sin tocar TeHiceEsto",()=>{
 assert.ok(entreDos.length>25000);
 assert.ok(memeMatch.length>100000);
 assert.ok(source("public/juegos/trazo/game.js").length>25000);
 assert.ok(source("public/juegos/trazo/styles.css").length>20000);
});
test("Entre Dos conserva todas las 90 preguntas y la interacción original",()=>{
 const r=entreDos.match(/const BANK=(\[[\s\S]*?\]);/);
 assert.ok(r,"Original game question bank found");
 const cards=JSON.parse(r[1]);
 assert.equal(cards.length,90);
 assert.equal(new Set(cards.map(x=>x.q)).size,90);
 assert.ok(cards.every(x=>x.a&&x.b&&x.talk));
 assert.match(entreDos,/case 'select'|case 'choose1'|data-action=/);
});
test("Meme Match conserva las 48 parejas reales de memes",()=>{
 const s=memeMatch;
 assert.match(s,/const memes=\[/);
 const p=s.indexOf("const memes="),q=s.indexOf(";\n",p);
 const memes=JSON.parse(s.slice(p+"const memes=".length,q));
 assert.equal(memes.length,48);
 assert.equal(new Set(memes.map(x=>x.id)).size,48);
 assert.ok(memes.every(x=>x.img.startsWith("data:image/")&&x.name));
 assert.match(s,/function initGame\(\)/);
});
test("Trazo conserva el banco completo, categorías y dibujo táctil",()=>{
 const {words,categories}=originalWordBank();
 assert.equal(words.length,1274);
 assert.ok(Object.keys(categories).length>=5);
 assert.equal(new Set(words.map(w=>w.label.toLocaleLowerCase("es-AR"))).size,words.length);
 const js=source("public/juegos/trazo/game.js");
 assert.ok(js.includes("pointerdown"));
 assert.ok(js.includes("window.TRAZO_WORD_BANK"));
 assert.ok(!js.includes("fetch("));
});
test("ninguno de los tres catálogos se publica bajo public/ ni se importa desde la página",()=>{
 const page=source("app/page.jsx"),api=source("app/api/games/route.js");
 assert.ok(!page.includes("private-entre-dos"));
 assert.ok(!page.includes("private-meme-match"));
 assert.ok(!page.includes("private-trazo-words"));
 assert.ok(api.includes('await import("../../../lib/private-entre-dos.mjs")'));
 assert.ok(api.includes('await import("../../../lib/private-meme-match.mjs")'));
 assert.ok(api.includes('await import("../../../lib/private-trazo-words.mjs")'));
 assert.ok(api.includes('db.from("cp_members")'));
 assert.ok(api.includes("db.auth.getUser(token)"));
});
test("las rutas no entregan juegos completos sin usuario autenticado",async()=>{
 for(const name of ["entre-dos","meme-match","trazo-complice"]){
  const result=await getGame(new Request("https://complices-piloto.onrender.com/api/games?game="+name));
  assert.equal(result.status,401,name);
  assert.ok(!(await result.json()).html);
 }
 const bad=await getGame(new Request("https://complices-piloto.onrender.com/api/games?game=otro"));
 assert.equal(bad.status,404);
});
test("API informa que los motores originales son para compartir un teléfono",()=>{
 const s=source("app/api/games/route.js");
 assert.ok(s.includes('mode:"single-device"'));
 assert.ok(s.includes("se pasan el celular"));
 assert.ok(s.includes('window.TRAZO_IS_DEMO=false'));
});
test("Cómplices muestra tres botones, carga el juego privado y permite volver",()=>{
 const page=source("app/page.jsx");
 for(const k of ["Trazo Cómplice","Meme Match","Entre Dos","/api/games?game=","Jugar en un celular","Volver a Cómplices","fullGame.html"])assert.ok(page.includes(k),k);
 assert.ok(page.includes('sandbox="allow-scripts allow-downloads"'));
 assert.ok(page.includes("getSession()"));
 assert.ok(page.includes("role=\"dialog\""));
});
test("los juegos rápidos existentes permanecen disponibles",()=>{
 const page=source("app/page.jsx");
 assert.ok(page.includes('teh-other-games'));
 assert.ok(page.includes('async function playGame'));
 assert.ok(page.includes('async function revealGame'));
 assert.ok(page.includes('cp_game_reveal'));
});
test("los juegos completos no consumen ni modifican el calendario de las misiones",()=>{
 const endpoint=source("app/api/games/route.js");
 assert.ok(!endpoint.includes("cp_completions"));
 assert.ok(!endpoint.includes("cp_ai_activities"));
 assert.ok(!endpoint.includes("cp_game_entries"));
});
