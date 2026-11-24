import {createRoot} from "react-dom/client";
import {getExperience} from "@/data/experiences";
import Jar365FreeVisit from "@/components/Jar365FreeVisit";
const experience=getExperience("frasco365");
if(!experience)throw Error("Missing Frasco 365 model");
createRoot(document.getElementById("root")!).render(<Jar365FreeVisit experience={experience}/>);
