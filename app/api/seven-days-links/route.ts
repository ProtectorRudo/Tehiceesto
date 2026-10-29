import { NextResponse } from "next/server";
import { sevenDaysLinks } from "@/lib/seven-days-links";

export const runtime="nodejs";
export async function POST(request:Request) {
  let body:{code?:unknown;editorToken?:unknown};
  try {body=await request.json();} catch {return NextResponse.json({error:"invalid_request"},{status:400});}
  const code=String(body.code||"").trim().toLowerCase();
  const editorToken=String(body.editorToken||"").trim().toLowerCase();
  if(!/^[a-f0-9]{18}$/.test(code)||!/^[a-f0-9]{64}$/.test(editorToken))
    return NextResponse.json({error:"invalid_request"},{status:400});
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
  const publishable=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;
  if(!base||!publishable)return NextResponse.json({error:"unavailable"},{status:503});
  const result=await fetch(base.replace(/\\/$/,"")+"/functions/v1/creator-api",{
    method:"POST",cache:"no-store",
    headers:{"apikey":publishable,"content-type":"application/json"},
    body:JSON.stringify({action:"openStudio",code,editorToken})
  }).catch(()=>null);
  if(!result||!result.ok) return NextResponse.json({error:"unauthorized"},{status:403});
  const payload=await result.json().catch(()=>null);
  if(payload?.gift?.experience_slug!=="siete-dias")
    return NextResponse.json({error:"wrong_experience"},{status:403});
  const origin=process.env.NEXT_PUBLIC_SITE_URL||"https://tehiceesto.com";
  try{
    const links=sevenDaysLinks(code,origin);
    return NextResponse.json({links,published:payload.gift.status==="published"},{headers:{"cache-control":"no-store"}});
  }catch{return NextResponse.json({error:"unavailable"},{status:503});}
}
