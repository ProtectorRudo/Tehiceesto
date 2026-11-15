# Conectar Cómplices con OpenAI — piloto privado (noviembre 2026)

## Preparado en el código
- API: **OpenAI Responses API**, desde Next.js en Render; jamás desde el navegador ni el código público.
- Modelo por defecto: \`gpt-6-luna\` (económico, con salida estructurada), verificado en documentación oficial de OpenAI al 15/11/2026.
- Variable privada requerida: \`OPENAI_API_KEY\`. Optativa: \`OPENAI_MODEL\` (solo \`gpt-6-luna\`, \`gpt-5-mini\` o \`gpt-6.1-terra\`).
- \`store:false\` en todas las llamadas. Los mensajes enviados a OpenAI siguen siendo procesados por ese servicio; no confundir \`store:false\` con promesa de eliminación inmediata de todos los registros.
- Límites del piloto: **12 consultas por persona/hora** (incluye modo guiado y generación); **30 llamadas pagas por persona/día** (compartidas por chat y propuestas de misiones, con RPC atómica protegida). Respaldo guiado ante falta de clave, cuota, errores, agotamiento de tokens y filtros de seguridad.
- Token máximo por llamada: chat 500, 2 misiones generadas 650, instrucciones y contextos recortados; sin herramientas externas.
- Conversación individual: solo se envían a OpenAI datos propios autorizados para IA, el mensaje actual y pistas codificadas que la pareja autorizó compartir. Nunca texto libre de pareja, notas privadas de pareja o mensajes del chat compartido.
- \`GET /api/ai-health\`: requiere JWT de usuario integrante; consulta \`GET https://api.openai.com/v1/models/gpt-6-luna\`, sin crear texto ni consumir tokens generativos. Confirma que las credenciales pueden acceder al modelo; **no garantiza saldo positivo ni prueba una generación completa**.
- Botón **Comprobar conexión OpenAI** en la pantalla de Cómplice.

## ÚNICA configuración manual
1. En https://platform.openai.com/ crear/seleccionar un **proyecto de API** propio para Cómplices. ChatGPT Plus no da créditos API.
2. En API Keys crear una **clave secreta de proyecto**. No pegarla en chats, GitHub ni capturas.
3. Revisar facturación en OpenAI Platform y definir presupuesto inicial conservador, por ejemplo **USD 5** con alertas. La facturación se gestiona exclusivamente por el dueño de la cuenta: nunca cargar medios de pago desde el desarrollo. Un presupuesto/alerta del proveedor puede no ser un corte instantáneo; el verdadero límite local son las cuotas de 30/día y 12/h.
4. Abrir Render > servicio \`complices-piloto\` > Environment. Añadir/actualizar \`OPENAI_API_KEY\` con su valor secreto. No anteponer \`NEXT_PUBLIC_\`, no modificar variables de TeHiceEsto comercial ni el servicio \`main\`. Guardar y dejar que Render despliegue.
5. En Cómplices > Cómplice > **Comprobar conexión OpenAI**. Si muestra «Modelo accesible» se validó la clave (no una generación). Pedir una propuesta real en el chat: «Organizame un gesto tranquilo sin gastar dinero para mi pareja». Solo al recibir \`mode:"ia"\` se confirma que el endpoint generativo funcionó.
6. Para probar personalización cruzada, conectar las 2 cuentas, completar mapas de cariño, permitir solo ciertas pistas y comparar una respuesta con permiso activo y otra con permiso revocado. No hace falta compartir secretos.

## Seguridad y límites conocidos
- Los textos personales enviados a OpenAI pertenecen exclusivamente al solicitante y son aquellos que aprobó usar con su IA; las preferencias del otro son códigos compartidos expresamente.
- La validación semántica de ideas generativas usa controles básicos de privacidad y límites; no garantiza perfección. Revisar recomendaciones durante piloto.
- Sin clave válida, o ante error del proveedor, se ofrecen sugerencias guiadas; se informa degradación.
- No hay pruebas de llamadas pagas reales mientras falte la clave. Los tests existentes usan llamadas simuladas y pruebas SQL revertidas.
- Los 30 cupos/día son individuales; 60 para dos cuentas, y solo cuentan llamadas generativas intentadas.
