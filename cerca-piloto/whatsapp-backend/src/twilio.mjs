/** CERCA Twilio WhatsApp Sandbox adapter. Only official Twilio Messaging API.
 * The Sandbox is non-production and users must opt in via Twilio's join code.
 */
import {createHmac, timingSafeEqual} from 'node:crypto';

const wa = v => /^whatsapp:\+[1-9]\d{7,14}$/.test(String(v||''));
const sid = v => /^AC[0-9a-f]{32}$/i.test(String(v||''));
const messageSid = v => /^(SM|MM)[0-9a-f]{32}$/i.test(String(v||''));

export function parseTwilioForm(raw) {
 const params=new URLSearchParams(Buffer.isBuffer(raw)?raw.toString('utf8'):String(raw));
 const obj=Object.create(null);
 for (const [k,v] of params) {
  if (Object.hasOwn(obj,k)) throw new Error('duplicate_twilio_form_key');
  if (k.length>110 || v.length>8192) throw new Error('twilio_form_exceeds_limits');
  obj[k]=v;
 }
 return obj;
}

/** Twilio's classic x-www-form-urlencoded signature: HMAC-SHA1 over URL+sorted form fields. */
export function validateTwilioSignature(url,fields,signature,token) {
 if (!token || !signature || !/^https:\/\//.test(url)) return false;
 // Only a properly formed base64 SHA-1 MAC is accepted.
 if (!/^[A-Za-z0-9+/]{27}=$/.test(signature)) return false;
 const keys=Object.keys(fields).sort();
 const base=url+keys.map(k=>k+fields[k]).join('');
 const expected=createHmac('sha1',token).update(base).digest();
 const actual=Buffer.from(signature,'base64');
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}

export function extractTwilioMessage(fields,{accountSid,fromNumber,receivedAt=new Date().toISOString()}={}) {
 if (!sid(accountSid) || fields.AccountSid!==accountSid || !wa(fromNumber) || fields.To!==fromNumber) return null;
 if (!wa(fields.From) || !messageSid(fields.MessageSid)) return null;
 const text=String(fields.ButtonPayload||fields.Body||'').trim();
 if (!text || text.length>600) return null;
 return {id:'twilio:'+fields.MessageSid,phone:fields.From.slice('whatsapp:+'.length),text,receivedAt};
}

export function extractTwilioStatus(fields,{accountSid}={}) {
 if (!sid(accountSid) || fields.AccountSid!==accountSid || !messageSid(fields.MessageSid))return null;
 const mapped={sent:'sent',delivered:'delivered',read:'read',failed:'failed',undelivered:'failed'};
 const status=mapped[fields.MessageStatus];
 if(!status)return null;
 return {messageId:fields.MessageSid,status};
}

export function formatTwilioReply(msg) {
 const body=String(msg?.body??'');
 const options=Array.isArray(msg?.options)?msg.options.slice(0,10):[];
 return (body+(options.length?'\n\nRespondé: '+options.map(String).join(' | '):'')).slice(0,1600);
}

/** Sends through Twilio REST (not TwiML), preserving durable DB outbox + provider SID. */
export async function sendTwilio(msg,phone,{env=process.env,fetcher=fetch}={}) {
 const account=env.TWILIO_ACCOUNT_SID,token=env.TWILIO_AUTH_TOKEN,from=env.TWILIO_WHATSAPP_FROM;
 if(!sid(account)||!token||!wa(from)||!/^\d{7,15}$/.test(String(phone)))throw new Error('twilio_not_configured');
 const form=new URLSearchParams({From:from,To:'whatsapp:+'+phone});
 if(msg?.kind==='template') {
  if(env.CERCA_TEMPLATES_APPROVED!=='true'||!/^HX[0-9a-f]{32}$/i.test(String(msg.name||'')))throw new Error('twilio_template_not_approved');
  form.set('ContentSid',msg.name);
  form.set('ContentVariables',JSON.stringify(Object.fromEntries((msg.params||[]).map((v,i)=>[i+1,String(v).slice(0,1000)]))));
 } else {
  if(!msg || typeof msg.body!=='string')throw new Error('twilio_invalid_message');
  form.set('Body',formatTwilioReply(msg));
 }
 if(env.TWILIO_STATUS_WEBHOOK_URL){
  if(!/^https:\/\//.test(env.TWILIO_STATUS_WEBHOOK_URL))throw new Error('twilio_invalid_status_url');
  form.set('StatusCallback',env.TWILIO_STATUS_WEBHOOK_URL);
 }
 const url=`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`;
 const result=await fetcher(url,{method:'POST',headers:{authorization:'Basic '+Buffer.from(`${account}:${token}`).toString('base64'),'content-type':'application/x-www-form-urlencoded'},body:form.toString()});
 if(!result.ok)throw new Error(`twilio_${result.status}`);
 const received=await result.json();
 if(!messageSid(received.sid))throw new Error('twilio_missing_sid');
 return received.sid;
}