import { createClient } from "npm:@supabase/supabase-js@2";

const URL_BASE = Deno.env.get("SUPABASE_URL") || "";
function keyFor(name:string){try{const x=JSON.parse(Deno.env.get(name)||"{}");return typeof x.default==="string"?x.default:"";}catch{return "";}}
const SECRET=keyFor("SUPABASE_SECRET_KEYS");
const PUBLISHABLE=[keyFor("SUPABASE_PUBLISHABLE_KEYS"),keyFor("SUPABASE_ANON_KEYS")].filter(Boolean);
const db=()=>createClient(URL_BASE,SECRET,{auth:{autoRefreshToken:false,persistSession:false}});
const MAX_SIZE=15*1024*1024;
const MAX_GIFT_MEDIA=30;
const MAX_INVITE_UPLOADS=12;
const VOICE_BASE="https://tehiceesto.com/voz";
function cors(origin:string|null){
  const allowed=["https://protectorrudo.github.io","https://tehiceesto.com","https://www.tehiceesto.com"].includes(origin||"") ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin||"") ||
    /^http:\/\/localhost:\d+$/.test(origin||"");
  return {"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":allowed?origin!:"https://tehiceesto.com",
   "access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"apikey,authorization,content-type","vary":"origin"};
}
function response(origin:string|null,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:cors(origin)});}
const codeOk=(v:unknown)=>/^[0-9a-f]{18}$/.test(String(v||""));
const tokenOk=(v:unknown)=>/^[a-f0-9]{64}$/.test(String(v||""));
async function sha256(text:string){const buf=new TextEncoder().encode(text);const dig=await crypto.subtle.digest("SHA-256",buf);return [...new Uint8Array(dig)].map(v=>v.toString(16).padStart(2,"0")).join("");}
function newToken(){const b=crypto.getRandomValues(new Uint8Array(32));return [...b].map(x=>x.toString(16).padStart(2,"0")).join("");}
async function signedInUser(req:Request,supabase:ReturnType<typeof db>){
  const jwt=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!jwt)return null;
  const {data,error}=await supabase.auth.getUser(jwt);
  if(error||!data.user?.email||!data.user.email_confirmed_at)return null;
  return data.user;
}

// A refund remains reflected truthfully in the payment ledger. An explicit,
// revocable support license may permit this precise gift to collect voices.
async function hasCourtesyVoiceAccess(supabase:ReturnType<typeof db>,giftId:string,buyerEmail?:string){
  const {data:grants,error}=await supabase.from("complimentary_access_grants")
    .select("order_id,expires_at").eq("gift_id",giftId)
    .eq("product_code","dragon-ball-pareja").is("revoked_at",null).limit(20);
  if(error)return false;
  for(const grant of grants||[]){
    if(grant.expires_at&&Date.parse(grant.expires_at)<=Date.now())continue;
    const {data:order}=await supabase.from("orders")
      .select("id,gift_id,buyer_email").eq("id",grant.order_id)
      .eq("gift_id",giftId).maybeSingle();
    if(order&&(!buyerEmail||order.buyer_email?.toLowerCase()===buyerEmail.toLowerCase()))
      return true;
  }
  return false;
}

