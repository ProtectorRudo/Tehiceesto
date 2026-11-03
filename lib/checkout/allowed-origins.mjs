/**
 * Trust only the actual TeHiceEsto customer domains (even when Vercel's
 * legacy host rewrite makes req.nextUrl.origin point at an internal project)
 * and first-party preview hosts for their own same-origin requests.
 *
 * This is not a CORS wildcard; browser Sec-Fetch-Site checks remain active
 * in the checkout route. Unknown origins fail closed.
 */
const publicOrigins = new Set([
 "https://tehiceesto.com",
 "https://www.tehiceesto.com",
 "https://tehiceesto.vercel.app",
]);
const firstPartyVercelHost = /^tehiceesto(?:-[a-z0-9-]+)?\.vercel\.app$/;

export function isAllowedCheckoutOrigin(origin,requestOrigin,nodeEnv="production"){
 // Keep origin-less non-browser callers compatible with the previous route;
 // request validation, consent, idempotency and payment authorization remain.
 if(origin===null)return true;
 if(typeof origin!=="string"||!origin)return false;
 let received,requested;
 try{
  received=new URL(origin);
  requested=new URL(requestOrigin);
 }catch{return false;}
 // A browser Origin is just scheme + host (+ port); reject spoofed paths,
 // credentials, malformed ports, trailing slash and "null".
 if(received.origin!==origin||received.username||received.password||
    received.pathname!=="/"||received.search||received.hash||
    received.protocol!=="https:"&&!(nodeEnv!=="production"&&received.protocol==="http:"))return false;
 if(publicOrigins.has(origin))return true;
 if(received.origin!==requested.origin)return false;
 if(requested.protocol==="https:"&&firstPartyVercelHost.test(requested.hostname))return true;
 return nodeEnv!=="production"&&
  ["localhost","127.0.0.1"].includes(requested.hostname)&&
  requested.protocol==="http:";
}
