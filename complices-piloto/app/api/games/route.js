import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store, max-age=0","X-Robots-Tag":"noindex","Vary":"Authorization","X-Content-Type-Options":"nosniff"};
const answer=(body,status=200)=>Response.json(body,{status,headers:HEADERS});
const allowed=new Set(["entre-dos","meme-match","trazo-complice"]);
export async function GET(request){
 const url=new URL(request.url);
 const game=url.searchParams.get("game");
 if(!allowed.has(game))return answer({error:"Juego desconocido"},404);
 const token=(request.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"").trim();
 if(!token||token.length>5000)return answer({error:"Iniciá sesión para jugar"},401);
 try{
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{
   auth:{persistSession:false,autoRefreshToken:false},
   global:{headers:{Authorization:"Bearer "+token}}
  });
  const {data:{user},error}=await db.auth.getUser(token);
  if(error||!user)return answer({error:"Tu sesión venció"},401);
  const {data:member,error:memberError}=await db.from("cp_members").select("space_id").eq("user_id",user.id).maybeSingle();
  if(memberError||!member?.space_id)return answer({error:"Ingresá a tu espacio de Cómplices"},403);
  let html,count,detail;
  if(game==="entre-dos"){
   ({html}=await import("../../../lib/private-entre-dos.mjs"));
   count=90;detail="90 preguntas originales · se pasan el celular";
   if(url.searchParams.get("mode")==="online"){
    const found=html.match(/const BANK=(\[[\s\S]*?\]);/);
    if(!found)return answer({error:"No pude cargar las cartas"},503);
    const cards=JSON.parse(found[1]).map(x=>({id:x.id,q:x.q,a:x.a,b:x.b,talk:x.talk}));
    if(cards.length!==90)return answer({error:"No pude validar las cartas originales"},503);
    return answer({game,cards,mode:"two-devices",version:"entre-dos-pareja-v1"});
   }
  }else if(game==="meme-match"){
   ({html}=await import("../../../lib/private-meme-match.mjs"));
   count=48;detail="48 parejas originales · se pasan el celular";
  }else{
   const {originalWordBank}=await import("../../../lib/private-trazo-words.mjs");
   const {words,categories}=originalWordBank();
   if(words.length<1000)return answer({error:"No se pudo preparar el juego completo"},503);
   const bank=JSON.stringify({words,categories}).replace(/</g,"\\u003c");
   html=[
    '<!doctype html><html lang="es-AR"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    '<meta name="theme-color" content="#211522"><title>Trazo Cómplice · Cómplices</title>',
    '<link rel="stylesheet" href="/juegos/trazo/styles.css">',
    '<script>const bank=',bank,';window.TRAZO_WORD_BANK=bank.words;window.TRAZO_CATEGORIES=bank.categories;window.TRAZO_IS_DEMO=false;</script>',
    '<script defer src="/juegos/trazo/game.js"></script></head><body>',
    '<div id="trazo-app" class="trazo-root"><div class="trazo-orb trazo-orb--a" aria-hidden="true"></div>',
    '<div class="trazo-orb trazo-orb--b" aria-hidden="true"></div><div class="trazo-noise" aria-hidden="true"></div>',
    '<header class="trazo-topbar"><div class="trazo-brand"><span class="trazo-brandmark" aria-hidden="true">✳</span>',
    '<span>CÓMPLICES <i> / </i> JUEGOS</span></div><span class="trazo-status"><i aria-hidden="true"></i> JUEGO COMPLETO</span></header>',
    '<div class="trazo-main" id="game-root" aria-live="polite"></div>',
    '<footer class="trazo-footer"><span>',words.length,' PALABRAS · UN SOLO CELULAR</span>',
    '<span>HECHO CON ♥</span></footer><div class="trazo-toast" id="trazo-toast" role="status" aria-live="polite"></div></div>',
    '</body></html>'
   ].join("");
   count=words.length;detail="Dibujar y adivinar · se pasan el celular";
  }
  return answer({game,html,count,detail,mode:"single-device",version:"private-complices-games-v1"});
 }catch(error){
  console.error("complices_games_error",error instanceof Error?error.message:"unknown");
  return answer({error:"No pude preparar el juego. Reintentá desde Juegos."},503);
 }
}
