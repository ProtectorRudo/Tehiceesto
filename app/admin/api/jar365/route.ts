/** Admin cookie is deliberately scoped to /admin. The staff editor calls this route
 * so the existing protected session cookie reaches the same validated handler. */
export { POST } from "@/app/api/jar365/route";
export const dynamic="force-dynamic";
