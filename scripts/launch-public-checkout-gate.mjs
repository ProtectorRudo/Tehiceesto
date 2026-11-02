import assert from "node:assert/strict";

const targets=[
 {name:"canonical",url:"https://tehiceesto.com"},
 {name:"native",url:"https://tehiceesto.vercel.app"},
];
const results=[];
for(const target of targets){
 const routes=["/","/comprar/pareja","/mis-regalos","/admin/operaciones"];
 for(const path of routes){
  const response=await fetch(target.url+path,{redirect:"follow",signal:AbortSignal.timeout(70000)});
  const html=await response.text();
  const locked=/vercel\.com\/login/.test(response.url);
  console.log("ROUTE_RESULT",JSON.stringify({host:target.name,path,status:response.status,locked,final:response.url,htmlLength:html.length}));
  if(path==="/comprar/pareja"||path==="/mis-regalos")assert.equal(response.status,200,target.name+path+" missing");
  assert.equal(locked,false,target.name+path+" Vercel auth blocked");
 }
 // Deliberately incomplete input MUST fail without creating a paid, pending
 // or real customer order. This checks that canonical purchasing POST reaches
 // our checkout handler, not simply a functioning HTML purchase page.
 const response=await fetch(target.url+"/api/checkout",{
   method:"POST",redirect:"manual",
   headers:{"content-type":"application/json","origin":target.url},
   body:JSON.stringify({experienceSlug:"pareja"}),
   signal:AbortSignal.timeout(70000)
 });
 const data=await response.text();
 console.log("CHECKOUT_GATE",JSON.stringify({host:target.name,status:response.status,body:data.slice(0,240)}));
 assert.equal(response.status,400,target.name+" checkout API is not routed to our validation handler");
 assert.match(data,/invalid_input/,"Missing safe server-side input validation");
 results.push(target.name);
}
console.log("BOTH_HOSTS_CHECKOUT_VALIDATION_PASS",JSON.stringify(results));
