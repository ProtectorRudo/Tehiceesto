import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import ts from "typescript";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const source=read("data/escape-rooms.ts");
const js=ts.transpileModule(source,{
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}
}).outputText;
const module={exports:{}};
runInNewContext(js,{module,exports:module.exports,URL});
const {escapeRooms,getEscapeRoom,getActiveEscapeRoom,validateEscapeConfig,getEscapeSource}=module.exports;

test("The public escape catalog contains two rooms and never offers the theater",()=>{
 assert.equal(escapeRooms.length,2);
 assert.deepEqual(Array.from(escapeRooms,r=>r.slug).sort(),["caso-m","ultima-campanada"]);
 assert.equal(getActiveEscapeRoom("ultima-funcion"),undefined);
 assert.equal(escapeRooms.some(r=>r.url.includes("la-ultima-funcion")),false);
});

test("Historical theater gifts retain their original version and private link rendering",()=>{
 const archived=getEscapeRoom("ultima-funcion");
 assert.ok(archived,"Prior paid gifts must remain readable");
 assert.equal(archived.title,"La Última Función");
 assert.equal(new URL(archived.url).hostname,"la-ultima-funcion.vercel.app");
 assert.equal(getEscapeRoom("caso-m").slug,"caso-m");
 assert.equal(getEscapeRoom("ultima-campanada").slug,"ultima-campanada");
 const configured=validateEscapeConfig(archived,{
  nombre:"Destinataria histórica",evento:"Una sorpresa",mensaje:"Mensaje personal"
 });
 const url=getEscapeSource(archived,configured);
 assert.equal(new URL(url).searchParams.get("nombre"),"Destinataria histórica");
 assert.equal(new URL(url).searchParams.get("mensaje"),"Mensaje personal");
 const privateRoute=read("app/escape-r/[code]/page.tsx");
 const privateEditor=read("app/admin/escapes/[code]/page.tsx");
 assert.match(privateRoute,/getEscapeRoom\(/);
 assert.match(privateEditor,/getEscapeRoom\(/);
 assert.match(read("lib/gifts/purchased-renderers.mjs"),/escape-ultima-funcion/);
});

test("New theater demos and new theater invitations are blocked at their entrypoints",()=>{
 const demo=read("app/escapes/[slug]/page.tsx");
 const admin=read("app/admin/escapes/actions.ts");
 assert.match(demo,/getActiveEscapeRoom\(slug\)/);
 assert.match(demo,/if\(!room\)notFound\(\)/);
 assert.match(admin,/const room=getActiveEscapeRoom\(slug\)/);
 assert.match(admin,/if\(!room\)throw new Error\("invalid_room"\)/);
 // Existing invitations are still allowed to be edited by their original owners.
 assert.match(admin,/getEscapeRoom\(/);
});

test("All visible public copy accurately promises exactly two remaining escapes",()=>{
 const catalog=read("app/escapes/page.tsx");
 const home=read("app/page.tsx");
 const admin=read("app/admin/escapes/page.tsx");
 assert.ok(catalog.includes("Dos mundos tridimensionales, dos formas de sorprender"));
 assert.ok(catalog.includes("escapeRooms.length"));
 assert.ok(home.includes("Dos misterios para jugar."));
 assert.ok(home.includes("DOS MISTERIOS."));
 assert.doesNotMatch(catalog,/Tres mundos|tres formas|La Última Función/);
 assert.doesNotMatch(home,/TRES MISTERIOS|Tres misterios para jugar/);
 assert.ok(admin.includes("escapeRooms.map"));
 assert.doesNotMatch(admin,/estas tres salas/);
});
