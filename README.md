# Aula IA Científica

**Asistente de voz con inteligencia artificial para capacitación accesible sobre IA a personas con
discapacidad visual y motriz (Lima, 2026).**

Aplicación web educativa con un asistente de voz, **Jason**, que permite recorrer y usar toda la
plataforma sin ver la pantalla ni usar las manos: navega, lee, completa formularios, marca
alternativas, consulta el progreso guardado en la base de datos y responde preguntas sobre los temas
de la capacitación. Incluye un **Área de consultas** que busca en internet, con fuentes, temas
relacionados con la IA.

## Requisitos

- [Node.js](https://nodejs.org) 20 o superior.
- Google Chrome o Microsoft Edge (el reconocimiento de voz del navegador funciona mejor en ellos).
- Una clave **gratuita** de Google Gemini, sin tarjeta de crédito: entra a
  [aistudio.google.com/apikey](https://aistudio.google.com/apikey) con una cuenta de Google y pulsa
  **Create API key**. Sin la clave la app funciona, pero el asistente solo entiende órdenes directas.
  (Opcional: la app también funciona con la IA, que es de pago.)

## Instalación y uso

```bash
npx pnpm@10.4.1 install      # instala dependencias (una sola vez)
copy .env.example .env       # en Windows; en Mac/Linux: cp .env.example .env
```

Abre `.env` y completa al menos `GEMINI_API_KEY`, `ADMIN_PASSWORD` y `JWT_SECRET`. Luego:

```bash
npx pnpm@10.4.1 dev          # modo desarrollo: http://localhost:3000
npx pnpm@10.4.1 build        # compila para producción
npx pnpm@10.4.1 start        # sirve la versión compilada
npx pnpm@10.4.1 test         # pruebas automáticas
npx pnpm@10.4.1 check        # verificación de tipos
```

## Variables de entorno (`.env`)

| Variable | Uso |
|---|---|
| `GEMINI_API_KEY` | Clave gratuita de Gemini: asistente inteligente, Área de consultas, Tutor IA y análisis docente. |
| `GEMINI_MODEL` | Opcional. Modelo preferido (por defecto `gemma-4-26b-a4b-it`, gratuito y rápido; si está saturado, sin cupo o tarda más de 30 s, se prueban modelos Gemini Flash gratuitos). |
| `GEMINI_SEARCH` | Opcional. El Área de consultas busca en Wikipedia en español (gratis). Con `google` usa la búsqueda de Google de Gemini, si la cuenta la tiene habilitada. |
| `ANTHROPIC_API_KEY` | Opcional y de pago: usar Claude en lugar de Gemini (con `AI_PROVIDER=claude` si hay dos claves). |
| `ANTHROPIC_MODEL` | Opcional. Modelo de Claude (por defecto `claude-opus-5`). |
| `ANTHROPIC_EFFORT` | Opcional. `low` (por defecto, respuestas de voz más rápidas), `medium` o `high`. |
| `ANTHROPIC_RESEARCH_EFFORT` | Opcional. Esfuerzo del Área de consultas (por defecto `medium`). |
| `DATABASE_URL` | Archivo de la base de datos SQLite. Por defecto `file:./data/aula.db`. |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Credenciales del panel docente (`/docente`). |
| `JWT_SECRET` | Firma de las cookies de sesión (texto largo y aleatorio). |
| `PORT` | Puerto del servidor (por defecto 3000). |

Las claves nunca llegan al navegador: todas las llamadas a la IA se hacen desde el servidor.

**Plan gratuito de Gemini:** tiene límites por minuto y por día (se ven en AI Studio). Si se
agotan, el asistente lo avisa y las órdenes directas siguen funcionando. Según las condiciones de
Google, en el plan gratuito el contenido enviado puede usarse para mejorar sus productos: no se
envían contraseñas y conviene no dictar datos personales sensibles, e informarlo en el
consentimiento de la investigación.

## Base de datos

SQLite en un solo archivo (`data/aula.db`), sin instalar ningún servidor. Las tablas se crean solas
al iniciar la app. Guarda estudiantes, progreso por módulo, evaluaciones (pretest y postest),
actividades, retos, interacciones con el Tutor IA y consultas. Para verla con una interfaz gráfica:
`npx pnpm@10.4.1 db:studio`. Para empezar de cero, borra la carpeta `data/`.

## El asistente de voz

**Cómo activarlo: solo con la voz**

- Di **"Oye Jason"** u **"Ok Jason"** en cualquier pantalla, como con el asistente de Google. Puedes
  decir la orden seguida: "Oye Jason, abre el módulo dos".
- La activación por voz está encendida desde que se abre la página. Tras cada respuesta vuelve a
  escuchar sin que digas la frase otra vez; después de dos silencios queda en espera de "Oye Jason".
- Di **"detener asistente"** para terminar la conversación (seguirá atento a "Oye Jason").
- Para usarla sin manos, abre la app con **`Iniciar Aula IA.bat`** (doble clic). Inicia el servidor
  y abre Chrome (o Edge) en una ventana propia, con la voz habilitada sin que nadie toque la
  página (los navegadores normales bloquean el audio hasta el primer clic). **Solo la primera vez**,
  una persona que acompañe debe pulsar **Permitir** en el aviso del micrófono; Chrome lo recuerda.
- Atajos opcionales para docentes o acompañantes: botón "Hablar con Jason", **Ctrl + Mayús +
  Espacio** y **Escape**.

**Qué puede hacer** (habla con naturalidad, no hay frases fijas)

- Navegar: "abre el módulo tres", "llévame a mis resultados", "quiero hacer el pretest".
- Leer: "qué hay en la pantalla", "lee todo", "lee la tabla de estudiantes", "repite".
- Actuar sobre cualquier control: "pulsa continuar", "abre la pestaña retos", "marca la casilla".
- Formularios: "mi código es A12, estoy en cuarto grado sección C", "escribe en el colegio Virgen
  del Rosario". Pide confirmación antes de enviar, guardar evaluaciones, borrar o salir.
- Órdenes de varios pasos: "entra a mi ruta y abre el tutor" (navega, mira la pantalla nueva y sigue).
- Datos de la base de datos: "cuánto avancé", "qué módulos me faltan", "ya puedo dar el postest".
- Preguntas sobre los temas de la capacitación: "qué es un prompt", "cómo verifico una fuente".
- Buscar en internet: "busca en consultas qué herramientas de IA ayudan a personas ciegas".
- Accesibilidad: "aumenta la letra", "habla más despacio", "para".

**En evaluaciones (pretest y postest)** puede leer preguntas y alternativas, moverse entre ellas y
marcar la opción que la persona dicte ("opción B", "elijo la tercera"), pero nunca sugiere
respuestas. Esto lo garantiza el servidor aunque el modelo se equivoque.

**Modo simulación**: describe lo que haría sin tocar la página. Útil para demostraciones.

## Área de consultas (`/consultas`)

Búsqueda en internet (artículos de Wikipedia en español, gratis) con la IA, limitada a temas de la capacitación: IA, uso responsable, prompts,
verificación de información, privacidad y tecnologías de accesibilidad. Las preguntas no
relacionadas se rechazan con amabilidad. Cada respuesta se lee en voz alta, muestra sus fuentes y
queda registrada en la base de datos.

## Cómo funciona (decisiones técnicas)

- **Agente con "fotografía" de la pantalla.** En cada orden, el navegador describe la pantalla
  (`client/src/lib/pageSnapshot.ts`): títulos, texto visible, cada control con un id, sus valores y
  estados, tablas, diálogos y alertas. El servidor (`server/assistantAgent.ts`) envía eso a la IA
  con los datos del estudiante y el contenido de los módulos (`shared/course.ts`). La IA responde
  con salidas estructuradas: qué decir, qué acciones ejecutar y si necesita confirmación. Así el
  asistente funciona en cualquier pantalla, también en las que se agreguen después, sin programar
  comandos uno por uno.
- **Ejecución verificada** (`client/src/lib/pageActions.ts`): clics reales (compatibles con los
  menús y pestañas de la interfaz), escritura en campos, listas y desplazamiento. Cada acción informa
  qué pasó; si algo falla, el asistente lo dice en lugar de dar por hecho que funcionó.
- **Barreras en el servidor, no solo en el prompt**: se descartan acciones sobre controles o rutas
  inexistentes, y en evaluación se bloquea escribir o marcar alternativas no dictadas.
- **Doble confirmación**: la pide la IA y, además, el navegador exige confirmar cualquier botón de
  envío, borrado o salida.
- **Comandos locales** (`client/src/lib/voiceIntents.ts`): las órdenes más comunes se resuelven al
  instante en el navegador, sin red, y mantienen la app usable si la IA no está disponible.
- **Voz en semi dúplex** (`client/src/hooks/useSpeech.ts`): nunca escucha mientras habla, para no
  oírse a sí mismo; divide las lecturas largas en frases y elige una voz en español latinoamericano.
- **Privacidad**: no se graba audio. Los campos de contraseña nunca se leen, se escriben ni se
  envían a la IA.

## Limitaciones conocidas

- El reconocimiento de voz del navegador necesita internet y funciona mejor en Chrome y Edge.
- Cada orden al agente tarda unos segundos, porque la IA analiza la pantalla completa.
- Con el esfuerzo `low` el asistente responde más rápido; si se equivoca en órdenes complejas, prueba
  `ANTHROPIC_EFFORT=medium`.
- Mientras el asistente habla no escucha (para no oírse a sí mismo): espera a que termine para hablarle.
- El reconocimiento de voz no funciona en el panel de vista previa del editor: usa Chrome o Edge.
- Si se usa Claude (opcional), cada consulta tiene costo; con Gemini gratuito el límite es de uso diario.
