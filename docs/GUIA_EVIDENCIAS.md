# Guía de evidencias del TIF

Lista para que el grupo reúna las evidencias del prototipo **Aula IA Científica** y las ubique en el informe.
Marca cada casilla cuando la tengas. Guarden todo en una carpeta compartida (por ejemplo, Google Drive)
con subcarpetas `capturas/`, `videos/` y `anexos/`.

**Link de la app:** https://aula-ia-cientifica.onrender.com
**Panel docente:** https://aula-ia-cientifica.onrender.com/docente
**Código QR del link:** `docs/qr-aula-ia.png` (para imprimir o pegar en anexos) y `docs/qr-aula-ia.svg`
(no pierde calidad al agrandarlo).

![QR de Aula IA Científica](qr-aula-ia.png)

---

## 1. Cómo capturar y grabar (Windows)

| Qué | Atajo | Dónde queda |
|---|---|---|
| Captura de una parte de la pantalla | **Win + Shift + S** y arrastra | En el portapapeles; pégala con **Ctrl + V** en Word o Paint |
| Captura de toda la pantalla | **Win + Impr Pant** | `Imágenes\Capturas de pantalla` |
| Video de la ventana, con audio | **Win + Alt + R** (inicia y detiene) | `Videos\Capturas` |
| Activar el micrófono en el video | **Win + G** → en "Captura", activa el micrófono | — |

**Consejos para las capturas:**

- Antes de capturar, sube el tamaño de letra de la app con la voz ("aumenta la letra") o con **Ctrl + +**.
- No muestres en las capturas la contraseña del panel docente ni las claves de Render y Turso.
- Nombra los archivos con número y tema, por ejemplo `03-ingreso-por-voz.png`, para ordenarlos fácil.

## 2. Metodología: cómo se desarrolló

- [ ] **Historial de cambios en GitHub:** repositorio → **Commits** (rama `claude/new-project-analysis-17vclq`,
      o `main` después de unirla). Captura la lista con fechas y mensajes. Evidencia el desarrollo por fases.
- [ ] **Registro de cambios por fase:** `CHANGELOG.md` (pueden citarlo o pegarlo en un anexo).
- [ ] **Bitácora técnica por fase:** `docs/DOCUMENTACION_TECNICA.md`, sección 11.
- [ ] **Pruebas automáticas aprobadas:** en CMD, dentro de la carpeta del proyecto:
      ```
      git pull
      npx pnpm@10.4.1 test
      ```
      Captura el final, donde dice **"Test Files … passed"** y **"Tests … passed"**.
- [ ] **Verificación de tipos sin errores:** `npx pnpm@10.4.1 check` (captura: termina sin mensajes de error).
- [ ] **Publicación en la nube:** Render → servicio `aula-ia-cientifica` → **Logs**. Captura las líneas
      `[IA] Usando Google Gemini.`, `[Database] Base de datos en la nube…` y `Your service is live`.
- [ ] **Pull request** (cuando se cree): la página del PR en GitHub muestra qué cambió y cuándo se aprobó.

## 3. Marco teórico y herramientas

Todo está en `docs/DOCUMENTACION_TECNICA.md`:

- [ ] **Herramientas y versiones** (sección 4): tabla para la parte de "herramientas" o "materiales".
- [ ] **Arquitectura** (sección 3): diagrama y flujo de una orden de voz. Pueden rehacer el diagrama en
      draw.io o Canva para el informe.
- [ ] **Conceptos y referencias** (sección 6): ASR, TTS, LLM, RAG, VUI e interrupción por voz (*barge-in*),
      WCAG 2.2, DUA 3.0, ISO 9241-11 e ISO/IEC 25010. **Verificar cada referencia** y darle formato APA 7.
- [ ] **Decisiones técnicas** (sección 7): por qué SQLite y Turso, Gemini, Web Speech API, Render.
- [ ] **Capturas de código** con números de línea, desde GitHub (abre el archivo y captura). Las más
      representativas:

| Concepto | Archivo |
|---|---|
| Reconocimiento y síntesis de voz, interrupción | `client/src/hooks/useSpeech.ts` |
| Filtro de eco (*barge-in*) | `client/src/lib/bargeIn.ts` |
| Órdenes de voz locales | `client/src/lib/voiceIntents.ts` |
| Lectura de evaluaciones tipo examen oral | `client/src/lib/questionSpeech.ts` |
| "Fotografía" accesible de la pantalla | `client/src/lib/pageSnapshot.ts` |
| Agente de IA y barreras de seguridad | `server/assistantAgent.ts` (`sanitizeReply`) |
| Conexión con Gemini y respaldo de modelos | `server/_core/gemini.ts` |
| Código de participante dicho por voz | `shared/participant.ts` |
| Registro de evidencias (Fase 4) | `server/evidence.ts` |

