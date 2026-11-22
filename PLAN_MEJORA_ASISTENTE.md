# Plan de mejora del asistente de voz — Aula IA Científica

Proyecto: *Asistente de voz con inteligencia artificial para capacitación de personas con discapacidad visual y motriz, Lima, 2026* (TIF Nivel II, UCV).
Carpeta: `C:\Users\user\Documents\Trabajo - TAREAS\aula-ia-cientifica-actualizado\aula-ia-cientifica`
Base: aplicación generada con Manus (React + Vite + TypeScript + tRPC + Express + MySQL/Drizzle).

---

## 1. Decisiones ya tomadas

| Tema | Decisión |
|---|---|
| Acceso de compañeros y participantes | Un **link web**. El programa corre en la PC de escritorio de Bernardo y se publica con un túnel HTTPS (ngrok con dominio fijo gratuito). |
| IA del asistente | **Google Gemini, nivel gratuito**, llamado solo desde el servidor. |
| Identificación | **Código de participante dicho por voz** (ej. "P cero uno"), sin contraseña. |
| Dispositivos | PC/laptop con Chrome o Edge, y celular Android con Chrome. |
| Código fuente | Repositorio **privado en GitHub** (cuenta de Bernardo). |

## 2. Brechas detectadas (resolver o documentar)

1. **Contradicciones en el informe del TIF.** El cuerpo dice: solo discapacidad **visual**, diseño **no experimental transversal** (una sesión, sin pretest/postest), cuestionario de **12 ítems** (facilidad de uso, accesibilidad percibida, satisfacción). El Anexo 1 dice: discapacidad **visual y motriz**, **pretest–postest**, **15 ítems** (usabilidad, afectivo, reconocibilidad). El grupo debe unificar la versión. El programa se hará **configurable** para servir a cualquiera de las dos.
2. **Público del contenido.** La app habla de "estudiantes", "colegio", "grado" y "sección" (secundaria). La población del TIF son **adultos de la Videna (IPD)**. Hay que adaptar los textos y el formulario.
3. **Dependencia de Manus:** IA (`forge.manus.im`), OAuth, almacenamiento y plugins de Vite. Fuera de Manus estas piezas fallan.
4. **No es 100 % sin manos:** hoy hay que presionar Espacio o hacer clic para empezar a escuchar.
5. **Acciones limitadas:** la IA elige de una lista cerrada y busca botones por nombre. No cambia pestañas, no ajusta la configuración y no responde preguntas libres sobre el contenido.
6. **No guarda evidencias para el TIF.** No registra comandos emitidos ni reconocidos, tareas completadas ni tiempos de respuesta, que son justo los indicadores de la ficha de observación. El progreso se guarda en `localStorage`, no en la base de datos.
7. **No arranca en Windows tal como está:** los scripts usan `NODE_ENV=...`, que no funciona en la consola de Windows (requiere `cross-env`).
8. **Privacidad, a declarar en el consentimiento informado:** el reconocimiento de voz de Chrome procesa el audio en servidores de Google, y el nivel gratuito de Gemini puede usar los datos para mejorar sus productos. No se deben enviar nombres ni datos personales a la IA.
9. **Disponibilidad:** el link solo funciona mientras la PC esté encendida, con el programa y el túnel activos.

## 3. Relación con los objetivos del TIF

| Objetivo específico | Qué produce el programa | Fase |
|---|---|---|
| OE1. Identificar requisitos funcionales y de accesibilidad | `docs/REQUISITOS.md`: lista de requisitos trazados a WCAG 2.2, DUA 3.0 e ISO 9241-11 | 0 |
| OE2. Desarrollar el prototipo (consultar información y realizar actividades por voz) | Asistente independiente de Manus, sin manos, con acciones sobre la pantalla | 1, 2, 3 |
| OE3. Evaluar el funcionamiento (reconocimiento, tareas, tiempos) | Registro automático por sesión, exportable a Excel/CSV como ficha de observación | 4 |
| OE4. Determinar la percepción (accesibilidad, facilidad de uso, satisfacción) | Cuestionario Likert leído y respondido por voz, guardado en la base de datos | 4 |
| Objetivo general | Panel docente con resultados por indicador y dimensión | 4, 5 |

## 4. Fases (cada una termina con algo que se puede probar)

