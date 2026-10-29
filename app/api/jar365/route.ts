import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { JAR365_CATEGORIES, JAR365_SEED } from "@/data/jar365-notes";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const DAY=24*60*60*1000;
const noStore={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:noStore});
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
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;
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
  const start=collection?.started_at ? Date.parse(collection.started_at):null;
  const now=Date.now();
  const accrued=Math.min(365,start===null?1:Math.max(1,1+Math.floor((now-start)/DAY)));
  const available=Math.max(0,accrued-rows.length);
  const nextAt=accrued>=365?null:start===null?null:new Date(start+accrued*DAY).toISOString();
  const positions=rows.map(x=>x.position);
  const {data:notes,error:e3}=positions.length ? await db.from("jar365_notes")
    .select("position,category,message").eq("gift_id",gift.id).in("position",positions).order("position")
    : {data:[] as NoteRow[],error:null};
  if(e3)throw new Error("jar_opened_fetch_failed");
  return {
    recipient:gift.recipient_name,giver:gift.giver_name,
    opened:(notes||[]).map(n=>({...n,openedAt:rows.find(r=>r.position===n.position)?.opened_at||null})),
    available,total:365,openedCount:rows.length,nextAt,startedAt:collection?.started_at||null,
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
async function dispatch(code:string,action:string,token:unknown,noteInput:unknown){
  if(!validCode(code)||!allowedActions.has(action))return json({error:"invalid_request"},400);
  const studio=action.startsWith("studio-");
  const admin=action.startsWith("admin-");
  const authorizedAdmin=admin&&(await (await import("@/lib/admin-auth")).isAdminAuthenticated());
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

export async function GET(request:NextRequest){
  const code=request.nextUrl.searchParams.get("code");
  if(!validCode(code))return json({error:"not_found"},404);
  try{return await dispatch(code,"status",null,null);}
  catch{return json({error:"service_unavailable"},503);}
}
export async function POST(request:NextRequest){
  let body:Record<string,unknown>;
  try{body=await request.json();}catch{return json({error:"bad_json"},400);}
  try{return await dispatch(String(body.code||""),String(body.action||""),body.editorToken,body.notes??body.note);}
  catch{return json({error:"service_unavailable"},503);}
}