## 4. Objetivo específico 1: requisitos

- [ ] `docs/REQUISITOS.md`: tabla de requisitos funcionales y no funcionales con su trazabilidad a WCAG 2.2,
      DUA 3.0 e ISO 9241-11 y su estado (✅ / 🟡 / ⬜).

## 5. Objetivo específico 2: el prototipo funcionando

**Video demostrativo (la evidencia más fuerte para una app de voz):** de 3 a 5 minutos, con audio, usando
la app **solo con la voz**. Guion sugerido:

1. Abrir el link. Jason da la bienvenida (o aparece "Toca la pantalla para activar la voz").
2. "Quiero empezar" → Jason pide el código → "pe cero uno" → "Entendí P 0 1, ¿es correcto?" → "sí".
3. En el pretest: escuchar la pregunta 1 → **interrumpirlo** diciendo "opción B" → marca y lee la siguiente.
4. "Pregunta cinco", "lee la opción C", "cuántas me faltan".
5. "Qué es un prompt" (respuesta de la IA) y "busca en consultas qué es la inteligencia artificial"
   (Área de consultas con fuentes).
6. "Aumenta la letra", "habla más despacio", "siguiente" y "activar".
7. Panel docente: resultados y descarga del Excel.

**Capturas de pantalla:**

- [ ] Portada y aviso "Toca la pantalla para activar la voz".
- [ ] Ingreso con el código y el texto "Se guardará como P01".
- [ ] Pretest con el panel de Jason abierto mostrando lo que dijo.
- [ ] Un módulo de la capacitación.
- [ ] Área de consultas con una respuesta y sus fuentes.
- [ ] Panel docente (sin mostrar la contraseña).
- [ ] La app en un **celular** (captura del teléfono), para evidenciar el acceso desde distintos dispositivos.

## 6. Objetivos específicos 3 y 4: resultados de la prueba piloto

Desde la **Fase 4**, la app registra cada interacción **sin grabar audio**. El panel docente descarga un
**Excel** con:

| Hoja | Para qué sirve en el informe |
|---|---|
| Resumen por participante | Indicadores del OE3: comandos emitidos y reconocidos, tareas completadas, tiempo de respuesta, ayuda requerida, pretest y postest |
| Registro de interacciones | Evidencia detallada de cada orden, con fecha y hora (anexo) |
| Evaluaciones | Puntajes del pretest y postest |
| Definiciones | Cómo se calcula cada indicador (para la operacionalización de variables) |

- [ ] Al terminar la prueba piloto, entrar a `/docente` → **Descargar Excel** y guardar el archivo con la
      fecha, por ejemplo `resultados-piloto-2026-12-05.xlsx`.
- [ ] Captura del panel docente con los resultados.
- [ ] **Cuestionario Likert (OE4):** pendiente de cargar cuando el grupo entregue los ítems.

## 7. Compartir el código con el grupo, el docente o el jurado

| Opción | Pasos | Cuándo usarla |
|---|---|---|
| **Invitar al grupo** | GitHub → repositorio → **Settings → Collaborators → Add people** (con su usuario de GitHub) | Compañeros del grupo. Pueden ver y también modificar |
| **Hacer público el repositorio** | **Settings** → al final, **Change visibility → Public**. Antes: mover el proyecto Urban Force Gym (rama `main-hhcwbq`) a su propio repositorio | Cuando el docente o el jurado revisen el código. Se revisó que el historial no tiene claves ni contraseñas |
| **Descargar ZIP** | En GitHub: **Code → Download ZIP** y subirlo a Drive | Para entregar una copia fija junto con el informe |

## 8. Ética y consentimiento informado (mencionar en el informe)

- No se graba audio. El registro guarda **el texto** de cada orden, el código de participante y los tiempos.
- La voz se reconoce en el navegador: con servidores de Google en Chrome y de Microsoft en Edge.
- La IA es Google Gemini (plan gratuito: Google puede usar los datos para mejorar sus productos). A la IA solo
  llegan el código y el avance, nunca nombres.
- La app está alojada en Render y la base de datos en Turso, ambos con servidores en EE. UU.
- Se pide a los participantes **no decir datos personales** (nombre, DNI, teléfono) al hablar con Jason.
