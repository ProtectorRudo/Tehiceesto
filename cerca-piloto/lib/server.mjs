import {createClient} from "@supabase/supabase-js";
export function isConfigured(){
 return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
export async function authenticated(request){
 if(!isConfigured())return {error:"CERCA aún no tiene su base independiente configurada.",code:503};
 const bearer=request.headers.get("authorization")||"";
 const jwt=bearer.startsWith("Bearer ")?bearer.slice(7):"";
 if(!jwt)return {error:"Iniciá sesión para continuar.",code:401};
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+jwt}}});
 const {data:{user},error}=await db.auth.getUser(jwt);
 if(error||!user)return {error:"Sesión vencida o inválida.",code:401};
 return {db,user};
}
export function json(data,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}})}
