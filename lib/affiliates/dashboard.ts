import "server-only";
import {cookies} from "next/headers";
import {AFFILIATE_SESSION_COOKIE,callAffiliateBackend} from "@/lib/affiliates/backend";

export type AffiliateDashboard={
 affiliate:{slug:string;name:string;email:string;commissionBps:number;status:string};
 stats:Record<string,number|string|null>;
 links:Array<{id:string;code:string;label:string;status:string;created_at:string}>;
 recentSales:Array<{id:string;date:string;experienceSlug:string;saleAmountMinor:number;commissionAmountMinor:number;status:string}>;
 series:Array<{date:string;clicks:number;uniqueVisitors:number;sales:number;revenueMinor:number}>;
 sources:Record<string,{clicks:number;sales:number}>;
};
export async function getAffiliateDashboard():Promise<AffiliateDashboard|null>{
 const jar=await cookies();const token=jar.get(AFFILIATE_SESSION_COOKIE)?.value;
 if(!token||!/^[A-Za-z0-9_-]{30,90}$/.test(token))return null;
 try{
  const result=await callAffiliateBackend({action:"dashboard"},token);
  if(!result.ok||!result.data.affiliate||!result.data.stats)return null;
  return result.data as unknown as AffiliateDashboard;
 }catch(err){
  console.error("affiliate_dashboard_unavailable",err instanceof Error?err.message:"unknown");
  return null;
 }
}
