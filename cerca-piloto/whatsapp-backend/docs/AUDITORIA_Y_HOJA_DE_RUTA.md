# CERCA — Auditoría técnica y hoja de ruta de piloto
Fecha: 16 de noviembre de 2026. Documento del piloto **sin credenciales de producción**.

## Evidencia observada (solo lectura)
| Recurso | Hallazgo verificado | Decisión |
|---|---|---|
| GitHub `ProtectorRudo/ofi` (`main`) | Flask/Python, `app/webhook.py`, `app/whapi.py`, `app/scheduler.py`. Recepción y envío a través de Whapi.Cloud, no Meta Cloud API; algunas rutas históricas son de un asistente conversacional. | Reutilizar **patrones de integración y programación**, no sus endpoints, secretos, tokens ni su diseño de IA abierta. |
| GitHub `ProtectorRudo/Tehiceesto`, rama `piloto-complices-20261115`, carpeta `complices-piloto` | Next.js y módulos `lib/mission-quality.mjs`, `lib/mission-editorial.mjs`, `lib/ai-profile.mjs`, historial y tests. Cómplices utiliza un proyecto Supabase de TeHiceEsto. | Adaptar criterios editoriales, diversidad, historial y perfiles, sin copiar información ni infraestructura. |
| GitHub `ProtectorRudo/Tehiceesto`, rama `cerca-piloto-20261116`, carpeta `cerca-piloto` | CERCA **anterior** era PWA Next.js con inicio de sesión web y `/api/guide`, que permite consultas libres. | No cumple la nueva definición del producto. No utilizar como interfaz de cliente. |
| Render `cerca-piloto` | Servicio free `srv-dbtpen95efls73clbpvg`, vinculado a la rama anterior. Deploy `live` 16/11/2026 23:53Z. | No confundir un servicio web vivo con el piloto WhatsApp; conservar intacto hasta planear sustitución sin riesgo. |
| Supabase | Acceso de lectura confirmado a proyectos existentes, **sin base CERCA independiente comprobada**. | Crear proyecto nuevo solo tras verificar y autorizar su costo; jamás ejecutar migración en los proyectos previos. |

## Diseño elegido
- Adulto registrado y consentimiento explícito de mensajes, con baja en cualquier momento. Menores: únicamente apodo/nombre, edad, intereses y objetivo; no pedir contactos, fotografías ni datos escolares.
- Cliente: exclusivamente WhatsApp (Meta Cloud API oficial). No autenticación web, formularios web ni portal para las familias. Panel de operación interno no público en una fase posterior.
- Entrada WhatsApp verificada con HMAC del app secret, deduplicación por identificador del mensaje y persistencia transaccional de estado/salidas.
- Controlador determinista de flujo. La IA **nunca recibe** mensajes espontáneos fuera del formulario activo; las respuestas no relacionadas reciben texto fijo, a lo sumo una vez al día. Emergencias: respuesta fija de derivación.
- IA únicamente genera contenidos programados de misiones: un JSON candidato validado; fallback editorial si hay fallo y sin improvisar información.
- Supabase independiente, RLS activada, sin permisos de usuario/anon en tablas, clave `service_role` únicamente en servidor; servicio con instancia única en este piloto.
- Cron protegido y salidas por plantilla aprobada. Tres misiones por hijo, agrupadas en la menor cantidad de mensajes posible, más una semanal para toda la familia.

## Restricciones Meta y costes
- Las respuestas libres de empresa se limitan a una ventana de servicio de 24 horas tras mensaje del usuario; para iniciativas fuera de ventana se requieren plantillas aprobadas.
- Las misiones proactivas pueden clasificarse en categoría **marketing**, no asumir `utility` sin aprobación real. No hay plantillas aprobadas actualmente.
- La referencia de planeamiento Argentina de octubre 2026 es US$0,0618 por marketing entregado; no es una cotización ni garantiza clasificación. Tasas, impuestos, proveedor y cambios de Meta pueden alterar el cálculo.
- Ejemplo de planeamiento (30 días, un mensaje diario por hijo + un familiar por semana): 1 hijo 34 mensajes ≈ US$2,10; 2 hijos 64 mensajes ≈ US$3,96; 3 hijos 94 mensajes ≈ US$5,81, suponiendo todos marketing, sin IVA/fees, respuestas ni IA. Si el mensaje de un hijo supera el límite aprobado de parámetros y debe dividirse, el costo será mayor.
- `CERCA_MONTHLY_CAP_USD` bloquea cola al alcanzar estimación, pero no es garantía del importe facturado por Meta: reconciliar con Analytics/Billing de Meta antes de escalar.

