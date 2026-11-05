import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const order=read("supabase/functions/order-create/index.ts");
const account=read("supabase/functions/gift-account/index.ts");
const studio=read("supabase/functions/creator-api/index.ts");
const status=read("supabase/functions/order-status/index.ts");
const portal=read("app/mis-regalos/AccountPortal.tsx");
const receipt=read("components/PostPurchase.tsx");
const home=read("app/page.tsx");
const checkout=read("components/QuickCheckout.tsx");

test("New assisted purchases are server-selected, feature gated and versioned without modifying older orders",()=>{
 assert.match(order,/TEHICEESTO_ASSISTED_PURCHASES_ENABLED/);
 assert.match(order,/Deno\.env\.get\("TEHICEESTO_ASSISTED_PURCHASES_ENABLED"\)==="true"/);
 assert.match(order,/!\["pack-juegos","trazo-complice"\]\.includes\(slug\)/);
 assert.match(order,/mode==="assisted"\?\{fulfillmentVersion:ASSISTED_FULFILLMENT_VERSION\}/);
 assert.match(order,/purchaseStory\(\{name:customerName,email,whatsapp\}/);
 assert.match(order,/addonExperienceSlug\),/);
 assert.match(order,/clientRequestId/);
 assert.match(order,/affiliateAttributed/);
 assert.doesNotMatch(order,/body\.mode|body\.assisted|body\.fulfillmentVersion/);
});

test("Buyer cannot recover or reuse editor credentials for an assisted gift, even with an approved payment",()=>{
 assert.match(account,/rawCreator\.mode==="assisted"&&rawCreator\.fulfillmentVersion==="team-managed-v1"/);
 assert.match(account,/error:"managed_by_team"/);
 assert.match(studio,/creator\.mode==="assisted"&&creator\.fulfillmentVersion==="team-managed-v1"/);
 assert.match(studio,/throw new Error\("studio_unauthorized"\)/);
 assert.match(portal,/gift\.assisted/);
 assert.match(portal,/Consultar al equipo/);
 assert.match(portal,/if \(gift\.assisted \|\| !session \|\| openingCode\) return/);
});

test("Existing self-service buyers and instantly playable games remain supported",()=>{
 assert.match(account,/mode:"selfserve"/);
 assert.match(account,/editorToken,code/);
 assert.match(order,/\["pack-juegos","trazo-complice"\]/);
 assert.match(portal,/Abrir mis cuatro juegos/);
 assert.match(portal,/Jugar versión completa/);
 assert.match(portal,/Editar mi experiencia/);
});

test("Managed orders receive a receipt instead of an editor magic link, with no unsafe OTP fallback",()=>{
 const part=account.split("const creator=gift?.story_data?.creator;")[1]?.split("let combined=false,combinedManaged=false;")[0]||"";
 assert.match(part,/if\(!apiKey\)return \{ok:false,status:503\}/);
 assert.match(part,/thi_assisted_receipt_rejected/);
 assert.doesNotMatch(part,/generateLink|\/auth\/v1\/otp/);
 assert.match(account,/return null; \/\/ Historical self-serve buyers retain the legacy OTP fallback/);
 assert.match(account,/\.eq\("buyer_email",email\)\.eq\("status","approved"\)/);
});

test("Purchase status and public copy reflect exact mode while preserving older promises",()=>{
 assert.match(status,/assisted\?"preparing":"personalize"/);
 assert.match(status,/assisted,/);
 assert.match(status,/extraExperience=\{slug:child\.experience_slug,code:child\.public_code,/);
 assert.match(status,/assisted:child\.story_data/);
 assert.match(receipt,/const assisted=order\?\.assisted===true/);
 assert.match(receipt,/Nuestro equipo preparará tu regalo/);
 assert.match(receipt,/Ir a Mis regalos y personalizar/);
 assert.match(home,/PERSONALIZADO POR NUESTRO EQUIPO/);
 assert.match(checkout,/nuestro equipo se comunicará/);
 assert.match(checkout,/Una sola compra de \$25\.000 ARS/);
});
