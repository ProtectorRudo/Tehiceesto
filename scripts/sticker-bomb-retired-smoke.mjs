/**
 * Smoke test for withdrawing Sticker Bomb from public sale without touching private gifts.
 * Usage: AUDIT_BASE_URL=http://127.0.0.1:3000 node scripts/sticker-bomb-retired-smoke.mjs
 */
const base=process.env.AUDIT_BASE_URL||"http://127.0.0.1:3000";
const forbidden=/sticker-bomb-amistad|Sticker Bomb/i;
const checked=[];
for(const path of ["/","/crear","/coleccion/amigos","/coleccion/todos"]){
 const res=await fetch(base+path);
 const body=await res.text();
 if(res.status!==200||forbidden.test(body))throw new Error(path+" publicly exposes withdrawn Sticker Bomb: "+res.status);
 checked.push(path+" clean");
}
for(const path of ["/experiencias/sticker-bomb-amistad","/experiencias/sticker-bomb-amistad?embed=1","/comprar/sticker-bomb-amistad"]){
 const res=await fetch(base+path);
 if(res.status!==404)throw new Error(path+" should return HTTP 404, got "+res.status);
 checked.push(path+" 404");
}
for(const path of ["/experiencias/amistad","/comprar/amistad"]){
 const res=await fetch(base+path);
 if(res.status!==200)throw new Error(path+" should stay available, got "+res.status);
 checked.push(path+" 200");
}
const sitemap=await (await fetch(base+"/sitemap.xml")).text();
if(sitemap.includes("sticker-bomb-amistad"))throw new Error("Withdrawn product still present in sitemap");
checked.push("sitemap clean");
for(const [slug,addon] of [["sticker-bomb-amistad",""],["pareja","sticker-bomb-amistad"]]){
 const res=await fetch(base+"/api/checkout",{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({experienceSlug:slug,addonExperienceSlug:addon,
   email:"qa@example.test",whatsapp:"5492215551111",consent:true,
   clientRequestId:"withdrawn-product-qa"})
 });
 const data=await res.json();
 if(res.status!==404||data.error!=="experience_unavailable")
  throw new Error("Checkout still permits withdrawn product: "+JSON.stringify({slug,addon,status:res.status,data}));
 checked.push("checkout "+(addon?"addon":"primary")+" blocked");
}
console.log(JSON.stringify({pass:true,checked},null,2));
