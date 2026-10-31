import type {MetadataRoute} from "next";

export default function robots():MetadataRoute.Robots{
  return {
    rules:[{
      userAgent:"*",
      allow:"/",
      disallow:[
        "/api/",
        "/admin/",
        "/mis-regalos",
        "/r/",
        "/escape-r/",
        "/comprar/",
        "/juegos/pack/completo",
        "/juegos/pack/pedido",
        "/experiencias/sticker-bomb-amistad/editar",
      ],
    }],
    sitemap:"https://tehiceesto.com/sitemap.xml",
    host:"https://tehiceesto.com",
  };
}
