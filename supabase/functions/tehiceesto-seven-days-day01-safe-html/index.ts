/**
 * Temporary, public, content-addressed HTML bridge for Siete Días day 01.
 * The Vercel quota prevents deploying Next.js main. A GitHub raw-file
 * rewrite alone adds an inherited "sandbox; default-src 'none'" CSP and
 * X-Frame-Options:DENY, which breaks interactive gifts.
 *
 * Only this immutable, audited non-personalized chapter may be served.
 * Remove the Vercel route once full production includes PR #80.
 */
const SOURCE="https://raw.githubusercontent.com/ProtectorRudo/Tehiceesto/904b2ce4cb459a117caf6a30116c7a82341bf54a/public/siete-dias/dia-01.html";
const EXPECTED_SHA256="76ede7f8995a652aa6d35511b5c8fb03178be2f59dbbd56603c8d1eb37e4b1ec";
let snapshot:Uint8Array|null=null;
async function page(){
 if(snapshot)return snapshot;
 const response=await fetch(SOURCE,{headers:{accept:"text/plain"}});
 if(!response.ok)throw new Error("source_unavailable");
 const content=new Uint8Array(await response.arrayBuffer());
 if(content.byteLength<30000||content.byteLength>36000)throw new Error("source_size_mismatch");
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",content)))
   .map(byte=>byte.toString(16).padStart(2,"0")).join("");
 if(digest!==EXPECTED_SHA256)throw new Error("source_integrity_failure");
 snapshot=content;
 return content;
}
Deno.serve(async(req:Request)=>{
 if(req.method!=="GET"&&req.method!=="HEAD")return new Response("method_not_allowed",{
  status:405,headers:{"allow":"GET, HEAD","cache-control":"no-store"}
 });
 try{
  const content=await page();
  // Do not copy CSP/sandbox and X-Frame-Options headers from raw.githubusercontent;
  // the real chapter has its own controlled inline JavaScript and CSS.
  return new Response(req.method==="HEAD"?null:content.slice(),{
   status:200,headers:{
    "content-type":"text/html; charset=utf-8",
    "cache-control":"public, max-age=300",
    "x-content-type-options":"nosniff"
   }
  });
 }catch(error){
  console.error("mimo_static_delivery_failure",error instanceof Error?error.message:"unknown");
  return new Response("temporarily_unavailable",{status:503,headers:{
   "content-type":"text/plain; charset=utf-8","cache-control":"no-store"
  }});
 }
});
