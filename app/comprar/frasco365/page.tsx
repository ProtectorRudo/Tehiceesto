import type { Metadata } from "next";
import Link from "next/link";
import Jar365Checkout from "@/components/Jar365Checkout";

export const metadata:Metadata={
  title:"Regalá 365 papelitos · Te Hice Esto",
  description:"Un frasco digital con 365 frases genuinas para abrir durante un año."
};

export default function ComprarFrasco365(){
  // Keep purchase explicitly closed until the Supabase order-create deployment
  // recognizes frasco365 and controlled end-to-end payment checks pass.
  if(process.env.JAR365_CHECKOUT_VERIFIED!=="true"){
    return <main style={{minHeight:"100svh",background:"radial-gradient(circle at 80% 8%,#ffe0e9,transparent 45%),#fff8f4",color:"#49313d",padding:"clamp(36px,8vw,110px) 20px",fontFamily:"Arial,sans-serif",display:"grid",placeItems:"center",textAlign:"center"}}>
      <section style={{maxWidth:560}}>
        <span style={{color:"#ac5780",fontSize:11,fontWeight:800,letterSpacing:".2em"}}>TE HICE ESTO ♥ · FRASCO 365</span>
        <h1 style={{font:"normal clamp(48px,8vw,70px)/1.06 Georgia,serif",margin:"20px 0"}}>Un regalo que dura <em style={{color:"#b93468"}}>todo un año.</em></h1>
        <p style={{fontSize:17,lineHeight:1.7,color:"#927786"}}>Estamos terminando de conectar este nuevo frasco con el sistema de compra. La demostración ya se puede probar, pero todavía no habilitamos pagos.</p>
        <Link href="/experiencias/frasco365" style={{display:"inline-block",marginTop:22,background:"#b93468",borderRadius:50,color:"white",padding:"16px 25px",fontWeight:800,textDecoration:"none"}}>Probar el frasco de 365 papelitos ♡</Link>
        <p style={{marginTop:24,fontSize:13,color:"#987e8b"}}>Preferimos entregarlo bien hecho desde el primer día.</p>
      </section>
    </main>;
  }
  return <Jar365Checkout/>;
}