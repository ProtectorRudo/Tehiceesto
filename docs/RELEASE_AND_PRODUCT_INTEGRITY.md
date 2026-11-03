# Política de integridad comercial y publicaciones de TeHiceEsto

**Contrato innegociable:** el comprador recibe el mismo producto que compró; su
versión, estructura, experiencia y enlace permanecen estables. Solo cambian los
datos personalizables definidos por el modelo.

## 1. Compra y producto inmutables
- La orden referencia un `gift_id` y el regalo conserva `experience_slug`,
  `template_version`, `scene_recipe` y `public_code`.
- El trigger `thi_lock_ordered_gift_identity` bloquea cambios de esas cuatro
  propiedades una vez creado un pedido o reservado un complemento que apunta
  al regalo. El modelo base no se sustituye para "actualizar" compras.
- Archivos personales, textos, notas y voces siguen editables. Nunca modificar
  una compra para corregir la demo; reparar únicamente el modelo, mediante
  una versión revisada. Cambios históricos requieren una migración explícita
  con auditoría y aprobación.
- No se alteran estados de Mercado Pago para habilitar ensayos: usar licencias
  de cortesía separadas, revocables y comprobables.

## 2. Enlaces duraderos
- `/r/[code]`: enlace compartido del regalo entregado.
- `/mis-regalos`: cuenta del comprador.
- `/juegos/pack/completo`: acceso autenticado al pack de cuatro juegos.
- `/juegos/trazo-complice/completo`: acceso autenticado al juego independiente.
- `/juegos/pack/pedido`: enlace histórico redirigido a `/mis-regalos`.
- Enlaces históricos individuales `/juegos/entre-dos/completo`,
  `/juegos/complices/completo`, `/juegos/meme-match/completo` redirigen
  al pack autenticado. Redirigir no concede acceso ni elude autorizaciones.
- **Prohibido** eliminar URLs de compras anteriores sin una redirección
  comprobada y tests de autorización.

## 3. Secuencia de publicación
1. Trabajar en rama y ejecutar CI: pruebas de producto/precios, identidad de
   compras, enlaces antiguos, TypeScript y compilación.
2. Seleccionar únicamente el SHA de HEAD actual de `main`. No publicar
   builds viejos ni otro proyecto Vercel. Los identificadores de destino están
   verificados en el workflow; nunca publicar en el proyecto compartido Viralio.
3. Crear release con `--skip-domain`; comprobar SHA insertado en el
   artefacto por `/api/version`, Home, precios, juegos y rutas antiguas.
4. Promover **ese mismo deployment** sin reconstrucción.
5. Volver a comprobar `tehiceesto.vercel.app` y `tehiceesto.com`.
6. Si falla cualquier chequeo, la publicación **no está aprobada**.
   Conservar el deployment anterior para reversión de emergencia; las
   migraciones de datos deben ser compatibles con ambas versiones.
7. Ejecutar regularmente auditoría pública y alertar por versiones desfasadas,
   rutas rotas o publicaciones retiradas que reaparezcan.

## 4. Limitaciones y controles de infraestructura aún necesarios
- La URL `tehiceesto.com` sigue configurada en el proyecto Vercel
  histórico compartido con `viralio.net`, que tiene numerosas rutas.
  **No** eliminar esas rutas, cambiar DNS ni mover el dominio sin una
  migración controlada, inventario de rutas, prueba completa y rollback.
  Planificar una asociación exclusiva con el proyecto nativo TeHiceEsto.
- El workflow de GitHub es de publicación **manual**; debe contar con
  credenciales de Vercel válidas. Si están ausentes, fallará sin publicar.
- Configurar reglas de protección de la rama principal (CI obligatorio y
  revisión antes de merge) y Deployment Checks de Vercel, evitando
  promociones automáticas que eludan el workflow verificado.
- Las pruebas de rutas y SHA **no reemplazan** una compra real de ensayo con
  webhook, entrada al editor, subida de fotos, grabación, compartir y acceso
  de juegos. Mantener ese ensayo como criterio de lanzamiento de campaña.
- Cualquier cambio en la configuración del proyecto o proveedor debe ser
  compatible con rollback y no afectar `viralio.net`.

## 5. Respuesta ante incidentes
- **Producto equivocado:** bloquear inmediatamente actualizaciones de identidad
  y comparar pedido, regalo, versión y código. Nunca sobrescribir contenidos
  de un comprador para que coincidan con otro modelo.
- **Juego 404:** restaurar o redirigir la ruta histórica hacia la entrada
  autenticada del juego sin habilitar contenido gratuito a terceros.
- **Versión antigua:** comparar las dos URLs `/api/version` contra el SHA
  aprobado y el deployment actual; investigar alias, regla legacy y caché.
- **Build fallido o error real de producción:** mantener la versión previa,
  verificar los registros y efectuar rollback del frontend si es seguro
  frente a las migraciones vigentes. No usar una restauración antigua de la
  base que borre compras recientes.
