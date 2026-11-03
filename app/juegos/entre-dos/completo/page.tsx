import {permanentRedirect} from "next/navigation";
import {PURCHASED_ROUTE_CONTRACT} from "@/lib/release/public-route-contract.mjs";
// The individual game belongs to the authenticated four-game pack.
export default function LegacyEntreDos(){
  permanentRedirect(PURCHASED_ROUTE_CONTRACT.pack);
}
