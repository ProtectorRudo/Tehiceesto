import {permanentRedirect} from "next/navigation";
import {PURCHASED_ROUTE_CONTRACT} from "@/lib/release/public-route-contract.mjs";

// Historical confirmation links must never become 404 after a redesign.
export default function LegacyPackReceipt(){
  permanentRedirect(PURCHASED_ROUTE_CONTRACT.myGifts);
}