| Fase | Qué se hace | Se considera terminada cuando… |
|---|---|---|
| **0. Preparación** | Repositorio GitHub privado, `.env.example`, `cross-env`, la app arranca en Windows, `docs/REQUISITOS.md` | `pnpm dev` abre la app en `localhost` y `pnpm test` pasa |
| **1. Independizar de Manus** | Gemini vía variables (`LLM_API_URL`, `LLM_API_KEY`, `LLM_MODEL`); se quitan los plugins, el OAuth y el almacenamiento de Manus; ingreso con código de participante | La app funciona sin ninguna variable de Manus |
| **2. Uso sin manos** | Escucha automática al abrir (con permiso del micrófono una sola vez), palabra de activación siempre disponible, bienvenida hablada, código dicho por voz, confirmaciones sí/no, tonos de estado | Se completa un recorrido entero sin teclado ni ratón |
| **3. Acciones sobre la pantalla** | "Mapa de pantalla" con los controles visibles enviado a la IA; acciones seguras: pulsar, escribir, marcar, cambiar de pestaña, desplazarse, ajustes (velocidad, letra, contraste); preguntas libres sobre el contenido | Se resuelve un cuestionario, se cambia de pestaña y se ajusta la configuración solo con la voz |
| **4. Evidencias para el TIF** | Registro (sin audio) de comandos, reconocimientos, tareas y tiempos; cuestionario Likert configurable (12 o 15 ítems) por voz; exportación a Excel | El panel docente descarga un Excel con los indicadores por participante |
| **5. Publicar desde la PC** | Build de producción, MySQL local, ngrok con dominio fijo, `iniciar.bat`, guía de uso para compañeros | Otro dispositivo abre el link en Chrome y usa el asistente |
| **6. Verificación** | Pruebas automáticas, revisión WCAG 2.2, prueba piloto con 2 o 3 personas | Lista de verificación completa, sin errores bloqueantes |

## 5. Insumos para el marco teórico

Cada parte del programa corresponde a un concepto que el marco teórico puede definir y citar:

- **Reconocimiento automático del habla (ASR):** Web Speech API, voz → texto.
- **Procesamiento del lenguaje natural y modelos de lenguaje (LLM):** Gemini interpreta la intención.
- **Síntesis de voz (TTS):** respuestas habladas.
- **Interfaces de usuario por voz (VUI)** y **diseño conversacional:** turnos, confirmaciones, palabra de activación.
- **Accesibilidad web:** WCAG 2.2 (perceptible, operable, comprensible, robusto) y ARIA.
- **Diseño Universal para el Aprendizaje (CAST 3.0):** múltiples formas de representación, acción y expresión.
- **Usabilidad:** ISO 9241-11 (eficacia, eficiencia y satisfacción).
- **Calidad del software:** ISO/IEC 25010 (adecuación funcional, eficiencia de desempeño, usabilidad/accesibilidad).
- **Tecnologías de asistencia:** lectores de pantalla y control por voz para discapacidad motriz.

---

## 6. PROMPT PRINCIPAL para Claude Code

Pégalo en Claude Code abierto en la carpeta del proyecto. Luego pide una fase a la vez.

```text
Eres el desarrollador principal de "Aula IA Científica", una app web educativa (React + Vite + TypeScript + tRPC + Express + MySQL/Drizzle) generada con Manus. Es el prototipo del TIF "Asistente de voz con inteligencia artificial para capacitación de personas con discapacidad visual y motriz, Lima, 2026" (UCV). Los participantes son adultos con discapacidad visual o motriz (sin uso de brazos) vinculados a la Videna del IPD.

Lee primero README.md, PLAN_MEJORA_ASISTENTE.md, client/src/components/VoiceAssistant.tsx, client/src/lib/voiceIntents.ts, client/src/hooks/useSpeech.ts y server/routers.ts. Respeta la arquitectura existente: no la reescribas desde cero.

OBJETIVO
Que una persona ciega o sin uso de brazos pueda usar toda la app solo con la voz: ingresar, navegar, leer, consultar, resolver cuestionarios, marcar opciones, cambiar de pestaña o sección y ajustar la configuración, sin teclado ni ratón. Además, la app debe generar las evidencias que el TIF necesita.

CRITERIOS OBLIGATORIOS
1. Sin manos: tras conceder el micrófono una vez, la app escucha sola al abrir, saluda por voz, explica qué se puede decir y nunca exige tecla ni clic. Mantén siempre un modo alternativo de teclado y texto.
2. Acciones sobre la pantalla: el asistente conoce los controles visibles (nombre, rol, estado) y puede pulsarlos, escribir en ellos, marcarlos, abrir pestañas o secciones, desplazarse, leerlos y explicarlos. La IA solo devuelve acciones de una lista cerrada validada en el servidor; jamás ejecuta código arbitrario.
3. Lectura: resumen breve por defecto; "lee todo" para lectura completa; "dónde estoy" y "qué puedo hacer" siempre disponibles. Anuncia los cambios de pantalla y los errores.
4. Seguridad: confirmación "sí/no" antes de enviar, borrar o finalizar; en una evaluación no da respuestas ni pistas; nunca lee ni envía contraseñas; no graba audio.
5. Motriz: comandos cortos y tolerantes a variaciones; navegación por "siguiente/anterior/activar"; tiempos de espera generosos; ninguna acción requiere precisión ni tiempo límite.
6. Español de Perú (es-PE), lenguaje simple, mensajes breves.
7. IA: proveedor configurable por .env (LLM_API_URL, LLM_API_KEY, LLM_MODEL), por defecto Google Gemini con su endpoint compatible con OpenAI. Verifica en la documentación oficial actual qué modelo gratuito usar. Si la IA falla, los comandos locales deterministas siguen funcionando. Nunca envíes nombres ni datos personales a la IA.
8. Evidencias del TIF (sin audio): por participante y sesión, registra comandos emitidos, comandos reconocidos (local o IA), intención, tarea, si se completó, tiempo de respuesta en ms y si necesitó ayuda. El cuestionario Likert debe ser configurable desde un archivo (12 o 15 ítems, dimensiones editables), leído y respondido por voz. Exporta a Excel/CSV desde el panel docente.
9. Debe funcionar en Windows (cross-env), en Chrome y Edge de escritorio y en Chrome de Android, y publicarse desde la PC con un link HTTPS.

FORMA DE TRABAJO
- Trabaja por fases según PLAN_MEJORA_ASISTENTE.md. Antes de cada fase, muestra un plan corto y espera mi "ok".
- Al terminar cada fase: corre pnpm check y pnpm test, agrega pruebas para lo nuevo, actualiza README.md y CHANGELOG.md, haz un commit en git con un mensaje claro y dime en 5 líneas qué cambió y cómo probarlo por voz.
- Si algo del plan no es posible o es riesgoso, dímelo antes de hacerlo y propón una alternativa.
- No borres datos de la base ni archivos sin preguntarme.
```

