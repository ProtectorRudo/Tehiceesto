// Adaptador HTTP exclusivo: expone TurnoVivo en el servidor Node realmente activo.
// No cambia rutas ni envíos existentes de HUELLA.
export async function handleTurnoVivoBridge(req,res,url) {
  if (!['GET','POST','OPTIONS'].includes(req.method)) {
    res.writeHead(405,{'content-type':'application/json','cache-control':'no-store'});
    return res.end(JSON.stringify({error:'method_not_allowed'}));
  }
  const headers=new Headers();
  for (const [key,value] of Object.entries(req.headers)) {
    if (value!==undefined) headers.set(key,Array.isArray(value)?value.join(', '):String(value));
  }
  if (req.method==='POST' && Number(headers.get('content-length')||0)>5_000_000) {
    res.writeHead(413,{'content-type':'application/json','cache-control':'no-store'});
    return res.end(JSON.stringify({error:'payload_too_large'}));
  }
  // Se importa bajo demanda, nunca durante el arranque o tareas de HUELLA.
  const bridge=await import('../../app/api/turnovivo-ai/route.js');
  let body;
  if (req.method==='POST') {
    let size=0;const chunks=[];
    for await (const chunk of req) {
      size+=chunk.length;
      if (size>5_000_000) {
        res.writeHead(413,{'content-type':'application/json','cache-control':'no-store'});
        return res.end(JSON.stringify({error:'payload_too_large'}));
      }
      chunks.push(chunk);
    }
    body=Buffer.concat(chunks);
  }
  const webRequest=new Request(new URL(url.pathname+url.search,'https://cerca-piloto.onrender.com'),{
    method:req.method,headers,...(body?{body}:{})
  });
  const response=await bridge[req.method](webRequest);
  res.writeHead(response.status,Object.fromEntries(response.headers.entries()));
  return res.end(Buffer.from(await response.arrayBuffer()));
}
