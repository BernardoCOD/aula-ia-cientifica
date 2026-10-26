# Documentación técnica — Aula IA Científica

**Proyecto:** Asistente de voz con inteligencia artificial para capacitación de personas con discapacidad
visual y motriz, Lima, 2026 (TIF Nivel II, UCV).
**Para qué sirve este documento:** reúne las herramientas, la arquitectura, el código clave y las decisiones
técnicas del prototipo, listos para usarlos en la **metodología** y el **marco teórico** del informe.
Se actualiza al cerrar cada fase (ver la sección 11, "Bitácora por fase").

---

## 1. Resumen

Aula IA Científica es una **aplicación web** de capacitación sobre inteligencia artificial que se puede usar
completa **con la voz**. Su asistente, **Jason**, escucha órdenes en español, entiende la intención con un
**modelo de lenguaje** (Google Gemini), actúa sobre la pantalla (navegar, leer, pulsar, escribir, marcar
alternativas) y responde en voz alta. Está pensada para personas que no ven la pantalla o que no pueden usar
el teclado ni el ratón.

## 2. Enfoque de desarrollo (para la metodología)

| Aspecto | Cómo se trabajó |
|---|---|
| Tipo de desarrollo | **Prototipado evolutivo e incremental por fases**: cada fase agrega una capacidad que se puede probar (ver `PLAN_MEJORA_ASISTENTE.md`) |
| Punto de partida | Plantilla generada con **Manus** (generador de aplicaciones con IA): React + Express + tRPC + Drizzle |
| Asistencia en la programación | **Claude Code** (asistente de programación con IA de Anthropic): analizó el código, propuso cada fase, escribió el código y las pruebas, y documentó los cambios. El grupo revisó y aprobó cada fase antes de continuar |
| Control de versiones | **Git** con repositorio privado en **GitHub**; un *commit* descriptivo por cada cambio |
| Verificación | Pruebas automáticas con **Vitest** y verificación de tipos con **TypeScript** al cerrar cada fase; prueba piloto con 2 o 3 personas en la Fase 6 |
| Requisitos | Identificados y trazados a WCAG 2.2, DUA 3.0 e ISO 9241-11 en `docs/REQUISITOS.md` (OE1) |

**Fases del plan:**

0. Preparación (repositorio, arranque en Windows, requisitos, documentación).
1. Independizar de Manus y adaptar a participantes adultos.
2. Uso sin manos.
3. Acciones sobre la pantalla.
4. Evidencias para el TIF.
5. Publicar desde la PC.
6. Verificación.

## 3. Arquitectura