## Producto y modelo comercial
- Competencia: Kinedu (actividades personalizadas mediante app); UNICEF Bebbo y Portal de Crianza WhatsApp gratuitos. CERCA debe diferenciarse por seguimiento longitudinal individual, objetivos reales, pertinencia emocional y baja fricción, **no por información genérica**.
- Hipótesis para testear (no precio validado): abono familiar mensual equivalente a US$9–12; para 2 hijos un costo Meta base ~US$4/mes deja margen antes de IA, hosting, soporte, tributos, reembolsos y pagos, pero es insuficiente para declarar rentabilidad. Testear precio, retención y disposición real a pagar con 10 familias.
- Antes de vender: agregar prueba gratuita limitada, recibos, medios de pago habilitados y manejo de suspensión sin mensajes indebidos. No generar cobros sin autorización.

## Seguimiento de estados y pruebas
- Hecho **en local**: backend Node.js, verificación HMAC, parser, registro, comandos, BAJA, BORRAR, redirección fija, generación editorial por bandas de edad, contrato de IA, validación de misiones, RLS SQL listo, cron y outbox, límites de envíos.
- Hecho **en local**: 11 pruebas automatizadas aprobadas, incluyendo HTTP con proveedores Supabase y Meta simulados (no se envió ningún WhatsApp real).
- No hecho: nuevo repo remoto, DB nueva real y migración, suscripción Meta/número/verificación, aprobación de 2 plantillas, secretos/deploy/cron operativos, pruebas reales con dispositivo, auditoría editorial de familias reales, fuentes verificadas para historias de inspiración, procesamiento comercial de pagos.
- Riesgos: longitud y variabilidad del texto permitido por plantillas, conciliar tarifa por mensaje, cesión de datos a proveedores, latencia/fiabilidad de Render free, recuperación de envíos fallidos, borrado completo de copias y backups.

## Puerta de salida a piloto real (no saltearse)
1. Crear repo independiente `cerca`, nuevo proyecto Supabase tras cotizar el costo y aprobación; ejecutar `sql/001_cerca_isolated.sql` **solo en ese proyecto**.
2. Validar RLS negativamente con otra identidad y ejecutar asesores de seguridad; probar persistencia de fases e idempotencia en BD real.
3. Meta Business: número de pruebas independiente, consentimiento registrado, webhook HTTPS, secreto verificado, token de larga duración gestionado sin exponerlo.
4. Aprobar plantilla diaria y plantilla semanal. Si Meta rechaza el contenido variable, rediseñar plantillas y adaptar `splitDailyForTemplate` antes de publicar.
5. Habilitar variables de entorno **solo del backend CERCA**. Probar grupo pequeño de cuentas de prueba autorizadas y cron una sola instancia, límites de coste estrictos.
6. Test E2E físico: bienvenida > perfiles > tres misiones/hijo > semanal > feedback > actualización > BAJA > borrado. Verificar estados reales de entrega en Meta.
7. Revisión editorial de mínimo 30 lotes por edades, rechazo de repeticiones y solicitud de retroalimentación real sin culpabilizar.

## Fuentes públicas para reevaluar
- https://developers.facebook.com/docs/whatsapp/cloud-api/
- https://whatsappbusiness.com/products/platform-pricing/
- https://whatsappbusiness.com/es-la/policy/
- https://supabase.com/docs/guides/api/securing-your-api
- https://www.unicef.org/lac/crianza/whatsapp