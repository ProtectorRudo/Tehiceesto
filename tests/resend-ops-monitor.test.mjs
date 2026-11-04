import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Delivery telemetry is private, non-identifying, and only service role can read or insert",()=>{
 const migration=read("supabase/migrations/20261104121608_resend_delivery_webhook_tracking.sql");
 assert.match(migration,/create table if not exists public\.thi_resend_delivery_events/);
 assert.match(migration,/enable row level security/);
 assert.match(migration,/revoke all on public\.thi_resend_delivery_events from public, anon, authenticated/);
 assert.match(migration,/grant select, insert on public\.thi_resend_delivery_events to service_role/);
 assert.match(migration,/grant execute on function public\.tehiceesto_private_resend_webhook_secret\(\)\s+to service_role/);
 for(const pii of ["buyer_email","recipient_email","subject","raw_payload","gift_code","to_address"])
   assert.doesNotMatch(migration,new RegExp("\\b"+pii+"\\b"));
});

test("Admin summary requires existing admin session, counts only anonymous event categories",()=>{
 const code=read("supabase/functions/admin-api/index.ts");
 const gate=code.indexOf('if (!(await sessionValid(req)))');
 const action=code.indexOf('if (action === "listSales")');
 assert.ok(gate>0&&action>gate);
 assert.match(code,/\.eq\("provider","mercadopago"\)/);
 assert.match(code,/\.from\("thi_resend_delivery_events"\)/);
 assert.match(code,/\.select\("event_type,received_at"\)/);
 assert.match(code,/return json\(origin,\{sales,emailDelivery:/);
 assert.doesNotMatch(code,/from\("thi_resend_delivery_events"\)[\s\S]{0,120}select\(".*email_id/);
});

test("Private operations page describes what is verified and what is not",()=>{
 const page=read("app/admin/operaciones/page.tsx");
 assert.match(page,/isAdminAuthenticated\(\)/);
 assert.match(page,/Entrega de correos · Resend/);
 assert.match(page,/Entregas confirmadas/);
 assert.match(page,/servidor de destino, no lectura/);
 assert.match(page,/Estas cifras no se asocian individualmente a los pedidos/);
 assert.match(page,/No se reenvía automáticamente/);
});
