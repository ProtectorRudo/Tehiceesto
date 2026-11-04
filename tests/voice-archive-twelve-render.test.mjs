import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {createRequire} from "node:module";
import ts from "typescript";

const require=createRequire(import.meta.url);
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const react=require("react");
const {renderToStaticMarkup}=require("react-dom/server");

function voiceComponent(){
 const source=read("components/GiftVoiceCollection.tsx");
 const compiled=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,
  target:ts.ScriptTarget.ES2022
 }}).outputText;
 const module={exports:{}};
 const deps={
  react, "react/jsx-runtime":require("react/jsx-runtime"),
  "./GiftVoiceCollection.module.css":new Proxy({},{get:(_target,key)=>String(key)})
 };
 runInNewContext(compiled,{
  module,exports:module.exports,
  require:name=>{
   if(!(name in deps))throw Error("Unexpected module "+name);
   return deps[name];
  }
 });
 return module.exports.default;
}

const fixture=Array.from({length:12},(_,i)=>({
 url:"https://storage.example.test/guest-"+String(i+1).padStart(2,"0")+".ogg",
 caption:"Invitado "+String(i+1).padStart(2,"0")
}));

test("The premium gift voice archive renders all twelve received voices, no truncation",()=>{
 const Component=voiceComponent();
 const html=renderToStaticMarkup(react.createElement(Component,{audios:fixture,embedded:true}));
 assert.equal((html.match(/<audio\b/g)||[]).length,12);
 assert.equal((html.match(/<li\b/g)||[]).length,12);
 assert.match(html,/data-voice-count="12"/);
 for(let i=1;i<=12;i++){
  assert.match(html,new RegExp("Invitado "+String(i).padStart(2,"0")));
  assert.match(html,new RegExp("guest-"+String(i).padStart(2,"0")+"\\.ogg"));
 }
 assert.match(html,/Todas las voces de este regalo/);
});

test("The published gift exposes the count; no fake media and no public demo controls",()=>{
 const Component=voiceComponent();
 const published=renderToStaticMarkup(react.createElement(Component,{audios:fixture}));
 assert.match(published,/Escuchar 12 voces/);
 assert.doesNotMatch(published,/<audio\b/,"Audio is lazy-loaded after the private archive opens");
 const empty=renderToStaticMarkup(react.createElement(Component,{audios:[]}));
 assert.equal(empty,"");
 const soundtrack=renderToStaticMarkup(react.createElement(Component,{
  audios:[{url:"",caption:"not valid"},fixture[0]],embedded:true
 }));
 assert.equal((soundtrack.match(/<audio\b/g)||[]).length,1);
});

test("Invitation text promises only the complete archive, not all voices inside each original scene",()=>{
 const component=read("components/GuestVoiceInvites.tsx");
 assert.match(component,/todas las voces recibidas/);
 assert.match(component,/Algunas escenas destacan solo una parte/);
 assert.match(component,/hasta 12 mensajes según el espacio libre/);
 const gift=read("app/r/[code]/page.tsx");
 assert.equal(gift.split("<GiftVoiceCollection audios={storedGift.audioMedia}").length-1,5);
});
