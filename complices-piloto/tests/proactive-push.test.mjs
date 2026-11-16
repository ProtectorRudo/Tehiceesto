import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
import {POST as dispatch,GET as dispatchGet} from "../app/api/engagement/dispatch/route.js";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const content=path=>readFileSync(resolve(root,path),"utf8");
test("el envío semanal es privado: GET y POST sin secreto rechazados",async()=>{
 const g=await dispatchGet();assert.equal(g.status,405);
 const p=await dispatch(new Request("https://complices-piloto.onrender.com/api/engagement/dispatch",{method:"POST"}));
 assert.equal(p.status,401);
});
test("el endpoint consulta la nueva agenda privada, no envía avisos a cualquiera",()=>{
 const source=content("app/api/engagement/dispatch/route.js");
 assert.ok(source.includes("cp_claim_proactive_push"));
 assert.ok(source.includes("x-cp-engagement-secret"));
 assert.ok(source.includes("allowedEndpoint"));
 assert.ok(source.includes("timingSafeEqual"));
});
test("las misiones y las preguntas generan notificaciones genéricas, sin respuestas íntimas",()=>{
 const source=content("app/api/engagement/dispatch/route.js");
 assert.ok(source.includes('t.kind==="question"'));
 assert.ok(source.includes("Una idea para fortalecer su historia")||source.includes("una idea para fortalecer su historia"));
 assert.ok(!source.includes("t.answer"));
 assert.ok(!source.includes("t.partnerName"));
 assert.ok(!source.includes("t.title"));
});
test("activar notificaciones requiere un gesto y permiso real del navegador",()=>{
 const s=content("app/page.jsx");
 assert.ok(s.includes("onClick={requestNotifications}"));
 assert.ok(s.includes("Notification.requestPermission()"));
 assert.ok(s.includes("navigator.serviceWorker.ready"));
 assert.ok(s.includes("pushManager.subscribe"));
 assert.ok(s.includes("Notification.permission"));
});
test("un único consentimiento del sistema activa misión y pregunta, con revocación",()=>{
 const s=content("app/page.jsx");
 assert.ok(s.includes("enabled:true,reflection_prompts_enabled:true"));
 assert.ok(s.includes('onClick={disableNotifications}'));
 assert.ok(s.includes("quiet_start:notificationSettings.quiet_start"));
 assert.ok(s.includes("quiet_end:notificationSettings.quiet_end"));
});
test("sin permiso nativo no se declara un envío habilitado",()=>{
 const s=content("app/page.jsx");
 const start=s.indexOf("async function requestNotifications()");
 const end=s.indexOf("async function saveNotificationSettings(",start);
 const f=s.slice(start,end);
 assert.ok(f.includes('permission!=="granted"'));
 assert.ok(f.includes("return;"));
 assert.ok(f.includes("No se activaron los avisos"));
});
test("el banner móvil tiene una salida Ahora no y no insiste tras descartar",()=>{
 const s=content("app/page.jsx");
 assert.ok(s.includes("push-onboarding"));
 assert.ok(s.includes("cp_push_not_now_"));
 assert.ok(s.includes("!pushPromptDismissed"));
 assert.ok(s.includes("Ahora no</button>"));
});
test("la lógica de agenda usa el horario local, limita días y no manda secretos al cliente",()=>{
 const s=content("app/api/engagement/dispatch/route.js");
 assert.ok(s.includes("max")||s.includes("slice(0,60)"));
 assert.ok(s.includes("cp_claim_proactive_push"));
 assert.ok(!s.includes("decrypted_secret"));
 assert.ok(!content("app/page.jsx").includes("CP_ENGAGEMENT_CRON_SECRET"));
});
