import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

/**
 * Protect the *existing* paid visual/functional renderer sources from silent
 * edits. A future redesign must archive old files, introduce a new version,
 * and deliberately migrate the registry; changing lock hashes alone is not
 * evidence that existing buyers are safe.
 */
export function verifyLockedRenderers(root=process.cwd()){
 const lock=JSON.parse(readFileSync(resolve(root,"lib/gifts/purchased-renderer-lock.json"),"utf8"));
 if(lock.schema!==1||!lock.files||Object.keys(lock.files).length<14)
   throw Error("gift_visual_lock_missing_or_incomplete");
 for(const [path,sha] of Object.entries(lock.files)){
   if(!/^[a-f0-9]{64}$/i.test(sha))throw Error("gift_visual_lock_invalid:"+path);
   let bytes;
   try{bytes=readFileSync(resolve(root,path));}
   catch{throw Error("gift_visual_renderer_deleted:"+path);}
   const actual=createHash("sha256").update(bytes).digest("hex");
   if(actual!==sha)throw Error("gift_visual_renderer_changed:"+path+
    ": archive existing purchased renderer version before changing its implementation");
 }
 return {protectedFiles:Object.keys(lock.files).length,referenceGitCommit:lock.referenceGitCommit};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify({status:"PASS",...verifyLockedRenderers()}));}
 catch(error){console.error("RELEASE_BLOCKED",error.message);process.exitCode=1;}
}
