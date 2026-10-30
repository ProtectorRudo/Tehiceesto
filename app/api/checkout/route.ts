import {NextRequest,NextResponse} from "next/server";
import {isIP} from "node:net";
import {affiliateBackendConfig,ATTRIBUTION_COOKIE} from "@/lib/affiliates/backend";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 const origin=req.headers.get("origin");
 if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:"forbidden_origin"},{status:403});
 const fetchSite=req.headers.get("sec-fetch-site");
 if(fetchSite&&fetchSite!=="same-origin"&&fetchSite!=="none")return NextResponse.json({error:"forbidden_site"},{status:403});
 let body:Record<string,unknown>;
 try{body=await req.json()}catch{return NextResponse.json({error:"invalid_json"},{status:400})}
 const {experienceSlug,email,whatsapp,consent,clientRequestId,website}=body;
 if(typeof experienceSlug!=="string"||typeof email!=="string"||typeof whatsapp!=="string"||
    consent!==true||typeof clientRequestId!=="string"||clientRequestId.length>64){
   return NextResponse.json({error:"invalid_input"},{status:400});
 }
 try{
  const {url,key}=affiliateBackendConfig();
  const token=req.cookies.get(ATTRIBUTION_COOKIE)?.value;
  const possibleIp=(req.headers.get("x-forwarded-for")||"").split(",")[0]?.trim()||"";
  const clientIp=isIP(possibleIp)?possibleIp:"";
  const response=await fetch(url+"/functions/v1/order-create",{
    method:"POST",cache:"no-store",signal:AbortSignal.timeout(20000),
    headers:{"apikey":key,"content-type":"application/json","origin":req.nextUrl.origin,
      ...(clientIp?{"x-forwarded-for":clientIp}:{}),
      ...(req.headers.get("user-agent")?{"user-agent":req.headers.get("user-agent")!}:{})},
    body:JSON.stringify({experienceSlug,email,whatsapp,consent,clientRequestId,
      website:typeof website==="string"?website:"",
      // Never trust a body-supplied affiliate ID or token; use our HttpOnly cookie only.
      affiliateToken:token&&/^[A-Za-z0-9_-]{30,90}$/.test(token)?token:undefined
    }),
  });
  const data=await response.json().catch(()=>({error:"order_service_invalid_response"}));
  return NextResponse.json(data,{status:response.status,headers:{"Cache-Control":"private, no-store"}});
 }catch(err){
  console.error("checkout_proxy_failed",err instanceof Error?err.message:"unknown");
  return NextResponse.json({error:"checkout_temporarily_unavailable"},{status:503});
 }
}
