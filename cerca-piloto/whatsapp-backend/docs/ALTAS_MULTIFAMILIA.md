# HUELLA — altas de varias familias por WhatsApp (piloto controlado)

## Separación de responsabilidades

HUELLA se ocupa solamente del registro progresivo, la ficha de cada hijo,
objetivos, intereses, preferencias, IA de misiones y almacenamiento por familia.
Cobros, venta, precios y gestión comercial son responsabilidad del operador.

La IA **no tiene acceso SQL**, no decide identidades ni procesa chat libre:
el servidor valida origen del mensaje, consulta `cerca.families` por el WhatsApp
del adulto y entrega únicamente ese estado a las funciones del flujo y al
contexto mínimo de generación. No usar un historial global compartido ni incluir
fichas de otras familias en el prompt.

## Invitación de un cliente por el operador

1. Mantener desactivada `HUELLA_MULTI_FAMILY_ENABLED` hasta validar pruebas.
2. En Supabase HUELLA, ejecutar únicamente `sql/003_huella_private_invites.sql`
   para crear `cerca.invites` con RLS. No tocar otras tablas ni proyectos.
3. El operador, tras gestionar por su cuenta el acceso del cliente, registra
   un número individual en formato E.164 sin el signo `+`:
   `INSERT INTO cerca.invites(wa_id) VALUES ('549XXXXXXXXXX') ON CONFLICT
   (wa_id) DO UPDATE SET status='invited',approved_at=now();`
   Este comando es **solo privado**, no se envía por WhatsApp ni se ejecuta
   desde respuestas de los usuarios.
4. En el piloto de Whapi, habilitar en Render:
   `HUELLA_MULTI_FAMILY_ENABLED=true` y `HUELLA_MULTI_MAX_FAMILIES=5`
   con una única cuenta operadora en `CERCA_TEST_WA_IDS`. Se limita a cuatro
   invitados adicionales por los límites del Sandbox. El canal debe seguir
   `CERCA_SEND_MODE=test`.
5. El cliente escribe a HUELLA y da consentimiento explícito. Se crea su ficha
   `cerca.families.wa_id` propia. El primer envío programado elegible será
   el día posterior al registro, siempre respetando el calendario semanal fijo.
6. Para suspender un invitado:
   `UPDATE cerca.invites SET status='suspended' WHERE wa_id='549XXXXXXXXXX';`
   La próxima entrada y salida vuelve a comprobar el permiso; no se mezclan
   datos con los demás clientes. La baja y eliminación de datos familiares se
   gestiona por las opciones existentes de WhatsApp.

## Seguridad y limitaciones

- `cerca.invites` está en esquema privado y tiene RLS: el rol
  `cerca_worker` solo puede consultarla; NO puede invitar ni aprobar clientes.
- La tabla `cerca.families` conserva `UNIQUE(wa_id)`, y `cerca.apply_event`
  actualiza y bloquea la fila de ese número dentro de una única transacción.
- Los mensajes salientes se vuelven a autorizar antes de enviarlos.
- No se habilita `production` con este módulo. Tampoco se aceptan chats grupales,
  WhatsApp de desconocidos, datos bancarios ni altas automáticas por una IA.
- La ventana `HUELLA_WHAPI_PILOT_START_DAY` /
  `HUELLA_WHAPI_PILOT_END_DAY` continúa limitando los envíos programados;
  el Sandbox NO es una integración comercial definitiva.
- Las pruebas con varias familias no equivalen a una prueba de extremo a
  extremo con varios teléfonos reales; deben verificarse separadamente antes
  de abrir a clientes.
