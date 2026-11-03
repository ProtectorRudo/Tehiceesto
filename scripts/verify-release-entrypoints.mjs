import {existsSync,readdirSync,readFileSync} from "node:fs";
import {resolve,join} from "node:path";
import {fileURLToPath} from "node:url";

/**
 * Exactly one route may modify production: the staged, verified, promoted
 * workflow. Old workflows deploying with --prod directly are forbidden.
 * This is a source control gate; branch protection and Vercel deployment
 * checks must ALSO be enabled to protect against external deploy calls.
 */
export function verifySoleReleaseEntrypoint(root=process.cwd()){
  const workflows=resolve(root,".github/workflows");
  const verified=resolve(workflows,"deploy-production.yml");
  if(!existsSync(verified))throw Error("verified_release_workflow_missing");
  const release=readFileSync(verified,"utf8");
  const must=[
    "workflow_dispatch:","github.ref == 'refs/heads/main'",
    "git ls-remote origin refs/heads/main",
    "scripts/release-contract.mjs --static",
    "scripts/release-contract.mjs --live",
    "--prebuilt --prod --skip-domain",
    'vercel promote "$DEPLOYMENT_URL"',
    "tehiceesto.vercel.app","tehiceesto.com",
    "prj_1VcOY4n08AEPMH9ltaRLBRJZstKt",
  ];
  for(const expected of must){
    if(!release.includes(expected))throw Error("verified_release_stage_missing:"+expected);
  }
  if(release.includes("vercel@latest"))throw Error("release_cli_not_pinned");
  if(release.includes('--token="$VERCEL_TOKEN"'))throw Error("release_token_in_process_args");

  const bypasses=[];
  for(const filename of readdirSync(workflows).filter(x=>/\.ya?ml$/.test(x))){
    const path=join(workflows,filename);
    if(path===verified)continue;
    const content=readFileSync(path,"utf8");
    if(/\b(?:npx\s+)?vercel\s+(?:deploy|promote|rollback)\b/.test(content)
      || /\/v1[234]\/deployments/.test(content)
      || /vercel\s+--prod\b/.test(content)
      || /\/deploy-hooks\//.test(content))
      bypasses.push(filename);
  }
  if(bypasses.length)throw Error("unverified_production_deploy_workflow:"+bypasses.join(","));

  const ci=readFileSync(resolve(workflows,"ci.yml"),"utf8");
  if(!ci.includes("run: npm ci")||
     !ci.includes("scripts/release-contract.mjs --static"))
    throw Error("ci_dependency_or_release_check_missing");
  return {exclusiveReleaseWorkflow:"deploy-production.yml",otherWorkflowsChecked:
    readdirSync(workflows).filter(x=>/\.ya?ml$/.test(x)).length-1};
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  try{console.log(JSON.stringify({status:"PASS",...verifySoleReleaseEntrypoint()}));}
  catch(e){console.error("RELEASE_BLOCKED",e.message);process.exitCode=1;}
}
