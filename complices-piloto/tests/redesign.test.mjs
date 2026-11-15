import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=(path)=>readFileSync(resolve(root,path),"utf8");
const page=read("app/page.jsx"),css=read("app/paired-redesign.css"),layout=read("app/layout.jsx");

test("el sistema visual claro se carga después de los estilos históricos",()=>{
 assert.ok(layout.indexOf("globals.css")>=0);
 assert.ok(layout.indexOf("paired-redesign.css")>layout.indexOf("globals.css"));
 assert.ok(css.includes("--berry:#6a2e5b"));
 assert.ok(css.includes("--pink:#e75f86"));
});
test("la identidad gráfica original de la pareja está disponible",()=>{
 const svg=read("public/couple-sunset.svg");
 assert.match(svg,/<svg/);
 assert.match(svg,/<title/);
 assert.match(svg,/Dos personas/);
 assert.ok(read("public/icon.svg").includes("<svg"));
});
test("portada, bienvenida, navegación, misiones y juegos tienen pantalla",()=>{
 for(const item of ["app marketing","onboarding-route","main-app","mission-filter",'tab==="misiones"','tab==="juegos"','tab==="preguntas"',"question-spotlight"])
  assert.ok(page.includes(item),item);
});
test("perfil es pantalla propia y mantiene controles de privacidad",()=>{
 for(const item of ['tab==="perfil"',"cp_export_my_personal_data","cp_reset_my_ai_profile","requestNotifications","disableNotifications","notificationSettings"])
  assert.ok(page.includes(item),item);
});
test("la navegación móvil conserva los cinco destinos principales",()=>{
 for(const item of ['["hoy"','["misiones"','["juegos"','["mensajes"','["complice"'])assert.ok(page.includes(item));
 assert.ok(page.includes("NavIcon name={key}"));
});
test("permanecen accesibles el registro y las invitaciones",()=>{
 for(const item of ["db.auth.signUp","db.auth.signInWithPassword","cp_create_space","cp_join_by_invite"])
  assert.ok(page.includes(item),item);
});
test("se conserva la personalización con consentimiento",()=>{
 for(const item of ["cp_ai_memories","share_for_surprises","cp_ai_feedback","/api/central","cp_reflections"])
  assert.ok(page.includes(item),item);
});
test("se atiende al tamaño de pantalla y al movimiento reducido",()=>{
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
