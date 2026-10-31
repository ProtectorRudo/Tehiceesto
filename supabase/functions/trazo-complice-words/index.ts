import { createClient } from "npm:@supabase/supabase-js@2";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
function defaultKey(name:string){
 try {const value=JSON.parse(Deno.env.get(name)||"{}");return typeof value.default==="string"?value.default:"";}catch{return "";}
}
const SECRET=defaultKey("SUPABASE_SECRET_KEYS");
function bank(){
 const window:any={};
 
/* Original drawing prompts. Designed for a shared single-device game.
   Every item must be drawable; duplicates are rejected by tests. */
(function () {
  'use strict';
  const categories = {
    animales: {
      name: 'Animales', symbol: '🐾', tone: 'coral',
      easy: `gato|perro|conejo|oso|león|tigre|elefante|jirafa|cebra|mono|vaca|caballo|cerdo|oveja|cabra|gallina|pollo|pato|ganso|búho|águila|pingüino|delfín|ballena|tiburón|pulpo|cangrejo|tortuga|serpiente|rana|mariposa|abeja|hormiga|araña|caracol|pez payaso|koala|panda|cocodrilo|hipopótamo|rinoceronte|canguro|camello|lobo|zorro|ratón|ardilla|murciélago|flamenco|pavo real|lagarto|medusa|foca|morsa|erizo|llama|burro|castor|nutria|caballito de mar|mapache|avestruz|ciervo|pavo|mariquita|grillo|langosta|pez globo`,
      medium: `puercoespín|dragón de Komodo|ornitorrinco|oso hormiguero|pez espada|mantarraya|estrella de mar|caballo de carreras|pulga|escarabajo|cucaracha|cisne|gorila|chimpancé|búfalo|alce|reno|bisonte|leopardo|guepardo|jaguar|hiena|suricata|lémur|capibara|armadillo|topo|camaleón|iguana|salamandra|cigüeña|pelícano|tucán|colibrí|loro|cacatúa|paloma|buitre|halcón|águila pescadora|pez luna|bacalao|salmón|trucha|atún|orca|beluga|narval|calamar|langostino|langosta marina`,
      hard: `cangrejo ermitaño|sapo con corona|gato astronauta|perro salchicha|búho con anteojos|panda en bicicleta|pulpo músico|caracol corredor|tortuga ninja|pingüino patinador|león dormido|vaca voladora|elefante de circo|jirafa en pijama|tiburón sonriente|conejo mago|zorro detective|oso cocinero|pato con paraguas|ballena saltando` 
    },
    comida: {
      name: 'Comida', symbol: '🍓', tone: 'pink',
      easy: `pizza|hamburguesa|papas fritas|torta|helado|banana|manzana|pera|naranja|limón|frutilla|sandía|ananá|uva|cereza|durazno|kiwi|coco|zanahoria|tomate|papa|lechuga|brócoli|cebolla|ajo|choclo|zapallo|huevo frito|pan|tostada|sándwich|salchicha|pancho|empanada|milanesa|queso|jamón|fideos|arroz|sushi|donas|galletita|alfajor|chocolate|caramelo|chupetín|pochoclos|panqueque|waffle|café|taza de té|leche|jugo de naranja|agua mineral|gaseosa|sopa|ensalada|palta|pepino|miel|mermelada|manteca|maní|nuez|almendra|arvejas`,
      medium: `tarta de manzana|tacos|burrito|nachos|quesadilla|ravioles|ñoquis|lasaña|risotto|canelones|tallarines|fugazzeta|calzone|choripán|asado|churrasco|pollo al horno|pescado frito|sopa de letras|arroz con leche|flan|gelatina|budín|bizcochuelo|cupcake|macarón|brownie|cheesecake|tiramisu|chocotorta|medialuna|factura|churro|tostado|bagel|sopa crema|guiso|locro|humita|tortilla de papa|hummus|falafel|tempura|ramen|paella|fondue|batido de frutas|licuado de banana|limonada|mate|termo|sandía cortada`,
      hard: `hamburguesa gigante|pizza con ananá|helado derritiéndose|torta de tres pisos|gato comiendo sushi|pan tostado quemado|café con corazón|donas apiladas|ensalada de frutas|volcán de chocolate|sándwich volador|frutilla bañada en chocolate|pastel con velitas|taco picante|pollo bailando|queso con agujeros|lechuga enojada|hamburguesa espacial|sopa con cuchara|caramelo pegajoso`
    },
    objetos: {
      name: 'Objetos', symbol: '✏️', tone: 'violet',
      easy: `lápiz|lapicera|goma de borrar|sacapuntas|regla|tijeras|pegamento|cuaderno|libro|mochila|reloj|espejo|llave|candado|paraguas|sombrero|gorra|anteojos|lentes de sol|bufanda|guantes|zapato|zapatilla|bota|medias|campera|pantalón|remera|vestido|pollera|corbata|pulsera|anillo|collar|aros|cartera|valija|billetera|moneda|billete|linterna|vela|encendedor|caja|regalo|globo|pelota|raqueta|patineta|patines|casco|medalla|trofeo|silbato|cuerda|brocha|pincel|martillo|destornillador|pinza|clavo|tornillo|serrucho|escalera|balde|escoba|pala|manguera|cepillo de dientes|peine|secador de pelo`,
      medium: `telescopio|microscopio|brújula|mapa del tesoro|máquina de escribir|máquina de coser|calculadora|calculadora científica|control remoto|joystick|auriculares|parlante|micrófono|cámara de fotos|trípode|filmadora|impresora|proyector|pantalla de cine|binoculares|candado con llave|cinta métrica|nivel de burbuja|rueda de bicicleta|cadena|candela|abrelatas|sacacorchos|batidor|rallador|colador|espátula|pinza de cocina|tabla de cortar|pava eléctrica|termo de acero|taza térmica|bolsa de dormir|carpa|catalejo|guitarra eléctrica|violín|trompeta|saxofón|acordeón|tambor|maracas|pandereta|armónica|piano|flauta|batería musical`,
      hard: `llave antigua|reloj de arena|lámpara de lava|espejo roto|pelota pinchada|mochila abierta|zapato con alas|paraguas invertido|anteojos gigantes|lápiz mordido|linterna encendida|cámara instantánea|teléfono con cable|caja musical|barquito de papel|mensaje en botella|alcancía de cerdito|robot aspiradora|reloj despertador|avión de papel`
    },
    lugares: {
      name: 'Lugares', symbol: '🏰', tone: 'mint',
      easy: `casa|castillo|escuela|hospital|farmacia|panadería|supermercado|cine|teatro|museo|biblioteca|plaza|parque|playa|montaña|bosque|desierto|selva|isla|río|lago|cascada|puente|estadio|cancha de fútbol|piscina|pileta|gimnasio|restaurante|cafetería|hotel|aeropuerto|estación de tren|iglesia|zoológico|acuario|granja|jardín|huerta|patio|terraza|balcón|dormitorio|cocina|baño|comedor|living|garaje|sótano|ático|ascensor|escalera mecánica|estación de servicio|estacionamiento|feria|circo|parque de diversiones|campamento|cueva|volcán|faro`,
      medium: `casa del árbol|cabaña de madera|isla desierta|nave espacial por dentro|submarino hundido|mansión embrujada|castillo de arena|puerto pesquero|muelle|pista de hielo|pista de carreras|pista de aterrizaje|cancha de básquet|cancha de tenis|cancha de vóley|cancha de golf|estudio de grabación|sala de conciertos|sala de juegos|fábrica de chocolate|laboratorio|estudio de televisión|escuela de magia|barco pirata|estación espacial|planetario|observatorio|torre del reloj|casa rodante|casa flotante|cascada congelada|camino de tierra|pasillo secreto|ático lleno de cajas|cafetería de gatos|hotel bajo el agua|restaurante en las nubes|jardín japonés|parque acuático|pueblo fantasma`,
      hard: `laberinto de setos|puente colgante|cueva de cristales|biblioteca infinita|castillo en una nube|isla con palmeras|casa al revés|torre inclinada|bosque nevado|desierto con cactus|playa de noche|búnker secreto|pirámide egipcia|templo antiguo|faro en tormenta`
    },
    transporte: {
      name: 'Transportes', symbol: '🚀', tone: 'blue',
      easy: `auto|camión|camioneta|colectivo|micro escolar|taxi|ambulancia|camión de bomberos|patrullero|motocicleta|bicicleta|triciclo|monopatín|tren|subte|tranvía|avión|helicóptero|barco|velero|lancha|canoa|kayak|bote|submarino|cohete|globo aerostático|nave espacial|tractor|excavadora|grúa|aplanadora|carretilla|carro de compras|carrito de bebé|trineo|góndola|teleférico|carreta|caballo con carro|patines en línea|moto de agua|tabla de surf|ala delta|parapente|dirigible`,
      medium: `camión de helados|camión recolector|camión cisterna|camión de mudanzas|camión volquete|auto de carreras|auto antiguo|auto descapotable|limusina|caravana|coche de policía|camioneta 4x4|moto con sidecar|bici tandem|tren bala|tren de vapor|tren de carga|tranvía antiguo|avión de papel gigante|avión de combate|avión privado|hidroavión|barco pesquero|barco de crucero|barco a remo|barco de rescate|balsa de madera|vehículo lunar|robot mensajero|tráiler de caballos`,
      hard: `auto volador|bicicleta de una rueda|barco en botella|cohete despegando|tren atravesando túnel|avión entre nubes|globo desinflándose|camión atascado|barco en tormenta|helicóptero aterrizando|moto saltando rampa|tren con humo|submarino explorador|taxi amarillo|patineta con cohete`
    },
    naturaleza: {
      name: 'Naturaleza', symbol: '🌿', tone: 'green',
      easy: `sol|luna|estrella|nube|arcoíris|lluvia|nieve|granizo|rayo|trueno|viento|tormenta|tornado|huracán|ola|charco|hielo|fuego|humo|árbol|flor|rosa|girasol|margarita|tulipán|cactus|palmera|pino|hoja|pasto|rama|tronco|raíz|semilla|honguito|trébol|corazón de flores|montaña nevada|duna|piedra|roca|piedra preciosa|cristal|diamante|perla|concha marina|caracol marino|coral|algas|arena|estrella fugaz|eclipse|planeta|saturno|tierra|marte|cometa|asteroide|galaxia|constelación|amanecer|atardecer|fogata|géiser|laguna|pantano`,
      medium: `árbol sin hojas|árbol con frutas|árbol de Navidad|ramo de flores|corona de flores|maceta rota|semilla germinando|flor marchita|jardín de rosas|bosque encantado|cascada de hielo|nube de tormenta|arcoíris doble|lluvia de estrellas|huracán sobre el mar|volcán en erupción|rayo cayendo|ola gigante|isla volcánica|eclipse solar|luna llena|media luna|cielo estrellado|sistema solar|montaña rusa natural|gruta de hielo|caverna con estalactitas|árbol caído|selva lluviosa|plantación de girasoles`,
      hard: `flor carnívora|cactus con sombrero|árbol que camina|nube con cara|sol con anteojos|luna durmiendo|tormenta en un vaso|arcoíris dentro de casa|árbol que da caramelos|planeta con anillos|estrella con patitas|montaña sonriente|flor en una botella|cascada arcoíris|roca flotante`
    },
    personas: {
      name: 'Personas', symbol: '🎭', tone: 'amber',
      easy: `pirata|astronauta|doctor|doctora|bombero|policía|maestro|maestra|cocinero|chef|panadero|pintor|artista|músico|cantante|bailarina|bailarín|mago|payaso|detective|científico|arqueólogo|fotógrafo|cartero|jardinero|granjero|pescador|marinero|piloto|capitán|soldado|enfermera|dentista|veterinario|mecánico|albañil|electricista|plomero|carpintero|peluquero|barbero|arquitecto|futbolista|basquetbolista|tenista|nadador|ciclista|corredor|esquiador|escalador|surfista|gimnasta|boxeador|árbitro|director de cine|actor|actriz|periodista|locutor|rey|reina|princesa|príncipe|caballero medieval|ninja`,
      medium: `astronauta en la luna|chef haciendo pizza|pintor frente a un cuadro|detective con lupa|mago sacando un conejo|pirata buscando tesoro|bombero con manguera|payaso haciendo malabares|fotógrafo en una boda|veterinario con gatito|científico mezclando pociones|cantante con micrófono|futbolista festejando gol|bailarina de ballet|surfista sobre una ola|ciclista subiendo montaña|tenista golpeando pelota|rey en su trono|reina con corona|princesa en castillo|ninja en el tejado|arquero de fútbol|bebé gateando|abuela tejiendo|abuelo pescando|niño con barrilete|niña saltando soga|familia de picnic|amigos abrazados|pareja bailando|persona durmiendo|persona estornudando|persona cocinando|persona corriendo|persona leyendo|persona cantando|persona patinando|persona pintando|persona buceando|persona meditando`,
      hard: `mimo invisible|astronauta tomando mate|pirata con parche|mago distraído|científico loco|detective escondido|payaso triste|chef haciendo malabares|futbolista con sombrero|bailarín robot|ninja tomando café|esquiador cayéndose|superhéroe cansado|cartero volador|rey en pijama`
    },
    fantasia: {
      name: 'Fantasía', symbol: '✨', tone: 'lavender',
      easy: `dragón|unicornio|sirena|hada|duende|gnomo|elfo|ogro|gigante|fantasma|vampiro|hombre lobo|zombi|esqueleto|monstruo|robot|alienígena|ovni|varita mágica|escoba voladora|bola de cristal|poción mágica|caldero|libro de hechizos|espada láser|espada medieval|escudo|armadura|casco de vikingo|corona real|trono|tesoro|cofre del tesoro|mapa secreto|portal mágico|puerta encantada|castillo embrujado|calabaza de Halloween|sombrero de bruja|gato negro|murciélago vampiro|huevo de dragón|arco y flecha|escudo mágico|hada madrina|genio de la lámpara|lámpara mágica|alfombra voladora|caballo alado|fénix|pegaso|cíclope|minotauro|tridente|marciano|platillo volador`,
      medium: `dragón escupiendo fuego|unicornio sobre arcoíris|sirena en una roca|hada con varita|duende con monedas|gnomo de jardín|ogro en pantano|gigante entre edificios|fantasma en una ventana|vampiro en castillo|hombre lobo aullando|zombi bailando|esqueleto guitarrista|monstruo bajo la cama|robot enamorado|alienígena en patineta|ovni abduciendo vaca|escoba voladora con bruja|poción que burbujea|caldero con humo|libro flotante|espada clavada en piedra|caballero enfrentando dragón|corona encantada|cofre que habla|portal hacia otra dimensión|duende escondido|huevo de dragón eclosionando|alfombra voladora sobre ciudad|pegaso entre nubes`,
      hard: `dragón bebé estornudando fuego|unicornio con zapatillas|sirena tomando sol|fantasma con anteojos|vampiro en playa|robot tocando piano|alienígena comiendo helado|nave espacial con plantas|bruja en monopatín|esqueleto bailando tango|ogro en bicicleta|hada haciendo yoga|rey convertido en rana|espada de hielo|monstruo jugando ajedrez`
    },
    fiestas: {
      name: 'Fiestas', symbol: '🎉', tone: 'rose',
      easy: `cumpleaños|velas de cumpleaños|torta de cumpleaños|piñata|confeti|guirnalda|serpentina|fiesta sorpresa|disfraz|máscara|carnaval|desfile|fuegos artificiales|Navidad|Papá Noel|reno navideño|trineo navideño|regalo navideño|muñeco de nieve|hombre de jengibre|campana de Navidad|estrella de Navidad|huevo de Pascua|conejo de Pascua|corazón de San Valentín|caja de bombones|ramo de rosas|tarjeta de amor|aniversario|boda|vestido de novia|anillos de boda|ramo de novia|primer beso|abrazo|baile|brindis|copa de champán|globo de corazón|corazón roto|amistad|selfie|fotografía grupal|corazones|fiesta de pijamas|noche de películas|fogón con amigos|picnic|búsqueda del tesoro|karaoke|guerra de almohadas`,
      medium: `vela soplada|abrazo de oso|fiesta en la pileta|piñata explotando|torta con fuegos artificiales|mesa de cumpleaños|boda en la playa|anillos entrelazados|propuesta de matrimonio|brindis bajo estrellas|amigos cantando|fiesta de disfraces|baile de máscaras|foto polaroid|cabina de fotos|cartel de bienvenida|guirnalda de luces|papel picado|caja sorpresa abierta|corazón con candado|mensaje de amor|carta sellada|corona de cumpleaños|cena romántica|desayuno en la cama|pijamada con linternas|amigos alrededor de una fogata|regalo con moño gigante|globo escapando|paquete con sorpresa`,
      hard: `torta que se cae|novios bajo lluvia|cumpleaños en la luna|fiesta de robots|corazón de origami|abrazo de tres personas|fiesta con gatos|globo en forma de perro|regalo dentro de regalo|pastel explosivo|piñata de unicornio|boda submarina|picnic sobre una nube|corazón con alas|carta voladora`
    },
    deportes: {
      name: 'Deportes', symbol: '⚽', tone: 'sky',
      easy: `fútbol|básquet|tenis|vóley|rugby|hockey|golf|béisbol|boxeo|karate|judo|natación|buceo|surf|skate|patinaje artístico|esquí|snowboard|ciclismo|atletismo|maratón|salto en largo|salto en alto|salto con garrocha|lanzamiento de jabalina|arquería|ping pong|bádminton|bolos|bowling|pool|billar|dardos|ajedrez|damas|carrera de autos|carrera de bicicletas|carrera de caballos|carrera de obstáculos|gimnasia rítmica|esgrima|remo|canoísmo|escalada|montañismo|paracaidismo|triatlón|polo|handball|patín|yoga|pilates|baile deportivo|salto de trampolín`,
      medium: `gol de chilena|tiro libre|atajada de arquero|pelota en el ángulo|córner|penal|tarjeta roja|saque de esquina|pelota de básquet entrando al aro|bloqueo en vóley|raqueta rota|trofeo de campeonato|medalla de oro|podio olímpico|línea de llegada|carrera de relevos|vuelta olímpica|guantes de boxeo|cinturón de campeón|tabla de snowboard|salto en paracaídas|escalada en roca|surf en ola gigante|partida de ajedrez|jaque mate|tiro al blanco|carrera con obstáculos|gimnasta en anillas|patinadora girando|esquiador entre árboles`,
      hard: `arquero volando|gol con la cabeza|tenista saltando|basquetbolista clavando pelota|boxeador mareado|ciclista sin manos|esquiador en el aire|surfista bajo una ola|corredor cruzando meta|campeón alzando trofeo|navegante en regata|jugador haciendo pirueta|árbitro sacando roja|entrenador enojado|carrera de caracoles`
    },
    acciones: {
      name: 'Acciones', symbol: '💃', tone: 'gold',
      easy: `saltar|correr|caminar|dormir|reír|llorar|cantar|bailar|comer|beber|cocinar|leer|escribir|pintar|dibujar|nadar|volar|trepar|cavar|barrer|lavar|secar|planchar|tejer|coser|cortar|pegar|abrir puerta|cerrar ventana|aplaudir|silbar|gritar|susurrar|sonreír|abrazar|saludar|despedirse|besar|rebotar|caerse|estornudar|toser|bostezar|meditar|pescar|acampar|remar|escalar|patinar|pedalear|manejar|viajar|comprar|vender|regalar|despertar|esperar|esconderse|buscar|encontrar|imaginar|soñar|correr bajo lluvia|saltar charco|regar plantas`,
      medium: `hacer malabares|armar un rompecabezas|inflar un globo|soplar velitas|abrir un regalo|tocar guitarra|manejar bicicleta|subir escaleras|hacer un castillo de arena|construir una torre|lanzar un frisbee|atrapar una pelota|tirar una caña de pescar|besar a un sapo|mirar por telescopio|contar estrellas|cazar mariposas|caminar sobre la cuerda|saltar la soga|lavar el auto|arreglar un enchufe|hornear galletitas|plantar un árbol|escribir una carta|mandar un mensaje|sacar una selfie|poner la mesa|lavar platos|armar una carpa|hacer una fogata|preparar mate|abrir una sombrilla|leer bajo un árbol|mirar un partido|volar un barrilete|romper una piñata|juntar hojas|hacer un muñeco de nieve|hacer una corona de flores|mirar un atardecer`,
      hard: `tropezar con cordones|bailar bajo la lluvia|correr en cámara lenta|abrazar un cactus|dormir en hamaca|caminar sobre el agua|cocinar sin luz|perseguir una nube|atrapar una estrella|saltar sobre un volcán|dar vuelta una tortilla|pasear un dragón|patinar en pijama|leer de cabeza|dormir en reunión`
    }
  };
  const bank=[];
  for (const [id, category] of Object.entries(categories)) {
    for (const difficulty of ['easy','medium','hard']) {
      const words=category[difficulty].split('|').map(s=>s.trim()).filter(Boolean);
      for (const label of words) bank.push(Object.freeze({id:id + '-' + bank.length, label,category:id,difficulty}));
    }
  }
  window.TRAZO_WORD_BANK=Object.freeze(bank);
  window.TRAZO_CATEGORIES=Object.freeze(Object.fromEntries(Object.entries(categories).map(([id,c])=>[id,Object.freeze({name:c.name,symbol:c.symbol,tone:c.tone})])));
})();


 const words=window.TRAZO_WORD_BANK as Array<{id:string;label:string;category:string;difficulty:string}>;
 const categories=window.TRAZO_CATEGORIES as Record<string,{name:string;symbol:string;tone:string}>;
 if(!Array.isArray(words)||words.length<1000||words.length>2000)throw Error("prompt_bank_invalid");
 return {words,categories};
}
const full=bank();
function headers(origin:string|null){
 const authorized=origin==="https://tehiceesto.com"||origin==="https://www.tehiceesto.com"||origin?.startsWith("http://localhost:")||origin?.endsWith(".vercel.app");
 return {"content-type":"application/json; charset=utf-8","cache-control":"private, no-store","vary":"Origin",
 "access-control-allow-origin":authorized?origin!:"https://tehiceesto.com",
 "access-control-allow-methods":"POST, OPTIONS",
 "access-control-allow-headers":"authorization, apikey, content-type"};
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin"), h=headers(origin);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:h});
 if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers:h});
 if(origin&&!([ "https://tehiceesto.com","https://www.tehiceesto.com"].includes(origin)||origin.startsWith("http://localhost:")||origin.endsWith(".vercel.app")))
   return new Response(JSON.stringify({error:"forbidden_origin"}),{status:403,headers:h});
 const authorization=req.headers.get("authorization")||"";
 if(!authorization.startsWith("Bearer "))return new Response(JSON.stringify({error:"login_required"}),{status:401,headers:h});
 if(!SECRET)return new Response(JSON.stringify({error:"service_unavailable"}),{status:503,headers:h});
 const db=createClient(SUPABASE_URL,SECRET,{auth:{persistSession:false,autoRefreshToken:false}});
 const token=authorization.slice(7).trim();
 const {data:identity,error:authError}=await db.auth.getUser(token);
 const email=identity?.user?.email?.trim().toLowerCase();
 if(authError||!email||!identity?.user?.email_confirmed_at)return new Response(JSON.stringify({error:"login_required"}),{status:401,headers:h});
 const {data:gifts,error:giftError}=await db.from("gifts").select("id").eq("experience_slug","trazo-complice");
 if(giftError)return new Response(JSON.stringify({error:"verification_unavailable"}),{status:503,headers:h});
 const giftIds=(gifts||[]).map(g=>g.id);
 if(!giftIds.length)return new Response(JSON.stringify({error:"purchase_required"}),{status:403,headers:h});
 const {data:orders,error:ordersError}=await db.from("orders").select("id").eq("status","approved").eq("buyer_email",email).in("gift_id",giftIds).limit(1);
 if(ordersError)return new Response(JSON.stringify({error:"verification_unavailable"}),{status:503,headers:h});
 if(!orders?.length)return new Response(JSON.stringify({error:"purchase_required"}),{status:403,headers:h});
 return new Response(JSON.stringify({words:full.words,categories:full.categories,version:"trazo-v1"}),{status:200,headers:h});
});
