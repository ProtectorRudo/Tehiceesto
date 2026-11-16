import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const page=readFileSync(resolve(root,"app/page.jsx"),"utf8");
const css=readFileSync(resolve(root,"app/paired-redesign.css"),"utf8");
const main=page.split(' {tab==="complice"&&<>')[1]?.split('  {tab==="perfil"&&')[0]||"";
const privacy=page.split('  {tab==="perfil"&&')[1]||"";
test("Cómplice presenta solo 3 opciones claras, no todas las herramientas juntas",()=>{
 assert.ok(main.includes('complice-section-tabs'));
 for(const name of ['Conocerme</button>','Mis gustos</button>','Fechas</button>'])assert.ok(main.includes(name));
 assert.ok(main.includes('compliceView==="conocerme"'));
 assert.ok(main.includes('compliceView==="gustos"'));
 assert.ok(main.includes('compliceView==="fechas"'));
});
test("el bloque de estado de OpenAI y la sugerencia de misión salen de Cómplice",()=>{
 assert.ok(!main.includes("SUGERENCIAS PREPARADAS SOLAS"));
 assert.ok(!main.includes("OpenAI está creando propuestas"));
 assert.ok(!main.includes("UNA IDEA SELECCIONADA PARA HOY"));
 assert.ok(!main.includes("Estado técnico de OpenAI"));
 assert.ok(privacy.includes("Estado técnico de OpenAI"));
});
test("no hay permiso repetido por respuesta en la pantalla central",()=>{
 assert.ok(!main.includes("profile-share-permission"));
 assert.ok(!main.includes("Guardar permiso general"));
 assert.ok(!main.includes("profileShare}"));
 assert.ok(!main.includes("complice-consent"));
});
test("permiso para gustos compartibles se configura solo en Perfil",()=>{
 assert.ok(privacy.includes("Personalización para los dos"));
 assert.ok(privacy.includes("setPartnerPersonalization(!pref?.allow_surprises)"));
 assert.ok(page.includes("share_with_partner_ai:Boolean(pref?.allow_surprises)"));
 assert.ok(page.includes("allow_surprises:false"));
 assert.ok(page.includes("allow_surprises:true"));
});
test("la página no presupone consentimiento previo ni publica secretos por defecto",()=>{
 assert.ok(page.includes("Se activa solo si vos lo elegís"));
 assert.ok(page.includes("no se muestra a tu pareja"));
 assert.ok(!main.includes("pref.allow_surprises} onChange"));
});
test("preguntas profundas y fechas conservan la posibilidad real de guardar",()=>{
 assert.ok(main.includes("onClick={saveDeepAnswer}"));
 assert.ok(main.includes("onClick={saveStructuredProfile}"));
 assert.ok(main.includes("onClick={saveImportantDate}"));
 assert.ok(main.includes("onClick={()=>removeStructuredProfile(q.key)}"));
 assert.ok(main.includes("onClick={()=>deleteImportantDate(d)}"));
});
test("respuestas escritas no pasan al otro y la propia IA recibe contexto aceptado",()=>{
 assert.ok(main.includes("Tu IA puede usarlo para aprender"));
 assert.ok(page.includes("ai_use_allowed:deepUseAI"));
 assert.ok(page.includes("share_for_surprises:false"));
 assert.ok(page.includes("share_theme:null"));
});
test("móvil: presentación compacta, tipografía legible y pestañas táctiles",()=>{
 for(const marker of [".complice-main-panel",".complice-section-tabs",".complice-progress-card","@media(max-width:760px)",".complice-gustos .profile-answer-grid"])assert.ok(css.includes(marker));
});
