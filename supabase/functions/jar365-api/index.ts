import { createClient } from "npm:@supabase/supabase-js@2";
import { JAR365_CATEGORIES, JAR365_SEED } from "./notes.ts";
const env=(key:string)=>Deno.env.get(key)||"";
function defaultKey(name:string){try{return JSON.parse(env(name)).default||""}catch{return ""}}
function createAdminSupabase(){const key=defaultKey("SUPABASE_SECRET_KEYS");if(!key)throw Error("missing_secret");return createClient(env("SUPABASE_URL"),key,{auth:{persistSession:false,autoRefreshToken:false}})}
async function verifyAdmin(session:string){if(!session||session.length>160)return false;const r=await fetch(env("SUPABASE_URL")+"/functions/v1/admin-api",{method:"POST",headers:{apikey:defaultKey("SUPABASE_PUBLISHABLE_KEYS"),"content-type":"application/json","x-admin-session":session},body:JSON.stringify({action:"getCommerceSettings"}),signal:AbortSignal.timeout(10000)});return r.ok&&!!(await r.json()).settings;}
const DAY=24*60*60*1000;
const noStore={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...noStore,"Content-Type":"application/json"}});
const validCode=(code:unknown):code is string=>typeof code==="string" && /^[0-9a-f]{18}$/.test(code);
const validCategory=(value:unknown)=>typeof value==="string" && JAR365_CATEGORIES.some(c=>c.key===value);
const allowedActions=new Set(["status","open","studio-read","studio-save","studio-save-many","admin-read","admin-save","admin-save-many"]);
type NoteRow={position:number;category:string;message:string};
type OpeningRow={position:number;opened_at:string};

async function giftFor(code:string, publishedOnly:boolean) {
  const db=createAdminSupabase();
  const {data,error}=await db.from("gifts").select("id,status,experience_slug,recipient_name,giver_name")
    .eq("public_code",code).eq("experience_slug","frasco365").maybeSingle();
  if(error||!data||(publishedOnly&&data.status!=="published"))return null;
  return {db,gift:data};
}

async function requirePaidEditor(code:string,token:unknown) {
  if(typeof token!=="string"||!/^[a-f0-9]{64}$/.test(token))return null;
  const base=env("SUPABASE_URL");
  const key=defaultKey("SUPABASE_PUBLISHABLE_KEYS");
  if(!base||!key)return null;
  const result=await fetch(base.replace(/\/$/,"")+"/functions/v1/creator-api",{
    method:"POST",headers:{"apikey":key,"content-type":"application/json"},cache:"no-store",
    body:JSON.stringify({action:"openStudio",code,editorToken:token}),
    signal:AbortSignal.timeout(10000),
  }).catch(()=>null);
  if(!result?.ok)return null;
  const payload=await result.json().catch(()=>null);
  if(payload?.gift?.experience_slug!=="frasco365")return null;
  return giftFor(code,false);
}

async function seedIfNeeded(db:ReturnType<typeof createAdminSupabase>,giftId:string){
  const {data,error}=await db.from("jar365_notes").select("position").eq("gift_id",giftId);
  if(error)throw new Error("jar_seed_check_failed");
  if((data?.length||0)===365)return;
  const existing=new Set((data||[]).map(x=>Number(x.position)));
  const missing=JAR365_SEED.filter(note=>!existing.has(note.position))
    .map(note=>({gift_id:giftId,position:note.position,category:note.category,message:note.message}));
  if(!missing.length)return;
  const {error:insertError}=await db.from("jar365_notes").upsert(missing,{onConflict:"gift_id,position",ignoreDuplicates:true});
  if(insertError)throw new Error("jar_seed_failed");
}

async function currentState(db:ReturnType<typeof createAdminSupabase>,gift:{id:string;recipient_name:string;giver_name:string}){
  const [{data:opening,error:e1},{data:collection,error:e2}]=await Promise.all([
    db.from("jar365_openings").select("position,opened_at").eq("gift_id",gift.id).order("position"),
    db.from("jar365_collections").select("started_at").eq("gift_id",gift.id).maybeSingle(),
  ]);
  if(e1||e2)throw new Error("jar_progress_failed");
  const rows=(opening||[]) as OpeningRow[];
  const now=Date.now();
  const lastOpened=rows.length ? Date.parse(rows[rows.length-1].opened_at) : null;
  // Exactly one message per real 24h interval. Missed days do not stack credits;
  // unopened messages stay in sequence for the full 365-note experience.
  const remaining=Math.max(0,365-rows.length);
  const nextUnlock=lastOpened===null?null:lastOpened+DAY;
  const available=remaining>0 && (nextUnlock===null || now>=nextUnlock) ? 1 : 0;
  const nextAt=available || remaining===0 || nextUnlock===null ? null : new Date(nextUnlock).toISOString();
  const positions=rows.map(x=>x.position);
  const {data:notes,error:e3}=positions.length ? await db.from("jar365_notes")
    .select("position,category,message").eq("gift_id",gift.id).in("position",positions).order("position")
    : {data:[] as NoteRow[],error:null};
  if(e3)throw new Error("jar_opened_fetch_failed");
  return {
    recipient:gift.recipient_name,giver:gift.giver_name,
    opened:(notes||[]).map(n=>({...n,openedAt:rows.find(r=>r.position===n.position)?.opened_at||null})),
    available,total:365,remaining,openedCount:rows.length,nextAt,startedAt:collection?.started_at||null,
    serverNow:new Date(now).toISOString(),
  };
}

