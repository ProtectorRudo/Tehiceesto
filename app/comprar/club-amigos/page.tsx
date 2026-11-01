import {notFound} from "next/navigation";
export const metadata={robots:{index:false,follow:false}};
/** Se retiró Club de Amigos del catálogo. Los pedidos históricos permanecen intactos. */
export default function RetiredClubCheckout(){notFound();}
