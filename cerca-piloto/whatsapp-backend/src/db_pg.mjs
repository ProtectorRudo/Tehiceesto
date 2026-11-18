/** CERCA limited-privilege PostgreSQL adapter: private `cerca` schema only.
 * Render needs CERCA_DATABASE_URL for a pooler endpoint and dedicated cerca_worker login.
 * No Supabase service_role key is read or used by this adapter.
 */
export function makePgDb(env=process.env, {poolFactory}={}) {
 const host=String(env.CERCA_DB_HOST||'').trim();
 const ref=String(env.CERCA_DB_PROJECT_REF||'').trim();
 const password=String(env.CERCA_DB_PASSWORD||'');
 if(host && !/^[a-z0-9.-]+\.pooler\.supabase\.com$/i.test(host))throw new Error('invalid_cerca_pooler_host');
 if(ref && !/^[a-z0-9]{12,32}$/.test(ref))throw new Error('invalid_cerca_project_ref');
 const url=env.CERCA_DATABASE_URL || (host && ref && password ?
  `postgresql://${encodeURIComponent('cerca_worker.'+ref)}:${encodeURIComponent(password)}@${host}:5432/postgres`: '');
 let poolPromise;
 async function pool(){
   if(!url) throw new Error('cerca_database_not_configured');
   if(!poolPromise)poolPromise=(async()=>{
     const Factory=poolFactory||((await import('pg')).default.Pool);
     return new Factory({
       connectionString:url,
       max:2,
       connectionTimeoutMillis:5000,
       idleTimeoutMillis:30000,
       ssl:{rejectUnauthorized:true,...(env.CERCA_DB_CA_PEM?{ca:env.CERCA_DB_CA_PEM.replace(/\\n/g,'\n')}:{})}
     });
   })();
   return poolPromise;
 }
 async function sql(query,args=[]){return (await (await pool()).query(query,args)).rows;}
 const errorRecast=(e)=>{
   if(e.message==='cerca_conflict') throw new Error('database_409');
   throw e;
 };
 return {
   available:()=>Boolean(url),
   async ping(){await sql('select 1 as ok');return true;},
   async family(phone){return (await sql('select id,revision,state from cerca.families where wa_id=$1 limit 1',[phone]))[0]||null;},
   async activeFamilies(){return await sql("select id,wa_id,revision,state from cerca.families where state->>'status'='active' limit 500");},
   async commit(phone,revision,eventId,state,outbox){
     try{return (await sql('select cerca.apply_event($1::text,$2::integer,$3::text,$4::jsonb,$5::jsonb) as value',
       [phone,revision,eventId,JSON.stringify(state),JSON.stringify(outbox)]))[0]?.value;}
     catch(err){return errorRecast(err);}
   },
   async pending(){return await sql("select job_key,wa_id,payload,channel,expires_at,attempts from cerca.outbox where status='pending' and attempts<3 order by (channel='service') desc, created_at asc limit 100");},
   async setSent(key,providerId){await sql("update cerca.outbox set status='sent',provider_message_id=$2,sent_at=now() where job_key=$1",[key,String(providerId||'').slice(0,256)]);},
   async setDelivery(messageId,status){await sql('update cerca.outbox set delivery_status=$2 where provider_message_id=$1',[messageId,status]);},
   async setCancelled(key){await sql("update cerca.outbox set status='cancelled' where job_key=$1",[key]);},
   async retry(key,attempts){await sql('update cerca.outbox set attempts=$2 where job_key=$1',[key,attempts+1]);},
   async sentThisMonth(start){return await sql("select channel from cerca.outbox where status='sent' and sent_at >= $1::timestamptz limit 20000",[start]);}
 };
}
/**
 * Stable, non-sensitive error category for an operator health check.
 * Never return raw PostgreSQL/OS errors, hostnames or credential data.
 */
export function classifyDbFailure(error) {
 const code=String(error?.code||'').toUpperCase();
 const msg=String(error?.message||'').toLowerCase();
 if(code==='28P01'||/password authentication failed|failed sasl authentication|invalid password|authentication failed/.test(msg))return 'authentication';
 if(code==='28000'||/role .* does not exist|tenant or user not found|unknown tenant|no such user/.test(msg))return 'role_or_pooler';
 if(['UNABLE_TO_VERIFY_LEAF_SIGNATURE','SELF_SIGNED_CERT_IN_CHAIN','DEPTH_ZERO_SELF_SIGNED_CERT','CERT_HAS_EXPIRED','ERR_TLS_CERT_ALTNAME_INVALID'].includes(code)||/certificate verify failed|self.signed certificate|unable to verify.*certificate|certificate has expired/.test(msg))return 'tls_certificate';
 if(code.startsWith('ERR_SSL')||/ssl error|tls handshake|sslmode/.test(msg))return 'tls_handshake';
 if(['ENOTFOUND','EAI_AGAIN'].includes(code))return 'dns';
 if(code==='ETIMEDOUT'||/connection terminated due to connection timeout|connection timeout|timeout exceeded/.test(msg))return 'timeout';
 if(['ECONNREFUSED','EHOSTUNREACH','ENETUNREACH','ECONNRESET'].includes(code))return 'network';
 if(/client password must be a string|invalid connection string|invalid_cerca_pooler_host/.test(msg))return 'configuration';
 return 'unclassified';
}
