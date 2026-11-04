/**
 * Static parity lock. Captured from REAL deployed Supabase function sources.
 *
 * If an Edge Function is deliberately changed, review the difference, deploy it
 * to the intended project in a separate controlled operation, verify the live
 * code, then update the recorded SHA/version. Do NOT merely rehash to make CI
 * green: the deployed source must match the new manifest.
 */
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

export function verifyLiveEdgeSourceLock(root=process.cwd()){
 const lock=JSON.parse(readFileSync(resolve(root,"lib/release/live-edge-source-lock.json"),"utf8"));
 if(lock.schema!==1||lock.project!=="efvvadfxuyieswdqnsjg"||
    Object.keys(lock.functions||{}).length!==10)
   throw Error("live_edge_source_lock_incomplete");
 for(const [slug,entry] of Object.entries(lock.functions)){
  if(!/^[a-z-]+$/.test(slug)||!Number.isInteger(entry.version)||entry.version<1||
     !/^[a-f0-9]{64}$/.test(entry.sha256))
   throw Error("live_edge_source_lock_invalid:"+slug);
  let bytes;
  try{bytes=readFileSync(resolve(root,"supabase/functions",slug,"index.ts"));}
  catch{throw Error("live_edge_source_missing:"+slug);}
  const actual=createHash("sha256").update(bytes).digest("hex");
  if(actual!==entry.sha256)
   throw Error("live_edge_source_drift:"+slug+": review differences against deployed Supabase before changing source lock");
 }
 return {verifiedFunctions:Object.keys(lock.functions).length,observedAt:lock.observedAt};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify({status:"PASS",...verifyLiveEdgeSourceLock()}));}
 catch(error){console.error("EDGE_RELEASE_BLOCKED",error.message);process.exitCode=1;}
}
