# Registro de cambios

Cambios del prototipo Aula IA Científica, de lo más reciente a lo más antiguo. El detalle técnico de cada
fase está en [`docs/DOCUMENTACION_TECNICA.md`](docs/DOCUMENTACION_TECNICA.md).

## Publicación en la nube — Fase 5 adelantada (2026-10-27)

### Agregado
- La app se puede publicar en internet con **Render** (servidor) y **Turso** (base de datos), ambos
  gratuitos, con un link que funciona aunque la PC esté apagada. Configuración en `render.yaml` y guía en
  `docs/GUIA_PUBLICAR_EN_LA_NUBE.md`.
- La base de datos acepta `DATABASE_URL=libsql://…` con `DATABASE_AUTH_TOKEN`.

### Corregido
- Panel docente: si falta la contraseña en `.env`, se dice claramente. Al iniciar, el servidor muestra
  cuántos caracteres tiene la contraseña leída, porque un `#` sin comillas la cortaba.

## Fase 1 — Independizar de Manus y adaptar a participantes adultos (2026-10-26)

### Cambiado
- El ingreso pide solo un **código de participante** que la persona crea (por ejemplo P01). Se puede
  dictar: "pe cero uno" se guarda como P01. Quien vuelve con su código continúa su avance.
- Textos de la portada, los paneles y las instrucciones de la IA adaptados a personas adultas con
  discapacidad visual o motriz de la Videna (IPD).
- Panel docente: búsqueda por código; la exportación CSV ya no incluye colegio, grado ni sección.

### Seguridad y privacidad
- A la IA solo llegan el código y el avance del participante, nunca datos escolares (ni de registros
  antiguos).

### Eliminado
- Todas las dependencias de Manus: inicio de sesión OAuth, almacenamiento, mapas, `forge.manus.im`,
  notificaciones, plugin de Vite y paquetes sin uso.

### Pruebas
- Nuevas: código dictado, participante que vuelve, privacidad del agente e independencia de Manus
  (38 pruebas en total).

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
