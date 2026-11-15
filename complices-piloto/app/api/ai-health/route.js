import {createClient} from "@supabase/supabase-js";
import {verifyOpenAI,getOpenAIModel} from "../../../lib/openai-client.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"no-store","X-Robots-Tag":"noindex"};
const out=(data,status=200)=>Response.json(data,{status,headers:HEADERS});
export async function GET(request){
 try{
  const token=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!token||token.length>5000)return out({error:"Iniciá sesión"},401);
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!publicKey)return out({error:"El servidor no está configurado"},503);
  const db=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+token}}});
  const {data:{user},error}=await db.auth.getUser(token);
  if(error||!user)return out({error:"Sesión inválida"},401);
  const {data:member,error:memberError}=await db.from("cp_members").select("user_id").eq("user_id",user.id).maybeSingle();
  if(memberError||!member)return out({error:"Necesitás pertenecer a un espacio de Cómplices"},403);
  const result=await verifyOpenAI({key:process.env.OPENAI_API_KEY,model:getOpenAIModel()});
  return out({...result,check:"credentials_and_model_only",generationTested:false});
 }catch{return out({error:"No se pudo comprobar la conexión"},503)}
}
