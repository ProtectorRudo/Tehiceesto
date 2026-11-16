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
test("el primer impacto usa recursos abstractos originales, no figuras humanas deformadas",()=>{
 assert.ok(read("public/icon.svg").includes("<svg"));
 assert.ok(page.includes('className="hero-art hero-abstract"'));
 assert.ok(page.includes('className="onboarding-art onboarding-abstract"'));
 assert.ok(!page.includes("Dos personas abrazadas mirando un atardecer"));
 assert.ok(!css.includes("couple-sunset.svg"));
});
test("portada, bienvenida, navegación, misiones y juegos tienen pantalla",()=>{
 for(const item of ["app marketing","onboarding-route","main-app","mission-filter","mission-archive",'tab==="juegos"','tab==="preguntas"',"question-spotlight"])
  assert.ok(page.includes(item),item);
});
test("perfil es pantalla propia y mantiene controles de privacidad",()=>{
 for(const item of ['tab==="perfil"',"cp_export_my_personal_data","cp_reset_my_ai_profile","requestNotifications","disableNotifications","notificationSettings"])
  assert.ok(page.includes(item),item);
});
test("navegación de cinco destinos, con misiones en Hoy y preguntas en Juegos",()=>{
 for(const item of ['["hoy"','["juegos"','["nosotros"','["mensajes"','["complice"'])assert.ok(page.includes(item));
 assert.ok(!page.includes('["misiones"'));
 assert.ok(!page.includes('tab==="misiones"'));
 assert.ok(page.includes('className="play-hub-nav"'));
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

test("Hoy no duplica la portada de marketing y ofrece una misión útil",()=>{
 assert.ok(page.includes('className="primary-mission mission-spotlight"'));
 assert.ok(page.includes("pickFocusMission({todayTasks,pendingTasks,weeklyTasks"));
 assert.ok(page.includes("OPTIONAL_GESTURE.title"));
 assert.ok(page.includes("focusMissionHeading(focusMission,date)"));
 assert.ok(page.includes("mission-archive"));
 assert.ok(!page.includes('className="accent-card today-hero"'));
 assert.ok(css.includes(".optional-gesture"));
 assert.ok(css.includes(".today-welcome"));
 assert.ok(css.includes("@media(max-width:375px)"));
});
