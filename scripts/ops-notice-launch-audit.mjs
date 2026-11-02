import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import ts from "typescript";

const bridge=fs.readFileSync("supabase/functions/payment-bridge/index.ts","utf8");
const admin=fs.readFileSync("supabase/functions/admin-api/index.ts","utf8");
const panel=fs.readFileSync("app/admin/operaciones/page.tsx","utf8");
const migration=fs.readFileSync("supabase/migrations/20261102181000_tehiceesto_ops_notice_retry.sql","utf8");

// Authoritative provider verification happens BEFORE the operations notice.
assert(bridge.indexOf("verifyProviderOrder(providerOrderId")<bridge.lastIndexOf("sendOpsNotice("));
assert(bridge.includes('if(status!=="pending")'));
assert(bridge.includes('if(next==="approved"&&!order.ops_notice_sent_at&&opsCanAttempt)'));
assert(bridge.includes('.eq("provider","mercadopago").eq("status","approved")'));
assert(bridge.includes('.is("ops_notice_sent_at",null)'));
assert(bridge.includes('ops_notice_last_attempt_at.is.null,ops_notice_last_attempt_at.lt.'));
assert(bridge.includes('"Idempotency-Key":"thi-ops-"+orderId'));
assert(bridge.includes("ops_notice_sent_at:new Date().toISOString()"));
assert(bridge.includes("function declaredAddOnCode(story:unknown)"),"Must keep live bundle declaration");
assert(bridge.includes("function isBundledExtra("),"Must keep live bundle validation");
assert(bridge.includes("bundle_experience_link_mismatch"),"Must keep paid secondary experience validation");
assert(bridge.includes("bundle_child_activation_failed"),"Must keep child gift entitlement logic");
assert(bridge.includes('if(code==="personalized_experience_v1")'),"Must keep personalized add-on logic");

assert(bridge.includes('String(Deno.env.get("TEHICEESTO_OPS_EMAIL")||"").trim()'));
assert(bridge.includes('email_transport_not_configured'));
assert(bridge.includes('rpc("tehiceesto_private_ops_email")'),"The production operations recipient must be resolved from encrypted Vault via RPC");
const vaultMigration=fs.readFileSync("supabase/migrations/20261102183000_tehiceesto_private_ops_email.sql","utf8");
assert(vaultMigration.includes("FROM vault.decrypted_secrets"));
assert(vaultMigration.includes("GRANT EXECUTE ON FUNCTION public.tehiceesto_private_ops_email() TO service_role"));
assert(vaultMigration.includes("REVOKE ALL ON FUNCTION public.tehiceesto_private_ops_email() FROM PUBLIC"));
assert(!vaultMigration.includes("@gmail.com"),"Do not commit the operator's personal email");

assert(admin.includes("opsNoticeAccepted:!!order.ops_notice_sent_at"));
assert(panel.includes("Falta configurar correo del equipo"));
assert(migration.includes("ops_notice_last_attempt_at is not null"));
assert(migration.includes("Historic approvals with no ops attempt are explicitly excluded"));
assert(migration.includes("pg_get_functiondef"));
assert(!migration.includes("cron.schedule"),"Do not create duplicate cron jobs");

// Exercise the actual Deno production helper in isolated mocks. Never
// connect to Supabase, Mercado Pago or a real mail provider in this audit.
const start=bridge.indexOf("function escapeHtml(");
const end=bridge.indexOf("// A signed request is not proof of payment:");
assert(start>0&&end>start);
const isolated=ts.transpileModule(bridge.slice(start,end),{
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},
 reportDiagnostics:true,
});
assert.equal((isolated.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
const calls=[],rpcCalls=[],state={opsEmail:"",vaultEmail:"",apiKey:"fake",providerStatus:200};
const sandbox={
 Deno:{env:{get:k=>k==="TEHICEESTO_OPS_EMAIL"?state.opsEmail:
   k==="RESEND_API_KEY"?state.apiKey:k==="TEHICEESTO_EMAIL_FROM"?"Te Hice Esto <hola@tehiceesto.com>":""}},
 client:()=>({rpc:async(name)=>{rpcCalls.push(name);return {data:name==="tehiceesto_private_ops_email"?state.vaultEmail:"rpc-fake-key",error:null}}}),
 fetch:async (url,options)=>{calls.push({url,options});return{ok:state.providerStatus===200,status:state.providerStatus}},
 AbortSignal,Intl,Date,console,
};
vm.createContext(sandbox);vm.runInContext(isolated.outputText,sandbox);
const send=(id,email,slug,amount)=>vm.runInContext(
 `sendOpsNotice(${JSON.stringify(id)},${JSON.stringify(email)},${JSON.stringify(slug)},${Number(amount)})`,sandbox);
let result=await send("11111111-2222-3333-4444-555555555555","buyer@example.test","pareja",2500000);
assert.equal(result.ok,false);
assert.equal(result.error,"ops_recipient_not_configured");
assert.equal(calls.length,0,"Never send to an undeclared recipient");
state.vaultEmail="ops@tehiceesto.example";
result=await send("11111111-2222-3333-4444-555555555555","buyer@example.test","pareja",2500000);
assert.equal(result.ok,true);
assert.equal(calls.length,1);
assert(rpcCalls.includes("tehiceesto_private_ops_email"),"Must read the service-only vault recipient");
assert.equal(calls[0].url,"https://api.resend.com/emails");
assert.equal(calls[0].options.headers["Idempotency-Key"],"thi-ops-11111111-2222-3333-4444-555555555555");
const sent=JSON.parse(calls[0].options.body);
assert.deepEqual(sent.to,["ops@tehiceesto.example"]);
assert(sent.text.includes("$ 25.000")||sent.text.includes("$ 25.000")||sent.text.includes("25.000"));
assert(!sent.html.includes("payment_token"));
assert(!sent.html.includes("service_role"));
result=await send("22222222-3333-4444-5555-666666666666","a<b>@example.test","amistad<script>",2500000);
assert.equal(result.ok,true);
assert(!JSON.parse(calls[1].options.body).html.includes("<script>"),"Escape user-controlled HTML");
state.providerStatus=429;
result=await send("33333333-4444-5555-6666-777777777777","buyer@example.test","mama",2500000);
assert.equal(result.ok,false);
assert.equal(result.error,"email_rate_limited");
state.providerStatus=200;state.apiKey="";
result=await send("44444444-5555-6666-7777-888888888888","buyer@example.test","papa",2500000);
assert.equal(result.ok,true);
console.log("OPS_NOTICE_QA_PASS",JSON.stringify({cases:5,simulatedEmails:calls.length,noNetwork:true}));
