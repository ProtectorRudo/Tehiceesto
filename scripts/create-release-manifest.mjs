import {writeFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const commit=process.argv[2]||process.env.GITHUB_SHA||
  execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim();
if(!/^[a-f0-9]{40}$/i.test(commit)){
  console.error("invalid_release_sha");process.exit(1);
}
writeFileSync(new URL("../lib/release/build.json",import.meta.url),
 JSON.stringify({commit,source:"verified-github-checkout",generatedAt:new Date().toISOString()})+"\n");
console.log("Release artifact pinned to "+commit);