## 7. Prompts cortos por fase

**Fase 0:** `Ejecuta la Fase 0 del PLAN_MEJORA_ASISTENTE.md: inicializa git y conéctalo a mi repositorio privado de GitHub, crea .env.example sin secretos, agrega cross-env para que los scripts funcionen en Windows y redacta docs/REQUISITOS.md con requisitos funcionales y de accesibilidad trazados a WCAG 2.2, DUA 3.0 e ISO 9241-11.`

**Fase 1:** `Ejecuta la Fase 1: elimina toda dependencia de Manus (plugins de Vite, OAuth, storage, forge.manus.im). Conecta la IA a Gemini mediante LLM_API_URL, LLM_API_KEY y LLM_MODEL, revisa que el json_schema sea compatible con Gemini y reemplaza el inicio de sesión por un código de participante. Cambia los textos de "estudiante/colegio/grado" a "participante" para adultos.`

**Fase 2:** `Ejecuta la Fase 2: haz que la app sea completamente usable sin manos (escucha automática tras el permiso, bienvenida hablada, ingreso del código por voz, confirmaciones sí/no y tonos de estado). Prueba un recorrido completo sin teclado y dime los pasos exactos para repetirlo.`

**Fase 3:** `Ejecuta la Fase 3: crea el "mapa de pantalla" de los controles visibles y las acciones seguras por voz (pulsar, escribir, marcar, cambiar de pestaña, desplazarse, ajustes de velocidad, letra y contraste). Agrega respuestas a preguntas libres sobre el contenido del curso respetando el modo evaluación.`

**Fase 4:** `Ejecuta la Fase 4: registra en la base de datos, sin audio, los indicadores de la ficha de observación (comandos emitidos y reconocidos, tareas completadas, tiempos, ayuda requerida). Haz el cuestionario Likert configurable y respondible por voz, y la exportación a Excel desde el panel docente.`

**Fase 5:** `Ejecuta la Fase 5: prepara la ejecución en producción en mi PC con Windows (MySQL local, build, iniciar.bat) y la publicación con ngrok y dominio fijo. Escribe docs/GUIA_COMPANEROS.md: qué link abrir, que usen Chrome o Edge y cómo permitir el micrófono.`

**Fase 6:** `Ejecuta la Fase 6: corre todas las pruebas, revisa la accesibilidad contra WCAG 2.2 nivel AA y entrégame una lista de verificación para la prueba piloto con 2 o 3 personas.`

## 8. Lo que el grupo debe conseguir

- [ ] Unificar la versión del TIF (visual o visual + motriz, una sesión o pretest–postest, 12 o 15 ítems).
- [ ] Clave gratuita de Gemini en Google AI Studio (aistudio.google.com).
- [ ] Cuenta gratuita de ngrok y su dominio fijo.
- [ ] MySQL Community Server instalado en la PC.
- [ ] Node.js LTS y pnpm instalados en la PC.
- [ ] Lista de las tareas exactas que harán los participantes en la sesión de prueba.
- [ ] Textos del consentimiento informado que mencionen el procesamiento de voz por Google.
