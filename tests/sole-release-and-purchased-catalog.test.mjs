import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,copyFileSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {createHash} from "node:crypto";
import {verifySoleReleaseEntrypoint} from "../scripts/verify-release-entrypoints.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("only the staged and verified GitHub workflow can deploy production",()=>{
  const report=verifySoleReleaseEntrypoint();
  assert.equal(report.exclusiveReleaseWorkflow,"deploy-production.yml");
  assert.ok(report.otherWorkflowsChecked>10);
  assert.doesNotMatch(read(".github/workflows/deploy-production.yml"),/vercel@latest/);
  assert.match(read(".github/workflows/deploy-production.yml"),/vercel@65\.10\.0/);
});

test("a restored unsafe deploy workflow would block the whole release",()=>{
  const root=mkdtempSync(join(tmpdir(),"thi-release-"));
  try{
    const directory=join(root,".github/workflows");
    mkdirSync(directory,{recursive:true});
    for(const file of ["ci.yml","deploy-production.yml"]){
      copyFileSync(resolve(".github/workflows",file),join(directory,file));
    }
    writeFileSync(join(directory,"old-bypass.yml"),
      "name: Dangerous old path\non: workflow_dispatch\njobs:\n  deploy:\n    steps:\n      - run: vercel deploy --prod\n");
    assert.throws(()=>verifySoleReleaseEntrypoint(root),/unverified_production_deploy_workflow/);
  }finally{rmSync(root,{recursive:true,force:true});}
});

test("the purchased product catalog is an independently locked snapshot",()=>{
  const repo=read("lib/gifts/repository.ts");
  assert.match(repo,/import \{ getExperience \} from "@\/data\/purchased-experiences-20261103"/);
  const snapshot=read("data/purchased-experiences-20261103.ts");
  const original=read("data/experiences.ts");
  assert.ok(snapshot.includes('slug: "pareja"')&&snapshot.includes('slug: "dragon-ball-pareja"'));
  assert.ok(snapshot.includes('export function getExperience')||snapshot.includes('export const getExperience'));
  assert.notEqual(snapshot,original,"buyers must not read an editable live catalog source");
  const lock=JSON.parse(read("lib/gifts/purchased-renderer-lock.json"));
  const hash=createHash("sha256").update(snapshot).digest("hex");
  assert.equal(lock.files["data/purchased-experiences-20261103.ts"],hash);
});

test("production never renders public demos in place of a private gift",()=>{
  const page=read("app/r/[code]/page.tsx");
  assert.match(page,/if\(process\.env\.NODE_ENV==="production"\)throw new Error\("gift_backend_not_configured"\)/);
  assert.ok(page.indexOf('process.env.NODE_ENV==="production"')<page.indexOf("const demoSlug = demoGifts[code]"));
  const boundary=read("app/r/[code]/error.tsx");
  assert.match(boundary,/onClick=\{reset\}/);
  assert.doesNotMatch(boundary,/Comprar|Quiero el mío|WhatsApp/);
});
