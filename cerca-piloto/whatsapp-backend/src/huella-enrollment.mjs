/** Controlled multi-family enrollment for the private HUELLA WhatsApp pilot.
 *
 * All incoming identities MUST come from a verified provider webhook. The AI
 * never selects the family and never receives permission to read other families.
 * Invitations are approved only by a private operator in Supabase, never
 * created by arbitrary incoming WhatsApp messages.
 */
import {isAllowedRecipient} from './scheduler.mjs';
const validPhone=phone=>/^[1-9]\d{7,14}$/.test(String(phone||''));
export function multiFamilyCapacity(env=process.env){
 if(env.HUELLA_MULTI_FAMILY_ENABLED!=='true'||env.CERCA_PROVIDER!=='whapi'||
    env.CERCA_SEND_MODE!=='test'||env.HUELLA_SOLO_PILOT_ENABLED!=='true')return 0;
 const legacy=String(env.CERCA_TEST_WA_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);
 if(legacy.length!==1||!validPhone(legacy[0]))return 0;
 const cap=Number(env.HUELLA_MULTI_MAX_FAMILIES||0);
 // Temporary Whapi sandbox: no more than five chats including the operator.
 if(!Number.isInteger(cap)||cap<2||cap>5)return 0;
 return cap;
}
/** Check phone-specific entitlement; never use another family's state or AI text. */
export async function permittedFamilyPhone(phone,{env=process.env,db}={}){
 if(!validPhone(phone))return false;
 if(isAllowedRecipient(phone,env))return true;
 const capacity=multiFamilyCapacity(env);
 if(!capacity||!db||typeof db.isInvited!=='function')return false;
 // Reserve one of the sandbox chats for the pilot operator.
 return (await db.isInvited(String(phone),capacity-1))===true;
}
export function schedulingCapacity(env=process.env){
 const capacity=multiFamilyCapacity(env);
 return capacity||1; // No change to the original one-household pilot.
}
