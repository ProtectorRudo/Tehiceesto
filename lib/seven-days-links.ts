import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export function sevenDaysToken(code: string, day: number) {
  const secret=process.env.SEVEN_DAYS_LINK_SECRET || process.env.SUPABASE_SECRET_KEY;
  if (!secret || !/^[a-f0-9]{18}$/.test(code) || !Number.isInteger(day) || day<1 || day>7) return null;
  return createHmac("sha256",secret).update("tehiceesto:7days:v1:"+code+":"+day).digest("hex");
}
export function validSevenDaysToken(code:string,day:number,token:string) {
  const expected=sevenDaysToken(code,day);
  if(!expected || !/^[a-f0-9]{64}$/.test(token))return false;
  return timingSafeEqual(Buffer.from(expected,"hex"),Buffer.from(token,"hex"));
}
export function sevenDaysLinks(code:string,origin:string) {
  return Array.from({length:7},(_,index)=>{
    const day=index+1;
    const token=sevenDaysToken(code,day);
    if(!token)throw new Error("seven_days_links_unavailable");
    return {
      day,
      url: new URL("/r/"+code+"/dia/"+day+"/"+token,origin).toString(),
    };
  });
}
