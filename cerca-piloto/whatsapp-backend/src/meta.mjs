import {createHmac,timingSafeEqual} from 'node:crypto';
export function validSignature(raw,signature,appSecret){
 if(!appSecret||!signature||!signature.startsWith('sha256='))return false;
 const expected=Buffer.from(createHmac('sha256',appSecret).update(raw).digest('hex'),'utf8');const actual=Buffer.from(signature.slice(7),'utf8');
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export function extractMessages(data){
 const items=[];
 for(const entry of data?.entry||[])for(const change of entry?.changes||[])for(const m of change?.value?.messages||[]){
  const phone=m.from;
  if(!/^\d{7,16}$/.test(phone||''))continue;
  const content=m.type==='text'?m.text?.body:m.type==='interactive'?(m.interactive?.button_reply?.id||m.interactive?.list_reply?.id):m.type==='button'?m.button?.payload:'';
  if(typeof content!=='string'||!content.trim())continue;
  items.push({id:m.id,phone,text:content.trim().slice(0,600),receivedAt:new Date(Number(m.timestamp||0)*1000).toISOString()});
 }
 return items.filter(m=>typeof m.id==='string'&&m.id.length<=180);
}
export function buildPayload(msg,phone,env=process.env){
 const base={messaging_product:'whatsapp',recipient_type:'individual',to:phone};
 if(msg.kind==='template'){
  return {...base,type:'template',template:{name:msg.name,language:{code:env.META_TEMPLATE_LANGUAGE||'es_AR'},components:[{type:'body',parameters:(msg.params||[]).map(text=>({type:'text',text:String(text).slice(0,1000)}))}]}};
 }
 if(msg.options?.length){
  const opts=msg.options.slice(0,10).map((title,i)=>({id:String(title).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(),title:String(title).slice(0,20),i}));
  if(opts.length<=3)return {...base,type:'interactive',interactive:{type:'button',body:{text:msg.body.slice(0,1024)},action:{buttons:opts.map(o=>({type:'reply',reply:{id:o.id,title:o.title}}))}}};
  return {...base,type:'interactive',interactive:{type:'list',body:{text:msg.body.slice(0,1024)},action:{button:'Elegir opción',sections:[{title:'Opciones CERCA',rows:opts.map(o=>({id:o.id,title:o.title}))}]}}};
 }
 return {...base,type:'text',text:{preview_url:false,body:String(msg.body).slice(0,4096)}};
}
export async function sendMeta(msg,phone,{fetcher=fetch,env=process.env}={}){
 const id=env.META_PHONE_NUMBER_ID,token=env.META_ACCESS_TOKEN;
 if(!id||!token)throw new Error('meta_not_configured');
 const graph=env.META_GRAPH_VERSION||'v27.0';if(!/^v\d+\.\d+$/.test(graph))throw new Error('invalid_graph_version');
 const url=`https://graph.facebook.com/${graph}/${id}/messages`;
 const result=await fetcher(url,{method:'POST',headers:{'authorization':`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(buildPayload(msg,phone,env))});
 if(!result.ok)throw new Error(`meta_${result.status}`);
 const messageId=(await result.json()).messages?.[0]?.id;
 if(typeof messageId!=='string'||!messageId.startsWith('wamid.'))throw new Error('meta_missing_message_id');
 return messageId;
}
/** Meta sends delivery receipts independently of user messages. Never interpret them as chat. */
export function extractStatuses(data){
 const found=[];
 for(const entry of data?.entry||[])for(const change of entry?.changes||[])for(const status of change?.value?.statuses||[]){
  if(typeof status.id!=='string'||!status.id.startsWith('wamid.')||status.id.length>256)continue;
  if(!['sent','delivered','read','failed'].includes(status.status))continue;
  found.push({messageId:status.id,status:status.status});
 }
 return found;
}