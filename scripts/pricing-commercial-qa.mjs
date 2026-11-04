import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const checkout=source("components/QuickCheckout.tsx");
const backend=source("supabase/functions/order-create/index.ts");
const frontAudit=source("scripts/quick-checkout-audit.mjs");
const addonAudit=source("scripts/precheckout-addon-qa.mjs");

test("All commercial products show ARS 25,000, with a single optional ARS 10,000 add-on",()=>{
 assert.match(checkout,/const basePriceMinor=2_500_000;/);
 assert.match(checkout,/const addonPriceMinor=1_000_000;/);
 assert.ok(!checkout.includes("Precio de prueba"));
 assert.ok(!checkout.includes("PRECIO DE PRUEBA"));
 assert.ok(!checkout.includes("$1.000"));
 assert.match(checkout,/Una sola compra de \$25\.000 ARS/);
 assert.match(checkout,/Agregar pack por \$10\.000/);
 assert.match(checkout,/Agregar experiencia por \$10\.000/);
 assert.match(checkout,/Number\(result.priceMinor\)!==totalMinor/);
});

test("Commercial backend uses commerce settings for gift pricing and a separate ARS 10,000 add-on",()=>{
 assert.match(backend,/const commercePriceMinor=Number\(commerce\?\.default_price_minor\)/);
 assert.match(backend,/const basePriceMinor=experienceSlug==="pack-juegos"&&!trialPricing\?2500000:commercePriceMinor/);
 assert.match(backend,/const addonPriceMinor=trialPricing\?100000:1000000/);
 assert.match(backend,/const priceMinor=basePriceMinor\+\(addOnCode\?addonPriceMinor:0\)/);
 assert.match(backend,/existingOrder\.amount_minor\)!==priceMinor/);
});
test("Browser QA uses production price and enforces single-payment bundle",()=>{
 assert.match(frontAudit,/priceMinor:2_500_000/);
 assert.match(addonAudit,/priceMinor:3_500_000/);
 assert.match(addonAudit,/35\\\.000/);
 assert.match(addonAudit,/25\\\.000/);
});

test("Post-sale operations prioritize paid orders and expose existing authorized contact action",()=>{
 const page=source("app/admin/operaciones/page.tsx");
 const actions=source("app/admin/operaciones/actions.ts");
 assert.ok(page.includes("accessReview=sales.filter(accessNeedsReview)"));
 assert.ok(page.includes("historicalReview=sales.filter(historicalApprovalNeedsReview)"));
 assert.ok(page.includes("Correos de acceso pendientes"));
 assert.ok(page.includes("sortedSales.map"));
 assert.ok(page.includes("action={markContacted}"));
 assert.ok(page.includes('name="orderId"'));
 assert.ok(page.includes("este panel no envía correos ni modifica pagos"));
 assert.ok(page.includes("Seguimiento interno (opcional)"));
 assert.ok(actions.includes('if(!await isAdminAuthenticated())'));
 assert.ok(actions.includes('adminRequest("markSaleContacted"'));
});
