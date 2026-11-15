export const dynamic="force-dynamic";
export function GET(){
 const mode=process.env.OPENAI_API_KEY?"generativa":"guiado";
 const push=Boolean(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY&&process.env.NOTIFY_INTERNAL_KEY);
 return Response.json({application:"complices",pilot:true,ai:mode,pushConfigured:push,commit:process.env.RENDER_GIT_COMMIT?.slice(0,8)||"no-disponible"},{headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex"}});
}
