# Aula IA Científica

Aplicación web educativa que integra un asistente de voz con IA para guiar a estudiantes con
discapacidad visual o motriz (sin uso de brazos) a través de su capacitación, sin que la
discapacidad sea una barrera para usar la app.

## Instalación

```bash
pnpm install
pnpm run db:push   # aplica las migraciones de Drizzle (requiere DATABASE_URL)
pnpm dev           # entorno de desarrollo (tsx watch), http://localhost:3000 por defecto
pnpm run build     # build de producción (client con Vite + server con esbuild)
pnpm start         # sirve el build de dist/
pnpm test          # corre la suite de vitest
pnpm run check     # verificación de tipos (tsc --noEmit)
pnpm format        # prettier --write .
```

## Variables de entorno

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión MySQL usada por Drizzle ORM (`server/db.ts`). |
| `JWT_SECRET` | Firma de cookies de sesión. |
| `VITE_APP_ID`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID` | Integración con el runtime/OAuth de la plataforma. |
| `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` | Credenciales del proveedor de LLM que usa `server/_core/llm.ts` (interpretación de intención por voz y retroalimentación del Tutor IA). Sin esto, el asistente sigue funcionando con los comandos deterministas de `interpretLocalCommand`, pero no con lenguaje libre. |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Credenciales del panel docente (`server/adminAuth.ts`). |

Ninguna clave se expone al navegador: las llamadas al modelo de IA siempre se ejecutan desde el
servidor (`server/_core/llm.ts`), nunca desde el cliente.

## El asistente de voz: cómo usarlo

- Botón flotante **"Hablar con asistente"** (siempre visible) o atajo de teclado
  **Ctrl + Shift + Espacio** (se conserva también `Alt+Shift+V` como atajo heredado).
- Comandos en español natural, no solo frases exactas: "quiero comenzar", "llévame a la pantalla
  inicial", "necesito identificarme" activan la misma intención que "abre identificación".
- **Lectura resumida por defecto**; decir **"lee todo"** da una lectura detallada y jerárquica
  (encabezados, pestañas, menús, diálogos, errores, estados de carga, elemento enfocado y todos
  los controles).
- **Modo simulación** (botón con ícono de matraz en el panel, o decir "modo simulación"): describe
  la intención detectada, la confianza, el elemento objetivo, la acción propuesta y el resultado
  de validación, sin hacer clic, navegar ni modificar datos reales. Pensado para probar el
  intérprete de forma segura.
- **Confirmaciones de seguridad**: antes de enviar un formulario, publicar o ejecutar un control
  marcado como sensible, o cuando la IA tiene baja confianza en su interpretación, el asistente
  pregunta "¿Confirmas...? Di sí o no" en vez de ejecutar directamente.
- Al navegar (por voz o por clic) a una pantalla distinta, el asistente detecta el cambio de ruta
  y anuncia automáticamente el nuevo título y contenido relevante, sin releer todo el DOM.

## Registro de decisiones técnicas

- **Integración directa en la aplicación, no una extensión aparte.** El lector vive dentro de
  `client/src/components/VoiceAssistant.tsx`, `client/src/contexts/AssistantContext.tsx` y
  `client/src/lib/voiceIntents.ts`, reutilizando los nombres y la estructura ya existentes en el
  proyecto (React + Vite + tRPC + wouter) en vez de introducir una arquitectura paralela.
- **Dos capas de interpretación.** `interpretLocalCommand` (determinista, en el cliente) cubre las
  frases más comunes sin depender de la red ni de la IA; si no reconoce el texto, se envía al
  procedimiento tRPC `assistant.interpretIntent`, que usa un modelo de lenguaje del lado del
  servidor con una lista cerrada de intenciones (nunca ejecuta código arbitrario).
- **Confianza como campo de primera clase.** Tanto los comandos locales como la IA devuelven un
  `confidence` (0 a 1). Cuando la interpretación de un control a activar tiene confianza baja
  (<0.55), el asistente pide confirmación en vez de actuar, en vez de asumir que acertó.
- **Segunda barrera de seguridad en modo evaluación.** Independientemente de lo que devuelva el
  modelo, el servidor bloquea explícitamente intenciones explicativas (`EXPLAIN_CONTENT`,
  `SIMPLIFY_EXPLANATION`, etc.) cuando `mode === "evaluation"`, para que una alucinación del
  modelo no filtre respuestas durante una evaluación.
- **Verificación después de ejecutar, no solo antes.** Al activar un control que es un enlace de
  navegación interna, el asistente guarda la ruta actual y, si no detecta un cambio de pantalla en
  ~1.2s, lo informa en vez de dar por hecho que la acción funcionó.
- **Privacidad por diseño.** No se graba ni se almacena audio ni conversaciones. Los campos de
  contraseña nunca se leen, se completan ni se envían al modelo (`setFieldValue` los excluye
  explícitamente y `interpretLocalCommand` usa `DECLINE` ante cualquier mención de credenciales).
  El panel informa que el texto de la orden y el contexto visible de pantalla se envían a un
  servicio de IA para interpretar la intención.

## Limitaciones conocidas

- El reconocimiento y la síntesis de voz dependen de la Web Speech API del navegador (mejor
  soporte en Chrome/Edge de escritorio); en navegadores sin soporte, el asistente ofrece teclado y
  texto escrito como alternativa y lo anuncia explícitamente.
- El indicador sonoro del micrófono usa `AudioContext`; algunos navegadores exigen una interacción
  previa del usuario en la página para permitir audio, por lo que el primer tono puede no sonar
  hasta que el usuario haya interactuado una vez con la página.
- La detección de "cambio de pantalla" para el anuncio automático compara la propiedad `route` que
  cada pantalla publica manualmente; una navegación que solo cambia parámetros de consulta (por
  ejemplo `/dashboard?tab=resultados`) no dispara el anuncio automático porque la ruta base no
  cambia (sí se anuncia el mensaje de confirmación normal de la acción).
- El modo simulación cubre las intenciones que navegan, activan controles o escriben datos; no
  simula acciones de solo lectura (leer, listar controles, ayuda), que siempre se ejecutan porque
  no modifican nada.
- La lista de controles "riesgosos" que piden confirmación se basa en palabras clave
  (`enviar`, `eliminar`, `publicar`, `descargar`, etc.) y en `type="submit"`; un botón de acción
  crítica con una etiqueta que no incluya ninguna de esas palabras no activará la confirmación
  automáticamente y debería etiquetarse explícitamente con `data-ai-action`.
- La interpretación por IA requiere `BUILT_IN_FORGE_API_URL`/`BUILT_IN_FORGE_API_KEY` configuradas
  en el servidor; sin ellas, solo funcionan los comandos deterministas de
  `interpretLocalCommand`.
