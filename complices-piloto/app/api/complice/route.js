// Cómplices v2: la IA es un motor de perfiles y recomendaciones automáticas,
// no un chat. El chat ENTRE la pareja continúa en cp_messages.
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"no-store","X-Robots-Tag":"noindex"};
export function GET(){return Response.json({mode:"central",chat:false,recommendations:"/api/central"},{headers:HEADERS})}
export function POST(){return Response.json({error:"El chat con IA no forma parte de Cómplices. Las recomendaciones se generan automáticamente desde los perfiles.",mode:"central"},{status:410,headers:HEADERS})}
