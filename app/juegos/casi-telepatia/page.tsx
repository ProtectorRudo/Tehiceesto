import type {Metadata} from "next";
export const metadata:Metadata={
 title:"Casi Telepatía · 600 preguntas · Te Hice Esto",
 description:"Casi Telepatía: 600 preguntas, 20 temas y un solo celular para dos personas. Un juego original para saber cuánto se conocen.",
};
export default function CasiTelepatia(){
 return <main className="casi-telepatia-embedded-route" style={{width:"100%",height:"100dvh",overflow:"hidden",background:"#211628",margin:0,padding:0}}>
  <style>{`body:has(.casi-telepatia-embedded-route)>.site-header,body:has(.casi-telepatia-embedded-route)>.floating-whatsapp{display:none!important} body:has(.casi-telepatia-embedded-route){margin:0;background:#211628;color-scheme:dark}`}</style>
  <iframe title="Casi Telepatía · juego completo para dos personas" src="/juegos/casi-telepatia/index.html" style={{display:"block",width:"100%",height:"100%",border:0,background:"#211628"}} allow="clipboard-write" loading="eager"/>
 </main>;
}