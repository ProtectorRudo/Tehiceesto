import {dirname} from "node:path";
import {fileURLToPath} from "node:url";
export default {
 reactStrictMode:true,
 turbopack:{root:dirname(fileURLToPath(import.meta.url))}
};