```
┌──────────────────────────── NAVEGADOR (Chrome / Edge) ────────────────────────────┐
│                                                                                    │
│  Micrófono ──► Reconocimiento de voz (ASR, Web Speech API) ──► texto de la orden    │
│                                                                    │               │
│                    ┌───────────────────────────────────────────────┤               │
│                    ▼                                               ▼               │
│     Comandos locales deterministas                   "Fotografía" de la pantalla    │
│     (voiceIntents.ts, sin IA ni red)                 (pageSnapshot.ts: controles,   │
│                    │                                  textos, tablas, estado)       │
│                    │                                               │               │
│                    │                      tRPC / HTTPS             ▼               │
│                    │              ┌──────────────────────────────────────┐         │
│                    │              │        SERVIDOR (Node + Express)      │         │
│                    │              │  Agente (assistantAgent.ts)           │         │
│                    │              │   ├─ prompt con reglas + contenido    │◄──► Google Gemini API
│                    │              │   ├─ salida JSON con esquema          │         (modelo de lenguaje)
│                    │              │   └─ barreras de seguridad            │         │
│                    │              │  Área de consultas ◄──► Wikipedia API │         │
│                    │              │  Base de datos SQLite (Drizzle ORM)   │         │
│                    │              └──────────────────────────────────────┘         │
│                    ▼                                               │               │
│     Ejecutor de acciones (pageActions.ts): navegar, pulsar, escribir, marcar…       │
│                    │                                                               │
│                    ▼                                                               │
│  Síntesis de voz (TTS, Web Speech API) ──► parlantes                                │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Flujo de una orden de voz

1. La app escucha la palabra de activación ("Oye Jason") sin que nadie toque la pantalla.
2. El **reconocimiento de voz** del navegador convierte la orden en texto (español de Perú, `es-PE`).
3. Si es una orden directa e inequívoca ("abre el módulo dos", "para", "opción B"), se resuelve **en el
   navegador**, al instante y sin IA.
4. Si no, el navegador toma una **fotografía accesible de la pantalla**: títulos, texto visible y cada
   control con un id, su nombre, valor y estado. Las contraseñas no se incluyen.
5. El servidor envía la orden, la fotografía y el progreso del participante al **modelo de lenguaje**. El
   modelo responde con un **JSON** que debe cumplir un esquema: qué decir, qué acciones ejecutar y si
   necesita confirmación.
6. El servidor **valida** la respuesta antes de devolverla:
   - descarta acciones sobre controles o rutas que no existen;
   - en evaluación, bloquea las respuestas que la persona no dictó.
7. El navegador **ejecuta** las acciones y **verifica** qué pasó realmente. Si la acción envía, borra o
   finaliza algo, antes pide "sí / no".
8. La **síntesis de voz** lee la respuesta. Mientras habla, no escucha, para no oírse a sí misma.

## 4. Herramientas y tecnologías

Versiones instaladas en el proyecto (archivo `pnpm-lock.yaml`), verificadas en la Fase 0.

### 4.1 Lenguajes y entorno

| Herramienta | Versión | Qué es | Uso en el proyecto |
|---|---|---|---|
| TypeScript | 5.9.3 | JavaScript con tipos estáticos | Todo el código (navegador y servidor); detecta errores antes de ejecutar |
| Node.js | 20 o superior (probado con 22) | Entorno para ejecutar JavaScript en el servidor | Ejecuta el servidor |
| pnpm | 10.4.1 | Gestor de paquetes | Instala las dependencias de forma reproducible |
| cross-env | 10.1.0 | Utilidad de línea de comandos | Hace que los scripts funcionen igual en Windows, Linux y Mac |
| tsx | 4.20.6 | Ejecutor de TypeScript | Ejecuta el servidor en modo desarrollo |

### 4.2 Interfaz (navegador)

| Herramienta | Versión | Qué es | Uso en el proyecto |
|---|---|---|---|
| React | 19.2.1 | Biblioteca para interfaces de usuario | Pantallas de la aplicación |
| Vite | 7.1.9 | Servidor de desarrollo y empaquetador | Compila la interfaz |
| Tailwind CSS | 4.1.14 | Estilos con clases utilitarias | Diseño, tamaños de letra y contraste |
| Radix UI (vía shadcn/ui) | varias | Componentes accesibles (ARIA) | Pestañas, diálogos, listas, casillas con roles y estados accesibles |
| wouter | 3.7.1 | Enrutador ligero | Navegación entre pantallas |
| **Web Speech API** (SpeechRecognition y SpeechSynthesis) | estándar del navegador | Interfaz del navegador para reconocer y sintetizar voz | **ASR** (voz a texto) y **TTS** (texto a voz) del asistente |

### 4.3 Servidor y datos

| Herramienta | Versión | Qué es | Uso en el proyecto |
|---|---|---|---|
| Express | 4.21.2 | Servidor web para Node.js | Sirve la aplicación y la API |
| tRPC | 11.6.0 | API con tipos compartidos entre navegador y servidor | Comunicación navegador ↔ servidor |
| Zod | 4.1.12 | Validación de datos | Valida todo lo que llega al servidor (órdenes, fotografía de pantalla, formularios) |
| **SQLite** (vía libSQL) | cliente 0.18.0 | Base de datos relacional en un solo archivo | Participantes, progreso, evaluaciones, actividades, consultas (en la PC) |
| **Turso** (plan gratuito) | servicio en la nube | Base de datos libSQL (compatible con SQLite) alojada en la nube | La misma base de datos cuando la app está publicada en internet |
| **Render** (plan gratuito) | servicio en la nube | Plataforma de alojamiento de aplicaciones web | Publica la app con un link HTTPS para compañeros, docentes y participantes |
| Drizzle ORM | 0.44.6 | Capa para consultar la base de datos con tipos | Definición de tablas y consultas |
| Node.js `crypto` (HMAC-SHA256) | incluido en Node.js | Firma criptográfica | Cookie de sesión firmada del panel docente (`server/adminAuth.ts`) |

### 4.4 Inteligencia artificial y fuentes externas

| Herramienta | Versión | Qué es | Uso en el proyecto |
|---|---|---|---|
| **Google Gemini API** (plan gratuito) | SDK `@google/genai` 2.24.0 | API de modelos de lenguaje de Google | Interpreta las órdenes, responde preguntas, Tutor IA y análisis docente |
| Modelos usados | `gemma-4-26b-a4b-it` (principal) y Gemini Flash (respaldo) | Modelos de lenguaje | Si uno está saturado o sin cupo, se prueba el siguiente |
| API de Wikipedia en español | pública, sin clave | Enciclopedia en línea | Fuentes del Área de consultas |
| Anthropic Claude API (opcional, de pago) | SDK `@anthropic-ai/sdk` 0.128.0 | API de modelos de lenguaje de Anthropic | Alternativa configurable a Gemini (no se usa por defecto) |

### 4.5 Calidad y desarrollo

| Herramienta | Versión | Uso |
|---|---|---|
| Vitest | 2.1.9 | Pruebas automáticas (`pnpm test`) |
| Prettier | — | Formato uniforme del código |
| Git y GitHub | — | Control de versiones y respaldo del código |
| Claude Code | — | Asistente de programación con IA usado durante el desarrollo |
| Manus | — | Generó la plantilla inicial del proyecto; sus dependencias se retiraron en la Fase 1 |

## 5. Componentes del código (fragmentos clave)

### 5.1 Reconocimiento automático del habla (ASR) — `client/src/hooks/useSpeech.ts`

```ts
const recognition = new RecognitionClass();   // SpeechRecognition de la Web Speech API
recognition.lang = RECOGNITION_LANG;          // "es-PE": español de Perú
recognition.continuous = continuous;
recognition.interimResults = true;            // muestra lo que va entendiendo
recognition.onresult = event => {
  // ... cuando el resultado es final, se entrega el texto de la orden
  if (result.isFinal) onResult(text.trim());
};
```

**Qué hace:** usa el reconocedor de voz del navegador para convertir la voz en texto en español de Perú.
No graba ni guarda audio: el navegador entrega solo el texto.

### 5.2 Síntesis de voz (TTS) y semidúplex — `client/src/hooks/useSpeech.ts`

```ts
const speak = (text, onDone) => {
  stopListening();                      // semidúplex: nunca escucha mientras habla
  const chunks = splitIntoChunks(text); // lecturas largas divididas en frases
  // ... cada frase se lee con SpeechSynthesisUtterance, con una voz en español
  //     latinoamericano y la velocidad elegida por la persona
};
```

**Qué hace:** lee las respuestas en voz alta. Divide los textos largos en frases para poder detenerlos con
"para". Elige primero una voz `es-PE` o latinoamericana.

### 5.3 Palabra de activación — `client/src/lib/voiceIntents.ts`

```ts
export const WAKE_PATTERN =
  /\b(?:ok|okey|okay|oye|hey|hola)\s+(?:jason|yeison|jeison|jaison|geison|aula)\b\s*(.*)$/;
