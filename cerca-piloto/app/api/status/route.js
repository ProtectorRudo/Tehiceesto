import {isConfigured} from "../../../lib/server.mjs";
import {hasAI} from "../../../lib/openai.mjs";
export async function GET(){return Response.json({service:"CERCA",version:"0.1.0",status:isConfigured()?"configured":"pending_database",databaseConfigured:isConfigured(),aiConfigured:hasAI(),time:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}})}
