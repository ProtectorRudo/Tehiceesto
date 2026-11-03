import {permanentRedirect} from "next/navigation";
import {PURCHASED_ROUTE_CONTRACT} from "@/lib/release/public-route-contract.mjs";
export default function LegacyMemeMatch(){
  permanentRedirect(PURCHASED_ROUTE_CONTRACT.pack);
}
