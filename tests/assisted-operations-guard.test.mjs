import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const page=readFileSync(new URL("../app/admin/operaciones/page.tsx",import.meta.url),"utf8");
const actions=readFileSync(new URL("../app/admin/operaciones/actions.ts",import.meta.url),"utf8");

test("Assisted production is an authenticated, staff-only workflow",()=>{
 assert.match(page,/if\(!authenticated\)return/);
 assert.match(page,/adminRequest\("listSales"\)/);
 assert.match(page,/Producción asistida del equipo/);
 assert.match(page,/Contactar/);
 assert.match(page,/Reunir recuerdos/);
 assert.match(page,/Personalizar/);
 assert.match(page,/Revisar y entregar/);
});

test("Existing purchase cannot be edited by the public through the operations page",()=>{
 assert.match(page,/\{paid&&<div className="ops-actions">/);
 assert.match(page,/admin\/gifts\/.*encodeURIComponent\(s\.code\)/);
 assert.match(page,/\/preview/);
 assert.match(actions,/isAdminAuthenticated\(\)/);
 assert.match(page,/Los pagos se acreditan únicamente mediante Mercado Pago/);
});

test("Operator flow keeps existing buyer email, contact status and gift publishing contracts untouched",()=>{
 assert.match(page,/accessNeedsReview\(s\)/);
 assert.match(page,/s\.accessEmailAccepted/);
 assert.match(page,/s\.opsNoticeAccepted/);
 assert.match(page,/markContacted/);
 assert.match(page,/Transición pendiente/);
 assert.match(page,/acceso automático a «Mis regalos»/);
});
