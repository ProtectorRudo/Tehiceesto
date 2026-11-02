import {notFound} from "next/navigation";
export const metadata={robots:{index:false,follow:false}};
/** No new orders for the withdrawn model. Previously purchased gifts remain intact. */
export default function RetiredStickerBombCheckout(){notFound();}