function cleanNote(value:unknown){
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  const note=value as Record<string,unknown>;
  if(!Number.isInteger(note.position)||Number(note.position)<1||Number(note.position)>365||!validCategory(note.category)
    ||typeof note.message!=="string"||!note.message.trim()||note.message.trim().length>600)return null;
  return {position:Number(note.position),category:note.category as string,message:note.message.trim()};
}
async function dispatch(code:string,action:string,token:unknown,noteInput:unknown,session:string){
  if(!validCode(code)||!allowedActions.has(action))return json({error:"invalid_request"},400);
  const studio=action.startsWith("studio-");
  const admin=action.startsWith("admin-");
  const authorizedAdmin=admin&&await verifyAdmin(session);
  const ctx=studio?await requirePaidEditor(code,token):authorizedAdmin?await giftFor(code,false):admin?null:await giftFor(code,true);
  if(!ctx)return json({error:(studio||admin)?"unauthorized":"not_found"},studio||admin?403:404);
  const {db,gift}=ctx;
  await seedIfNeeded(db,gift.id);
  if(action==="status")return json(await currentState(db,gift));
  if(action==="studio-read"||action==="admin-read"){
    const {data,error}=await db.from("jar365_notes").select("position,category,message")
      .eq("gift_id",gift.id).order("position");
    if(error)return json({error:"read_failed"},500);
    return json({notes:data||[],recipient:gift.recipient_name,giver:gift.giver_name});
  }
  if(["studio-save","studio-save-many","admin-save","admin-save-many"].includes(action)){
    const notes=action.endsWith("-many")?noteInput:[noteInput];
    if(!Array.isArray(notes)||notes.length<1||notes.length>365)return json({error:"invalid_notes"},400);
    const checked=notes.map(cleanNote);
    if(checked.some(x=>!x))return json({error:"invalid_note"},400);
    const cleaned=checked as NonNullable<ReturnType<typeof cleanNote>>[];
    if(new Set(cleaned.map(x=>x.position)).size!==cleaned.length)return json({error:"duplicate_positions"},400);
    const rows=cleaned.map(x=>({...x,gift_id:gift.id,updated_at:new Date().toISOString()}));
    const {error}=await db.from("jar365_notes").upsert(rows,{onConflict:"gift_id,position"});
    if(error)return json({error:"save_failed"},500);
    return json({ok:true,saved:rows.length});
  }
  if(action==="open"){
    const {data,error}=await db.rpc("jar365_open_note",{p_gift_id:gift.id});
    if(error){
      if(/jar_locked|jar_finished/.test(error.message))return json({error:"not_available",state:await currentState(db,gift)},409);
      return json({error:"open_failed"},500);
    }
    const row=Array.isArray(data)?data[0]:null;
    if(!row)return json({error:"open_failed"},500);
    return json({
      note:{position:row.note_position,category:row.note_category,message:row.note_message,openedAt:row.note_opened_at},
      state:await currentState(db,gift),
    });
  }
  return json({error:"invalid_action"},400);
}

Deno.serve(async(request:Request)=>{
 const supplied=request.headers.get("apikey")||"";
 if(!supplied||![defaultKey("SUPABASE_PUBLISHABLE_KEYS"),defaultKey("SUPABASE_ANON_KEYS")].filter(Boolean).includes(supplied))return json({error:"unauthorized"},401);
 if(request.method!=="POST")return json({error:"method_not_allowed"},405);
 let body:Record<string,unknown>;try{body=await request.json()}catch{return json({error:"bad_json"},400)}
 try{return await dispatch(String(body.code||""),String(body.action||""),body.editorToken,body.notes??body.note,request.headers.get("x-admin-session")||"")}
 catch(e){console.error("jar365 operation failed",e instanceof Error?e.message:"unknown");return json({error:"service_unavailable"},503)}
});