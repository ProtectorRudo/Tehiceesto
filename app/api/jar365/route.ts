import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"};
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers});
async function forward(body:Record<string,unknown>){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return json({error:"service_unavailable"},503);
 const h:Record<string,string>={apikey:key,"Content-Type":"application/json"};
 if(typeof body.action==="string"&&body.action.startsWith("admin-")){
   const token=(await cookies()).get("thi_admin")?.value;
   if(!token)return json({error:"unauthorized"},403);
   h["x-admin-session"]=token;
 }
 try{
   const r=await fetch(url.replace(/\/$/,"")+"/functions/v1/jar365-api",{method:"POST",headers:h,body:JSON.stringify(body),cache:"no-store",signal:AbortSignal.timeout(20000)});
   return json(await r.json(),r.status);
 }catch{return json({error:"service_unavailable"},503)}
}
export async function GET(request:NextRequest){return forward({action:"status",code:request.nextUrl.searchParams.get("code")})}
export async function POST(request:NextRequest){
 try{const body=await request.json();if(!body||typeof body!=="object"||Array.isArray(body))return json({error:"bad_json"},400);return await forward(body)}
 catch{return json({error:"bad_json"},400)}
}
