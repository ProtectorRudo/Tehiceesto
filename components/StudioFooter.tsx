import Link from "next/link";
export default function StudioFooter(){
  return <footer className="studio-site-footer">
    <strong>TE HICE ESTO<span> ♥</span></strong>
    <span>Experiencias privadas, recuerdos para siempre.</span>
    <nav aria-label="Enlaces de Te Hice Esto"><Link href="/">Inicio</Link><Link href="/#coleccion">Experiencias</Link><Link href="/mis-regalos">Mis regalos</Link></nav>
  </footer>;
}
