/** Explicit operator action: creates instance if missing and sets authenticated webhook.
 * Usage: node --env-file=.env configure.mjs (on host); no credentials printed.
 * Does NOT link WhatsApp, send customer messages or enable scheduled missions.
 */
const env=process.env;
const host=env.EVOLUTION_HOST,apiKey=env.EVOLUTION_API_KEY,instance='cerca-piloto';
const secret=env.CERCA_BRIDGE_WEBHOOK_SECRET;
if(!/^[a-z0-9.-]+$/i.test(host||'')||!host?.includes('.')||String(apiKey||'').length<32||String(secret||'').length<32){
 process.stderr.write('CERCA Bridge configuration invalid; verify host and independent secrets.\n');process.exit(1);
}
const endpoint=`https://${host}`;
const request=async(path,body,method='POST')=>{
 const res=await fetch(endpoint+path,{method,headers:{apikey:apiKey,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 if(!res.ok){throw new Error(`Evolution API ${path} returned HTTP ${res.status}`)}
 return res.json();
};
try {
 let existing=await request('/instance/fetchInstances',undefined,'GET');
 if(!Array.isArray(existing))existing=existing?.instances||[];
 const found=existing.some(i=>(i.name||i.instance?.instanceName||i.instanceName)===instance);
 if(!found){
  await request('/instance/create',{instanceName:instance,integration:'WHATSAPP-BAILEYS',qrcode:true,number:''});
  process.stdout.write('CERCA instance created.\n');
 }
 const webhooks={webhook:{enabled:true,url:'https://cerca-piloto.onrender.com/webhooks/evolution',webhookByEvents:false,webhookBase64:false,headers:{'X-Cerca-Bridge-Secret':secret},events:['MESSAGES_UPSERT']}};
 await request('/webhook/set/'+instance,webhooks);
 const actual=await request('/webhook/find/'+instance,undefined,'GET');
 const data=actual.webhook||actual;
 if(data.url!==webhooks.webhook.url||!data.enabled||!data.events?.includes('MESSAGES_UPSERT'))throw new Error('Webhook configuration was not persisted');
 process.stdout.write('CERCA webhook installed and read-back verified. No outbound messages enabled.\n');
} catch (err) {
 process.stderr.write(`Cannot configure CERCA Bridge: ${err.message}\n`);process.exit(1);
}