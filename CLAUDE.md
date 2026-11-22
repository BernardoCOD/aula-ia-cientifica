# Aula IA Científica — instrucciones para Claude

Prototipo del TIF "Asistente de voz con inteligencia artificial para capacitación de personas con
discapacidad visual y motriz, Lima, 2026" (UCV). Dueño: Bernardo (BernardoCOD), que está aprendiendo a
programar.

## Al empezar una conversación

1. Lee `docs/ESTADO_DEL_PROYECTO.md` y **dile a Bernardo, en pocas líneas, en qué punto se quedó y cuál es
   el siguiente paso**, antes de hacer cualquier otra cosa.
2. La rama de trabajo es `claude/new-project-analysis-17vclq`.

## Forma de trabajo (del plan `PLAN_MEJORA_ASISTENTE.md`)

- Responde siempre en **español**, con lenguaje simple y pasos concretos (Bernardo usa Windows y CMD).
- Trabaja por fases. **Antes de cada fase muestra un plan corto y espera su "ok".**
- Al terminar cada fase:
  - corre `npx pnpm@10.4.1 check` y `npx pnpm@10.4.1 test` y agrega pruebas para lo nuevo;
  - actualiza `README.md`, `CHANGELOG.md`, `docs/REQUISITOS.md` (estado de cada requisito),
    `docs/DOCUMENTACION_TECNICA.md` (bitácora por fase, para la metodología y el marco teórico del informe)
    y `docs/ESTADO_DEL_PROYECTO.md`;
  - haz commit con un mensaje claro en español y push;
  - resume en 5 líneas qué cambió y cómo probarlo por voz.
- Si algo del plan no es posible o es riesgoso, dilo antes y propone una alternativa.
- **No borres datos de la base ni archivos sin preguntar.**
- **No modifiques las preguntas del pretest y postest** (`client/src/lib/assessment.ts`) sin aprobación del
  grupo: son el instrumento de la investigación.

## Decisiones ya tomadas

- **IA:** Google Gemini, plan gratuito, llamado solo desde el servidor (`server/_core/gemini.ts`). Claude
  queda como opción de pago futura.
- **Base de datos:** SQLite en la PC; en la nube, Turso (`DATABASE_URL=libsql://…`).
- **Publicación:** Render + Turso (`render.yaml`, `docs/GUIA_PUBLICAR_EN_LA_NUBE.md`), no ngrok.
- **Ingreso:** cada participante crea su código (por ejemplo P01) y puede dictarlo. Sin datos personales.
  A la IA solo llegan el código y el avance.
- En el código, los participantes se llaman `students` (nombre heredado). En la interfaz se dice
  "participante".
