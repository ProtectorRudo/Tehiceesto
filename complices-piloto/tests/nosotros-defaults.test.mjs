import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {pointsForTask,heartsFor,sharedHearts} from "../lib/couple-hearts.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const source=p=>readFileSync(resolve(root,p),"utf8");
const app=source("app/page.jsx");
const picker=source("components/AvatarPicker.jsx");
const css=source("app/paired-redesign.css");
test("cada integrante obtiene sus corazones sin competir ni descontar inactividad",()=>{
 const rows=[
  {user_id:"a",task_key:"d:2026-11-16:mission-1"},
  {user_id:"a",task_key:"w:2026-11-16:weekly-1"},
  {user_id:"b",task_key:"g:2026-11-16:puzzle"},
  {user_id:"b",task_key:"q:2026-11-16:pregunta"}
 ];
 assert.equal(heartsFor(rows,"a"),160);
 assert.equal(heartsFor(rows,"b"),80);
 assert.equal(heartsFor(rows,"c"),0);
 assert.equal(heartsFor(rows,null),0);
 assert.equal(sharedHearts(rows),240);
 assert.equal(heartsFor([], "a"),0);
});
test("se mantienen los puntos históricos de misiones, juegos y preguntas",()=>{
 assert.equal(pointsForTask("w:2026-11-16:weekly"),120);
 assert.equal(pointsForTask("d:2026-11-16:mission-1"),40);
 assert.equal(pointsForTask("d:2026-11-16:central-1"),40);
 assert.equal(pointsForTask("q:2026-11-16:pregunta"),20);
 assert.equal(pointsForTask("g:2026-11-16:juego"),60);
 assert.equal(pointsForTask("d:2026-11-16:algo"),30);
});
test("Nosotros se encuentra en la navegación superior e inferior",()=>{
 assert.ok(app.includes('["nosotros","♡","Nosotros"]'));
 assert.ok(app.includes('{name==="nosotros"'));
 assert.ok(app.includes('{tab==="nosotros"'));
 assert.ok(app.includes('className="bottom-nav"'));
 assert.ok(app.includes('className="tabs desktop"'));
});
test("perfil muestra corazones propios, de la pareja y los comunes",()=>{
 for(const term of ["ownHearts","partnerHearts","totalHearts","heartsFor(activities,user?.id)","heartsFor(activities,partner?.user_id)","sharedHearts(activities)","No es una clasificación"])assert.ok(app.includes(term),term);
 assert.ok(app.includes('aria-label="Ver nuestros corazones"'));
});
test("cada integrante puede elegir, actualizar y quitar su foto",()=>{
 for(const term of ["type=\"file\"","image/jpeg","image/png","image/webp","avatar.jpg","upsert:true","Cambiar foto","Quitar foto","onSaved"])assert.ok(picker.includes(term),term);
 assert.ok(app.includes('AvatarPicker db={db} user={user}'));
 assert.ok(app.includes('partner?avatarUrls[partner.user_id]:null'));
});
test("las fotos se descargan desde el bucket privado con sesión, nunca por URL pública",()=>{
 assert.ok(app.includes('db.storage.from("cp-avatars").download('));
 assert.ok(!app.includes('getPublicUrl("cp-avatars"'));
 assert.ok(!picker.includes("getPublicUrl"));
 assert.ok(app.includes("URL.revokeObjectURL"));
});
test("personalización y notificaciones se presentan activas por defecto, con salida para desactivarlas",()=>{
 assert.ok(app.includes("Personalización para los dos"));
 assert.ok(app.includes("permiten")||app.includes("las notificaciones requieren")||app.includes("notificaciones requieren"));
 assert.ok(app.includes("Desactivar personalización compartible"));
 assert.ok(app.includes("Desactivar avisos"));
 assert.ok(app.includes("enabled:true,reflection_prompts_enabled:true"));
 assert.ok(app.includes("La personalización de gustos está disponible desde el registro"));
});
test("no se confunde el permiso de la app con el permiso real del dispositivo",()=>{
 assert.ok(app.includes("setPushReady"));
 assert.ok(app.includes('Notification.permission!=="granted"'));
 assert.ok(app.includes("pushReady&&<span"));
 assert.ok(app.includes("Permitir avisos en este celular"));
 assert.ok(app.includes("No se activaron los avisos"));
});
test("UI compacta en móvil con seis accesos y fotos legibles",()=>{
 for(const term of [".our-page",".our-members",".our-member-card",".cp-avatar",".cp-photo-picker",".our-hearts-total",".bottom-nav button"])assert.ok(css.includes(term),term);
 assert.ok(css.includes("@media(max-width:375px)"));
});
