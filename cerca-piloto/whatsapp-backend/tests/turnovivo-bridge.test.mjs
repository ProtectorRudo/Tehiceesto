import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {handleTurnoVivoBridge} from '../src/turnovivo-bridge-http.mjs';
async function withServer(cb){
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/api/turnovivo-ai')return handleTurnoVivoBridge(req,res,url).catch(()=>{res.writeHead(503);res.end('not_ready')});
    res.writeHead(200);res.end('huella_untouched');
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{await cb('http://127.0.0.1:'+server.address().port)}
  finally{await new Promise(r=>server.close(r))}
}
test('TurnoVivo: acceso sin sesión rechazado y HUELLA inalterada',async()=>withServer(async base=>{
  const auth=await fetch(base+'/api/turnovivo-ai?action=status');
  assert.equal(auth.status,401);assert.match(await auth.text(),/Iniciá sesión/);
  const huella=await fetch(base+'/healthz');assert.equal(huella.status,200);assert.equal(await huella.text(),'huella_untouched');
}));
test('TurnoVivo: preflight CORS solo desde dominio oficial',async()=>withServer(async base=>{
  const ok=await fetch(base+'/api/turnovivo-ai',{method:'OPTIONS',headers:{origin:'https://turnovivo-mvp-demo.vercel.app'}});
  assert.equal(ok.status,204);assert.equal(ok.headers.get('access-control-allow-origin'),'https://turnovivo-mvp-demo.vercel.app');
  const bad=await fetch(base+'/api/turnovivo-ai',{method:'OPTIONS',headers:{origin:'https://otro.ejemplo.com'}});
  assert.equal(bad.headers.has('access-control-allow-origin'),false);
}));
test('TurnoVivo: rechaza métodos y cargas excesivas',async()=>withServer(async base=>{
  const method=await fetch(base+'/api/turnovivo-ai',{method:'PUT'});assert.equal(method.status,405);
  const large=await fetch(base+'/api/turnovivo-ai?action=extract',{method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(5_000_001)});
  assert.equal(large.status,413);
}));
