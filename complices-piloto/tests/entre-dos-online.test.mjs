import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {html as original} from "../lib/private-entre-dos.mjs";
const base=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const text=path=>readFileSync(resolve(base,path),"utf8");
const client=text("components/EntreDosOnline.jsx"),server=text("app/api/games/route.js"),page=text("app/page.jsx");
test("las 90 cartas son las originales, con respuestas y preguntas de conversación",()=>{
 const raw=original.match(/const BANK=(\[[\s\S]*?\]);/);assert.ok(raw);
 const cards=JSON.parse(raw[1]);
 assert.equal(cards.length,90);
 assert.ok(cards.every(x=>typeof x.q==="string"&&typeof x.a==="string"&&typeof x.b==="string"&&typeof x.talk==="string"));
});
test("Entre Dos ofrece modo un celular y modo dos celulares",()=>{
 assert.ok(page.includes("Jugar en un celular"));
 assert.ok(page.includes("Dos celulares ↗"));
 assert.ok(page.includes("openOnlineEntre"));
 assert.ok(page.includes("onExit={()=>setOnlineEntre(null)}"));
});
test("el modo de dos celulares requiere dos cuentas vinculadas",()=>{
 assert.ok(page.includes("if(!partner){setFullGameError"));
 assert.ok(client.includes("missingPartner"));
 assert.ok(client.includes("cp_entre_dos_state"));
});
test("cada respuesta se escribe sólo en una tabla RLS separada de juegos existentes",()=>{
 assert.ok(client.includes('db.from("cp_entre_dos_answers")'));
 assert.ok(client.includes("user_id:user.id"));
 assert.ok(!client.includes('db.from("cp_game_entries")'));
});
test("el resultado se revela únicamente cuando ambas personas respondieron",()=>{
 assert.ok(client.includes("cp_entre_dos_reveal"));
 assert.ok(client.includes("reveal?.ready"));
 assert.ok(client.includes("Tu respuesta quedó guardada"));
 assert.ok(client.includes("Esperando a"));
 assert.ok(client.includes("answers.find(x=>x.user_id!==user?.id)"));
});
test("siguiente ronda sincronizada para ambos celulares y sin cron ni Web Push",()=>{
 assert.ok(client.includes("cp_entre_dos_next"));
 assert.ok(client.includes("setInterval"));
 assert.ok(client.includes("visibilitychange"));
 assert.ok(!client.includes("Notification.requestPermission"));
});
test("la API entrega tarjetas sólo por pedido autenticado del usuario del espacio",()=>{
 assert.ok(server.includes('url.searchParams.get("mode")==="online"'));
 assert.ok(server.includes("db.auth.getUser(token)"));
 assert.ok(server.includes('db.from("cp_members")'));
 assert.ok(server.includes('mode:"two-devices"'));
 assert.ok(server.includes("cards.length!==90"));
});
test("una partida de dos celulares no altera TeHiceEsto ni crea competencia por corazones",()=>{
 assert.ok(!client.includes("cp_completions"));
 assert.ok(!client.includes("cp_ai_activities"));
 assert.ok(!client.includes("orders"));
 assert.ok(!client.includes("mercadopago"));
});
