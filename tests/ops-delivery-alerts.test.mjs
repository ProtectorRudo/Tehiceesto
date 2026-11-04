import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {accessNeedsReview,historicalApprovalNeedsReview,saleAttentionPriority,operationalSaleCounts} from "../lib/operations/sale-delivery-audit.mjs";

const base={status:"approved",paidAt:"2026-11-04T08:00:00.000Z",priceMinor:2500000,buyerEmail:"buyer@example.test",accessEmailAccepted:true,contactedAt:null};
const paid=(overrides={})=>({...base,...overrides});

test("Only an approved sale with an actual amount and payment date can require buyer-email followup",()=>{
 assert.equal(accessNeedsReview(paid({accessEmailAccepted:false})),true);
 assert.equal(accessNeedsReview(paid({buyerEmail:"",accessEmailAccepted:false})),true);
 assert.equal(accessNeedsReview(paid({buyerEmail:"  ",accessEmailAccepted:false})),true);
 assert.equal(accessNeedsReview(paid()),false);
 assert.equal(accessNeedsReview(paid({status:"cancelled",accessEmailAccepted:false})),false);
 assert.equal(accessNeedsReview(paid({status:"refunded",accessEmailAccepted:false})),false);
 assert.equal(accessNeedsReview(paid({status:"pending",accessEmailAccepted:false})),false);
});

test("Historical or incomplete records never masquerade as newly unpaid delivery failures",()=>{
 for(const x of [paid({priceMinor:null}),paid({priceMinor:0}),paid({priceMinor:-10}),paid({paidAt:null})]){
  assert.equal(historicalApprovalNeedsReview(x),true);
  assert.equal(accessNeedsReview(x),false);
 }
 assert.equal(historicalApprovalNeedsReview(paid({status:"cancelled",priceMinor:null})),false);
});

test("Dashboard counts are actionable, provider scoped and do not assume mail reaches an inbox",()=>{
 const sales=[
  paid(),
  paid({accessEmailAccepted:false}),
  paid({paidAt:"2026-10-07T17:52:13.474Z",priceMinor:null,accessEmailAccepted:false}),
  paid({status:"cancelled",accessEmailAccepted:false}),
  paid({status:"refunded",accessEmailAccepted:true}),
 ];
 assert.deepEqual(operationalSaleCounts(sales),{
  approved:3,pending:0,accessReview:1,historicalReview:1,total:5
 });
 assert.equal(saleAttentionPriority(sales[1]),3);
 assert.equal(saleAttentionPriority(sales[2]),2);
 assert.equal(saleAttentionPriority(sales[0]),1);
 assert.equal(saleAttentionPriority(sales[3]),0);
});

test("Operational UI displays delivery issues privately without initiating mail or mixing internal grants",()=>{
 const page=readFileSync(new URL("../app/admin/operaciones/page.tsx",import.meta.url),"utf8");
 assert.match(page,/isAdminAuthenticated\(\)/);
 assert.match(page,/accessNeedsReview/);
 assert.match(page,/historicalApprovalNeedsReview/);
 assert.match(page,/Correos de acceso pendientes/);
 assert.match(page,/Aceptada por proveedor \(no garantiza recepción\)/);
 assert.doesNotMatch(page,/sendAccessEmail\(/);
 const admin=readFileSync(new URL("../supabase/functions/admin-api/index.ts",import.meta.url),"utf8");
 assert.match(admin,/\.eq\("provider","mercadopago"\)/);
});
