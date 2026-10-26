# Registro de cambios

Cambios del prototipo Aula IA Científica, de lo más reciente a lo más antiguo. El detalle técnico de cada
fase está en [`docs/DOCUMENTACION_TECNICA.md`](docs/DOCUMENTACION_TECNICA.md).

## Fase 0 — Preparación (2026-10-26)

### Agregado
- `PLAN_MEJORA_ASISTENTE.md`: plan de mejora por fases.
- `docs/REQUISITOS.md`: 19 requisitos funcionales y 13 no funcionales trazados a WCAG 2.2, DUA 3.0 e
  ISO 9241-11, con su estado actual (OE1).
- `docs/DOCUMENTACION_TECNICA.md`: herramientas, arquitectura, código clave, decisiones técnicas y
  relación con el marco teórico.
- Órdenes de voz "quiero empezar" / "comenzar la capacitación" (abren la ruta de aprendizaje) y
  "pantalla inicial" (abre el inicio), traídas de la versión local `version-plan`, con sus pruebas.

### Corregido
- `Iniciar Aula IA.bat` pedía la clave de Claude; ahora pide la clave gratuita de Gemini (`GEMINI_API_KEY`).

## Antes del plan de mejora (2026-09-24)

Versión preparada para la demostración al docente.
- Evaluaciones por voz: marcar y avanzar, responder por número de pregunta y enviar.
- IA gratuita con Google Gemini (Gemma primero, Gemini Flash de respaldo) y búsqueda en Wikipedia; Claude
  queda como opción de pago.
- Activación solo por voz con "Oye Jason" / "Ok Jason".
- Agente de voz con "fotografía" de la pantalla, base de datos SQLite y Área de consultas.
- Scripts compatibles con Windows (`cross-env`) e `Iniciar Aula IA.bat`.

## Estado inicial
- Aplicación generada con Manus (React + Vite + tRPC + Express + MySQL/Drizzle).