```

**Qué hace:** reconoce "Oye Jason" u "Ok Jason", incluidas las formas en que el reconocedor suele escribir
"Jason" ("yeison", "jeison"…). Así el asistente se activa sin tocar la pantalla.

### 5.4 Comandos locales deterministas — `client/src/lib/voiceIntents.ts`

```ts
export function interpretLocalCommand(text, options) {
  const value = normalizeSpeech(text);   // minúsculas, sin tildes ni signos
  if (/\b(contrasena|password|mi clave|token)\b/.test(value))
    return { kind: "decline", message: "Por tu seguridad no leo, escribo ni envío contraseñas..." };
  if (/^(?:para|pausa|silencio|detente|basta)$/.test(value)) return { kind: "pause" };
  // ... navegación ("abre el módulo dos"), lectura ("lee todo"),
  //     evaluación ("opción B", "siguiente pregunta"), velocidad, tamaño de letra
  return null;   // si no es inequívoca, la orden pasa al agente de IA
}
```

**Qué hace:** resuelve al instante y sin internet las órdenes más comunes. Si la IA no está disponible, la
aplicación sigue siendo usable con estas órdenes.

### 5.5 "Fotografía" accesible de la pantalla — `client/src/lib/pageSnapshot.ts`

```ts
const INTERACTIVE_SELECTOR = [
  "a[href]", "button", "input:not([type='hidden'])", "select", "textarea",
  "[role='button']", "[role='tab']", "[role='checkbox']", "[role='radio']", "[role='option']", ...
].join(",");
```

**Qué hace:** recorre la pantalla y arma una descripción para la IA. Incluye cada control interactivo con
un id (`e1`, `e2`…), su nombre accesible (el mismo que usaría un lector de pantalla), su valor y su estado.
Agrega también los títulos, el texto visible, las tablas, los diálogos y las alertas. Gracias a esto, el
asistente funciona en cualquier pantalla, también en las que se agreguen después, sin programar cada
comando.

### 5.6 Agente de IA con salida estructurada — `server/assistantAgent.ts`

```ts
const REPLY_SCHEMA = {
  type: "object",
  properties: {
    speech:   { type: "string" },                  // qué decir en voz alta
    actions:  { type: "array", items: {            // qué hacer en la pantalla
      properties: { type: { enum: [...AGENT_ACTION_TYPES] }, target: {...}, value: {...} } } },
    confirm:  { type: "string" },                  // pregunta sí/no antes de enviar o borrar
    continue: { type: "boolean" },                 // si necesita ver la pantalla nueva para seguir
  },
};
const reply = await askJson({ system: AGENT_SYSTEM_PROMPT, messages, schema: REPLY_SCHEMA });
return sanitizeReply(reply, input);
```

**Qué hace:**

- **Instrucciones (prompt):** el modelo recibe su rol, las reglas de seguridad, el mapa de la aplicación
  y el contenido de los seis módulos.
- **Salida estructurada:** el modelo solo puede elegir acciones de una **lista cerrada** (`navigate`,
  `click`, `fill`, `select`, `scroll`, `focus`, `back`, `read_page`, `text_size`, `speech_rate`,
  `consult`, `stop_assistant`).
- **Sin código arbitrario:** nunca se ejecuta código que venga de la IA.

### 5.7 Barreras de seguridad en el servidor — `server/assistantAgent.ts`

```ts
export function sanitizeReply(reply, input) {
  for (const action of reply.actions.slice(0, 8)) {
    if (["click", "fill", "select", "focus"].includes(action.type) && !ids.has(action.target))
      continue;                                   // control inexistente: se descarta
    if (action.type === "navigate" && !validRoute(action.target)) continue;
    if (isEvaluation) {
      if (action.type === "fill") { blockedAnswer = true; continue; }
      if (kindById.get(action.target) === "radio" && !userDictatedOption) {
        blockedAnswer = true; continue;           // no marca alternativas no dictadas
      }
    }
    actions.push(action);
  }
  ...
}
```

**Qué hace:** garantiza las reglas aunque el modelo se equivoque. En evaluación (pretest y postest) el
asistente solo puede marcar la alternativa que **la persona dictó**. Esto protege la validez del instrumento.

### 5.8 Proveedor de IA con tolerancia a fallos — `server/_core/gemini.ts` y `server/_core/ai.ts`

```ts
const DEFAULT_MODELS = ["gemma-4-26b-a4b-it", "gemini-3.6-flash", "gemini-flash-latest", ...];
async function generateWithFallback(build) {
  for (const model of attempts) {
    try { return await getGemini().models.generateContent(build(model)); }
    catch (error) { if (!shouldTryNextModel(error)) throw error; }  // 429, 503, tiempo agotado…
  }
}
```

**Qué hace:**

- Llama a la API gratuita de Gemini desde el **servidor**, así la clave nunca llega al navegador.
- Si un modelo está saturado o sin cupo, prueba el siguiente.
- `ai.ts` es una capa común: permite cambiar a Claude (de pago) solo con el archivo `.env`, sin tocar el
  resto del código.

### 5.9 Área de consultas: generación aumentada con recuperación (RAG) — `server/_core/gemini.ts`

**Qué hace:**

1. El modelo propone términos de búsqueda.
2. Se consultan artículos de **Wikipedia en español**.
3. El modelo redacta la respuesta **usando solo esos textos**, que se muestran como fuentes.

Esto reduce las respuestas inventadas y enseña a verificar fuentes, que es uno de los temas de la
capacitación.

### 5.10 Base de datos — `drizzle/schema.ts` y `server/db.ts`

**Tablas:**

| Tabla | Qué guarda |
|---|---|
| `students` | Participantes |
| `module_progress` | Avance por módulo |
| `evaluations` | Pretest, postest y evaluaciones por módulo |
| `activities` | Actividades realizadas |
| `challenges` | Retos realizados |
| `ai_interactions` | Uso del Tutor IA |
| `consultations` | Preguntas del Área de consultas |

Las tablas se crean solas al iniciar (`CREATE TABLE IF NOT EXISTS`), sin pasos manuales. La base es un solo
archivo: `data/aula.db`.

En el código, la tabla de participantes conserva el nombre `students` de la versión escolar, y sus columnas
`grade`, `section` y `schoolName` quedan vacías para los participantes nuevos. Así los registros anteriores
siguen funcionando sin migraciones. La tabla `users` de Manus ya no se usa: en las bases antiguas queda sin
cambios.

### 5.11 Código de participante dicho por voz — `shared/participant.ts`

```ts
export function normalizeParticipantCode(input: string): string {
  // "Mi código es pe cero uno" → quita el relleno → ["pe", "cero", "uno"]
  const code = words
    .map(word => SPOKEN_NUMBERS[word] ?? SPOKEN_LETTERS[word] ?? word.toUpperCase())
    .join("");                                      // → "P01"
  return PARTICIPANT_CODE_PATTERN.test(code) ? code : "";
}
```

**Qué hace:** cada participante crea su código y lo puede **dictar**. El reconocedor de voz suele escribir
las letras como se pronuncian ("pe", "ese", "ele") y los números con palabras ("cero uno"). Esta función los
convierte en un código compacto (`P01`), igual en el navegador y en el servidor. La pantalla muestra cómo
quedará antes de guardar. Si el código ya existe, el sistema reconoce a quien vuelve y continúa su avance.
No se piden nombres ni datos personales.

## 6. Relación con el marco teórico

| Concepto | Definición breve | Dónde está en el prototipo |
|---|---|---|
| Reconocimiento automático del habla (ASR) | Conversión de la voz en texto | Web Speech API, `useSpeech.ts` (5.1) |
| Síntesis de voz (TTS) | Conversión de texto en voz | Web Speech API, `useSpeech.ts` (5.2) |
| Procesamiento del lenguaje natural (PLN) y modelos de lenguaje (LLM) | Modelos que interpretan y generan lenguaje humano | Gemini interpreta la intención de cada orden (5.6) |
| Salidas estructuradas / uso de herramientas por agentes | El modelo responde con un formato fijo (JSON) y elige acciones de una lista | Esquema de respuesta del agente (5.6) |
| Generación aumentada con recuperación (RAG) | El modelo responde apoyándose en documentos recuperados | Área de consultas con Wikipedia (5.9) |
| Interfaz de usuario por voz (VUI) y diseño conversacional | Diseño de la interacción hablada: turnos, confirmaciones, palabra de activación, manejo de errores | Activación "Oye Jason", confirmación sí/no, semidúplex, mensajes breves |
| Accesibilidad web (WCAG 2.2, ARIA) | Pautas para que el contenido sea perceptible, operable, comprensible y robusto | Nombres accesibles y roles ARIA usados por la fotografía de pantalla (5.5); requisitos en `docs/REQUISITOS.md` |
| Diseño Universal para el Aprendizaje (DUA 3.0) | Múltiples formas de representación, acción y expresión, y compromiso | Contenido leído en voz, por texto o en pantalla; respuesta por voz, teclado o ratón |
| Usabilidad (ISO 9241-11) | Eficacia, eficiencia y satisfacción en un contexto de uso | Indicadores del registro de evidencias (Fase 4) y cuestionario Likert |
| Calidad del software (ISO/IEC 25010) | Modelo de calidad del producto | Requisitos no funcionales y pruebas automáticas |
| Tecnologías de asistencia | Herramientas que compensan una discapacidad (lectores de pantalla, control por voz) | El asistente cumple ambos roles: lee la pantalla y la controla con la voz |

**Referencias sugeridas** (verificar y dar formato APA 7 en el informe):

- World Wide Web Consortium. (2023). *Web Content Accessibility Guidelines (WCAG) 2.2*. W3C Recommendation.
- CAST. (2024). *Universal Design for Learning Guidelines version 3.0*. https://udlguidelines.cast.org
- International Organization for Standardization. (2018). *ISO 9241-11:2018 Ergonomics of human-system
  interaction — Part 11: Usability: Definitions and concepts*.
- International Organization for Standardization. (2023). *ISO/IEC 25010:2023 Systems and software
  engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Product quality model*.
- Jurafsky, D., & Martin, J. H. *Speech and Language Processing* (3.ª ed., borrador en línea). Stanford
  University.
- Lewis, P., et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. *Advances in
  Neural Information Processing Systems, 33*.
- Pearl, C. (2016). *Designing Voice User Interfaces*. O'Reilly Media.
- Congreso de la República del Perú. (2011). *Ley N.º 29733, Ley de Protección de Datos Personales*.
- Google. *Gemini API documentation*. https://ai.google.dev
- W3C Web Incubator Community Group. *Web Speech API* (especificación).

## 7. Decisiones técnicas y su justificación

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| **SQLite** como base de datos | MySQL | Un solo archivo, sin instalar ni administrar un servidor, copia de seguridad copiando el archivo. Es suficiente para el número de participantes de un piloto |
| **Google Gemini, plan gratuito** | Claude u otra API de pago | Sin costo y sin tarjeta para el piloto. La capa común (`ai.ts`) permite cambiar a una API de pago después |
| **Web Speech API** del navegador para voz | Whisper u otro reconocedor propio | No requiere servidor de reconocimiento ni costo, y funciona en Chrome y Edge, incluido Android |
| **Publicación en la nube (Render + Turso)** | Servir la app desde la PC con un túnel (ngrok) | El link funciona aunque la PC esté apagada. Además se evita la página de aviso de ngrok gratuito, que es una barrera para personas ciegas. El código de la base de datos es el mismo: solo cambia `DATABASE_URL` |
| **Comandos locales + agente de IA** | Solo IA | Las órdenes comunes responden al instante y la app sigue funcionando si la IA falla |
| **Validación en el servidor** | Confiar solo en el prompt | Las reglas críticas (modo evaluación, controles existentes) se cumplen aunque el modelo se equivoque |
| **Fotografía genérica de la pantalla** | Comandos programados uno por uno | El asistente funciona en pantallas nuevas sin programar cada comando |

## 8. Privacidad y ética (para el consentimiento informado)

- **No se graba audio.** Solo se procesa el texto reconocido.
- **Dónde se procesa la voz:**
  - en **Chrome**, el reconocimiento de voz se hace en servidores de **Google**;
  - en **Edge**, en servidores de **Microsoft**.
- **El plan gratuito de Gemini** puede usar el contenido enviado para mejorar los productos de Google. Por eso
  no se envían contraseñas ni nombres, y hay que informarlo en el consentimiento.
- Los campos de contraseña nunca se leen, se escriben ni se envían a la IA.
- Las claves de la IA están solo en el servidor (archivo `.env`, que no se sube a GitHub).
- **Solo el código y el avance llegan a la IA** (desde la Fase 1). Ni siquiera los datos escolares de
  registros antiguos se envían; una prueba automática lo verifica.
- El ingreso no pide nombres, correos, edad ni otros datos personales: solo un código que la persona crea.

## 9. Pruebas automáticas

Se ejecutan con `pnpm test`. Estado actual: **11 archivos, 42 pruebas, todas aprobadas**.

| Archivo | Qué verifica |
|---|---|
| `server/voice.commands.test.ts` | Comandos locales: navegación, lectura, evaluación, activación, privacidad |
| `server/voice.assistant.test.ts` | Seguridad del agente: acciones inválidas descartadas, modo evaluación, privacidad (a la IA no llegan datos escolares) |
| `server/gemini.provider.test.ts` | Proveedor Gemini: salida JSON con esquema, cambio de modelo al agotarse el cupo (429), búsqueda en Wikipedia |
| `server/assessment.bank.test.ts` | Bancos de preguntas del pretest y postest |
| `server/version2.validation.test.ts` | Formato de los datos de evaluación |
| `server/student.validation.test.ts` | Ingreso del participante: código dictado, participante que vuelve, códigos inválidos |
| `server/participant.code.test.ts` | Conversión del código dictado ("pe cero uno" → P01) |
| `server/no.manus.test.ts` | Independencia de Manus: no quedan referencias en el código |
| `server/database.config.test.ts` | Base de datos local (SQLite) o en la nube (Turso) según `DATABASE_URL` |
| `server/admin.credentials.test.ts`, `server/admin.students.test.ts` | Acceso al panel docente (incluido el aviso si no está configurado) y gestión de participantes |

## 10. Cómo ejecutar el proyecto

```bash
npx pnpm@10.4.1 install      # instala dependencias
copy .env.example .env       # Windows (Mac/Linux: cp .env.example .env) y completar GEMINI_API_KEY
npx pnpm@10.4.1 dev          # http://localhost:3000
npx pnpm@10.4.1 test         # pruebas automáticas
npx pnpm@10.4.1 check        # verificación de tipos
```

En Windows también se puede usar `Iniciar Aula IA.bat` (doble clic): instala lo necesario, inicia el servidor
y abre Chrome listo para usar con la voz.

## 11. Bitácora por fase

### Fase 0 — Preparación

**Objetivo:** dejar el repositorio, el arranque y los requisitos listos para las fases siguientes.

**Base elegida:**

- Se compararon dos versiones: `main` (con avances previos) y `version-plan` (el export original de Manus
  más pequeños ajustes).
- Se eligió `main` porque ya cumplía parte del plan: SQLite, Gemini, arranque en Windows con `cross-env`
  y activación por voz.
- De `version-plan` se trajeron el plan de mejora y los atajos de voz que faltaban.

**Cambios:**

- `PLAN_MEJORA_ASISTENTE.md` agregado al repositorio.
- Atajos de voz:
  - "quiero empezar" y "comenzar la capacitación" llevan a la ruta de aprendizaje;
  - "pantalla inicial" lleva al inicio;
  - son 2 pruebas nuevas.
- `Iniciar Aula IA.bat` pedía la clave de Claude; ahora pide la clave gratuita de Gemini.
- Documentos nuevos: `docs/REQUISITOS.md` (19 RF y 13 RNF, con su estado actual), este documento y
  `CHANGELOG.md`.

**Verificación:**

- `pnpm check` sin errores.
- `pnpm test`: 31 de 31 pruebas aprobadas.
- `pnpm dev` responde en `http://localhost:3000`.