async function ownerGift(req:Request,supabase:ReturnType<typeof db>,rawCode:unknown){
  if(!codeOk(rawCode))return null;
  const user=await signedInUser(req,supabase);
  if(!user)return null;
  const {data:gift}=await supabase.from("gifts")
    .select("id,public_code,experience_slug,template_version,status,scene_recipe")
    .eq("public_code",String(rawCode)).maybeSingle();
  if(!gift || String(gift.experience_slug).startsWith("escape-") ||
      (gift.experience_slug==="pareja"&&gift.template_version==="premium-v5"))return null;
  const {data:order}=await supabase.from("orders").select("id").eq("gift_id",gift.id)
    .eq("status","approved").ilike("buyer_email",user.email).limit(1).maybeSingle();
  return order||await hasCourtesyVoiceAccess(supabase,gift.id,user.email)?{gift,email:user.email}:null;
}
async function openInvite(supabase:ReturnType<typeof db>,value:unknown){
  if(!tokenOk(value))return null;
  const digest=await sha256(String(value));
  const {data:invite}=await supabase.from("voice_guest_invites")
    .select("id,gift_id,expires_at,revoked_at,submissions_count,max_submissions")
    .eq("token_hash",digest).maybeSingle();
  if(!invite || invite.revoked_at||Date.parse(invite.expires_at)<Date.now()||
     invite.submissions_count>=invite.max_submissions)return null;
  const {data:order}=await supabase.from("orders").select("id").eq("gift_id",invite.gift_id).eq("status","approved").limit(1).maybeSingle();
  if(!order&&!await hasCourtesyVoiceAccess(supabase,invite.gift_id))return null;
  const {data:gift}=await supabase.from("gifts").select("id,public_code,scene_recipe,experience_slug").eq("id",invite.gift_id).maybeSingle();
  if(!gift || String(gift.experience_slug).startsWith("escape-"))return null;
  return {invite,gift};
}
function cleanedAudioMime(raw:unknown){
  const mime=String(raw||"").toLowerCase().trim().split(";")[0];
  return ["audio/mp4","audio/webm","audio/ogg","audio/mpeg","audio/wav","audio/opus"].includes(mime)?mime:"";
}
function safeCaption(value:unknown){return String(value||"").trim().replace(/[\u0000-\u001f\u007f]/g," ").slice(0,100);}
async function mediaCount(supabase:ReturnType<typeof db>,giftId:string){
  const {count,error}=await supabase.from("gift_media").select("*",{count:"exact",head:true}).eq("gift_id",giftId);
  return error?-1:count||0;
}
Deno.serve(async req=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return response(origin,{error:"method_not_allowed"},405);
  if(!PUBLISHABLE.includes(req.headers.get("apikey")||""))return response(origin,{error:"unauthorized"},401);
  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return response(origin,{error:"invalid_request"},400);}
  const action=String(body.action||"");
  const supabase=db();

  // OWNER CONTROL PLANE. Only confirmed account owner with an approved paid order.
  // A voice invite can NEVER authenticate on these endpoints.
  if(["create","list","revoke"].includes(action)){
    const access=await ownerGift(req,supabase,body.code);
    if(!access)return response(origin,{error:"owner_unauthorized"},403);
    const {gift,email}=access;
    if(action==="list"){
      const {data,error}=await supabase.from("voice_guest_invites")
        .select("id,created_at,expires_at,revoked_at,submissions_count,max_submissions")
        .eq("gift_id",gift.id).order("created_at",{ascending:false}).limit(10);
      if(error)return response(origin,{error:"lookup_failed"},500);
      return response(origin,{invites:data||[]});
    }
    if(action==="revoke"){
      const id=String(body.inviteId||"");
      if(!/^[0-9a-f-]{36}$/.test(id))return response(origin,{error:"invalid_invite"},400);
      const {error}=await supabase.from("voice_guest_invites").update({revoked_at:new Date().toISOString()})
        .eq("id",id).eq("gift_id",gift.id).is("revoked_at",null);
      if(error)return response(origin,{error:"revoke_failed"},500);
      return response(origin,{ok:true});
    }
    // Do not promise twelve recordings if the gift has only a few free media
    // slots left. Check BEFORE revoking the previous invite so the owner does
    // not lose a working link when the gift is full.
    const usedMedia=await mediaCount(supabase,gift.id);
    if(usedMedia<0)return response(origin,{error:"lookup_failed"},500);
    const availableSlots=Math.min(MAX_INVITE_UPLOADS,MAX_GIFT_MEDIA-usedMedia);
    if(availableSlots<=0)return response(origin,{error:"gift_full"},409);

    // At most one active link at any time, to make accidental forwarding revocable.
    await supabase.from("voice_guest_invites").update({revoked_at:new Date().toISOString()})
      .eq("gift_id",gift.id).is("revoked_at",null);
    const token=newToken();
    const {data,error}=await supabase.from("voice_guest_invites").insert({
      gift_id:gift.id,token_hash:await sha256(token),created_by_email:email,
      expires_at:new Date(Date.now()+14*24*60*60*1000).toISOString(),
      max_submissions:availableSlots,
    }).select("id,expires_at,max_submissions").single();
    if(error||!data)return response(origin,{error:"invite_create_failed"},500);
    return response(origin,{ok:true,id:data.id,expiresAt:data.expires_at,maxSubmissions:data.max_submissions,url:VOICE_BASE+"#t="+token});
  }

  // GUEST DATA PLANE. There is deliberately NO way to open, list or edit gifts here.
  const opened=await openInvite(supabase,body.inviteToken);
  if(!opened)return response(origin,{error:"invite_unavailable"},404);
  const {invite,gift}=opened;
  if(action==="status"){
    return response(origin,{ok:true,expiresAt:invite.expires_at,
      remaining:Math.max(0,invite.max_submissions-invite.submissions_count)});
  }
  if(action==="prepare"){
    const mime=cleanedAudioMime(body.mimeType);
    const size=Number(body.size);
    if(!mime || !Number.isSafeInteger(size)||size<1||size>MAX_SIZE)
      return response(origin,{error:"invalid_audio"},400);
    const total=await mediaCount(supabase,gift.id);
    if(total<0)return response(origin,{error:"lookup_failed"},500);
    if(total>=MAX_GIFT_MEDIA)return response(origin,{error:"gift_full"},409);
    const {count:reservations,error:reservationError}=await supabase.from("voice_guest_uploads")
      .select("*",{count:"exact",head:true}).eq("invite_id",invite.id)
      .gte("created_at",new Date(Date.now()-20*60*1000).toISOString());
    if(reservationError)return response(origin,{error:"lookup_failed"},500);
    if((reservations||0)>=MAX_INVITE_UPLOADS*2)return response(origin,{error:"too_many_attempts"},429);
    const ext=mime==="audio/mp4"?"m4a":mime==="audio/mpeg"?"mp3":mime==="audio/wav"?"wav":mime==="audio/opus"?"opus":mime==="audio/ogg"?"ogg":"webm";
    const path=gift.public_code+"/guest-voice-"+crypto.randomUUID()+"."+ext;
    const {data:upload,error:uploadError}=await supabase.from("voice_guest_uploads").insert({
      invite_id:invite.id,gift_id:gift.id,storage_path:path,mime_type:mime,expected_size:size
    }).select("id").single();
    if(uploadError||!upload)return response(origin,{error:"upload_prepare_failed"},500);
    const {data:signed,error:signedError}=await supabase.storage.from("gift-media").createSignedUploadUrl(path);
    if(signedError||!signed)return response(origin,{error:"upload_prepare_failed"},500);
    return response(origin,{uploadId:upload.id,path,token:signed.token});
  }
  if(action==="finish"){
    const uploadId=String(body.uploadId||"");
    if(!/^[0-9a-f-]{36}$/.test(uploadId))return response(origin,{error:"invalid_upload"},400);
    const {data:reservation}=await supabase.from("voice_guest_uploads")
      .select("id,invite_id,gift_id,storage_path,mime_type,expected_size,created_at,consumed_at")
      .eq("id",uploadId).eq("invite_id",invite.id).eq("gift_id",gift.id).maybeSingle();
    if(!reservation||reservation.consumed_at||Date.now()-Date.parse(reservation.created_at)>30*60*1000)
      return response(origin,{error:"invalid_upload"},400);
    const {data:info,error:infoError}=await supabase.storage.from("gift-media").info(reservation.storage_path);
    const actualSize=Number(info?.size||0);
    const actualMime=String(info?.contentType||"").split(";")[0].toLowerCase();
    if(infoError||!actualSize||actualSize>MAX_SIZE||actualSize!==reservation.expected_size || actualMime!==reservation.mime_type)
      return response(origin,{error:"invalid_audio"},400);
    const before=await mediaCount(supabase,gift.id);
    if(before<0)return response(origin,{error:"lookup_failed"},500);
    if(before>=MAX_GIFT_MEDIA)return response(origin,{error:"gift_full"},409);
    const now=new Date().toISOString();
    const {data:locked,error:lockError}=await supabase.from("voice_guest_uploads")
      .update({consumed_at:now}).eq("id",reservation.id).is("consumed_at",null).select("id").maybeSingle();
    if(lockError||!locked)return response(origin,{error:"already_sent"},409);
    const candidateScenes=Array.isArray(gift.scene_recipe)?gift.scene_recipe.map(String):[];
    const scene=candidateScenes.includes("voices")?"voices":candidateScenes.includes("recording")?"recording":candidateScenes[0]||"intro";
    const speaker=safeCaption(body.speaker);
    const {error:saveError}=await supabase.from("gift_media").insert({
      gift_id:gift.id,kind:"audio",storage_path:reservation.storage_path,
      caption:speaker? "Mensaje de "+speaker : "Mensaje de voz",
      sort_order:before,
      metadata:{originalName:"Mensaje de voz invitado",mimeType:reservation.mime_type,size:actualSize,
        scene,source:"guest_voice",role:"voice",guestSpeaker:speaker},
    });
    if(saveError){
      await supabase.from("voice_guest_uploads").update({consumed_at:null}).eq("id",reservation.id).eq("consumed_at",now);
      return response(origin,{error:"save_failed"},500);
    }
    await supabase.from("voice_guest_invites").update({submissions_count:invite.submissions_count+1})
      .eq("id",invite.id).eq("submissions_count",invite.submissions_count);
    return response(origin,{ok:true,saved:true});
  }
  return response(origin,{error:"action_not_allowed"},400);
});