**Pendiente del grupo:** unificar la versión del TIF (solo visual o visual + motriz; 12 o 15 ítems).

### Fase 1 — Independizar de Manus y adaptar a participantes adultos

**Objetivo:** que la app funcione sin ninguna pieza de Manus y que esté pensada para personas adultas de la
Videna (IPD), sin datos personales.

**Cambios:**

- **Se retiró Manus:**
  - el inicio de sesión OAuth y su cookie;
  - el almacenamiento de archivos (AWS S3 por medio de Manus);
  - el cliente de `forge.manus.im`;
  - mapas, generación de imágenes, transcripción y notificaciones;
  - el plugin de Vite de la plantilla y las dependencias sin uso (`@aws-sdk/*`, `axios`, `jose`,
    `streamdown`, `add`).

  Se eliminaron 29 archivos. El panel docente sigue con su propia cookie firmada (HMAC-SHA256).
- **Ingreso con código de participante:**
  - la persona crea su código (por ejemplo `P01`) y puede dictarlo;
  - lo dictado se normaliza ("pe cero uno" → `P01`);
  - quien vuelve con el mismo código continúa su avance.
- **Privacidad:** a la IA solo llegan el código y el avance.
- **Textos para adultos:** se adaptaron la portada, el panel del participante, el panel docente (búsqueda
  por código en lugar de filtros por colegio y grado, exportación CSV sin datos escolares) y las
  instrucciones de la IA (agente, Tutor IA, análisis docente y Área de consultas).
- **No se modificaron** las preguntas del pretest y postest (`client/src/lib/assessment.ts`): son el
  instrumento de la investigación y cualquier cambio lo decide el grupo.

**Verificación:**

- `pnpm check` sin errores.
- `pnpm test`: 38 de 38 pruebas aprobadas.
- `pnpm build` compila y el servidor de producción responde sin variables de Manus.
- **Prueba en navegador (Chromium):**
  - "pe cero uno" se guarda como `P01` y lleva al diagnóstico;
  - la ficha no muestra grado ni colegio;
  - al volver con `P01` se reconoce al participante;
  - no hay errores en la consola.

### Publicación en la nube (Fase 5, adelantada)

**Motivo:** el grupo necesita un link que compañeros, docentes y participantes abran desde sus dispositivos,
sin depender de que la PC del autor esté encendida. Por eso se cambió la decisión del plan (túnel desde la PC
con ngrok) por la publicación en la nube.

**Cambios:**

- **Base de datos:** acepta una base **Turso** (`DATABASE_URL=libsql://…` y `DATABASE_AUTH_TOKEN`), además del
  archivo SQLite local. El resto del código no cambió, porque Turso usa libSQL, compatible con SQLite.
- **`render.yaml`:** configuración de Render como *Blueprint*:
  - compila con pnpm, inicia en modo producción y usa la región Virginia;
  - pide las claves al crear el servicio, sin guardarlas en GitHub;
  - genera `JWT_SECRET` de forma aleatoria.
- **Panel docente:** avisos claros si falta la contraseña. Al iniciar, el servidor indica qué base de datos
  usa y cuántos caracteres tiene la contraseña leída, sin mostrarla.
- **Guía:** `docs/GUIA_PUBLICAR_EN_LA_NUBE.md`, paso a paso.

**Verificación:**

- Se simuló la compilación de Render en una copia limpia del repositorio, con los mismos comandos: compila,
  inicia en producción, responde en `/` y en `/docente` y registra un participante.
- `pnpm test`: 42 de 42 pruebas aprobadas. Incluye la configuración de la base de datos local y en la nube.
- **Pendiente:** la primera publicación real en Render y Turso la hace el autor con sus cuentas, porque
  requiere iniciar sesión.
