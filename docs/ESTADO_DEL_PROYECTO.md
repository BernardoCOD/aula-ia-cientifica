# Estado del proyecto — dónde nos quedamos

**Última actualización:** 2026-11-22
**Rama de trabajo en GitHub:** `claude/new-project-analysis-17vclq` (repositorio `BernardoCOD/aula-ia-cientifica`)

## 👉 Punto exacto donde se quedó Bernardo

**La app está publicada en Render** (servicio `aula-ia-cientifica`, estado *Deployed*, región Virginia).
Los Logs del 21 de noviembre confirman `[Panel docente] Usuario "docente", …` y `[IA] Usando Google Gemini.`

**Lo que falta para cerrar la publicación:**

1. Tras la actualización del 22 de noviembre, el servidor abre la base de datos al arrancar. En los Logs
   debe aparecer `[Database] Base de datos en la nube: …turso.io`:
   - si dice **"Base de datos local"**, falta `DATABASE_URL` en Environment y los datos se perderían;
   - si dice **"No se pudo abrir la base de datos"**, revisar la URL y el token de Turso.
2. Abrir el link (`https://….onrender.com`), probar a Jason y el panel `/docente`, y compartirlo con el docente.
3. Después: **Fase 2 (uso sin manos)**, que espera el "ok" de Bernardo.

## Lo que ya está hecho

| Fase | Estado |
|---|---|
| 0. Preparación | ✅ Plan en el repo, `docs/REQUISITOS.md`, `docs/DOCUMENTACION_TECNICA.md`, `CHANGELOG.md` |
| 1. Independizar de Manus y participantes adultos | ✅ Sin Manus; ingreso solo con código de participante ("pe cero uno" → P01); a la IA solo llegan el código y el avance |
| 5. Publicar (adelantada, en la nube) | ✅ Publicada en Render. Falta confirmar en los Logs la conexión a Turso (ver arriba) |
| 2. Uso sin manos | ⬜ Plan propuesto, esperando el "ok" de Bernardo (ver abajo) |
| 3, 4, 6 | ⬜ Pendientes |

Verificación al cierre: `pnpm check` sin errores y `pnpm test` con 42 de 42 pruebas aprobadas.

## Siguiente fase propuesta: Fase 2, uso sin manos (esperando "ok")

1. **Bienvenida hablada al abrir.** Jason saluda y explica qué decir. En dispositivos de otras personas
   indica que toquen la pantalla una vez, porque el navegador no deja hablar a la app sin un primer toque.
2. **Ingreso guiado por voz.** Jason pregunta "¿Cuál es tu código?", repite lo que entendió
   ("Entendí P01, ¿es correcto?") y espera un sí o un no.
3. **"Siguiente", "anterior" y "activar"** para recorrer los controles de cualquier pantalla.
4. **Tiempos de escucha más generosos.**
5. Pruebas, documentación, commit y push.

El recorrido real por voz lo prueba Bernardo, en su PC o en el link publicado: la nube de Claude no tiene
micrófono.

## Decisiones pendientes del grupo

- **Preguntas del pretest y postest** (`client/src/lib/assessment.ts`): todavía hablan de "estudiantes",
  "secundaria" y "fotosíntesis". No se modificaron porque son el instrumento de la investigación. Si el
  grupo aprueba una versión para adultos, cargarla.
- **Versión del TIF:** solo visual o visual + motriz; 12 o 15 ítems del cuestionario Likert (Fase 4).
- **Códigos de participante:** cada participante crea el suyo. Se sugiere que el facilitador indique un
  formato, por ejemplo "P y tu número de lista", para que dos personas no usen el mismo.

## Otros pendientes

- **Mover el proyecto Urban Force Gym** (rama `main-hhcwbq` de este repo) a su propio repositorio. Bernardo
  debe crear un repositorio vacío y privado `urban-force-gym`. Después se copia la rama sin cambios, se
  verifica la copia y recién entonces se borra de aquí.
- **Proyecto Asistente de Clase** (bot de Telegram, repo `BernardoCOD/asistente-clase`): estructura y plan
  listos. La fase 1 (bot base) no se ha empezado.

## Datos útiles

- **Copia local actualizada en la PC de Bernardo:**
  `C:\Users\user\Documents\Trabajo - TAREAS\aula-ia-fase1`. Para actualizarla, ejecutar `git pull` en esa
  carpeta.
- **Carpeta antigua** (versión original de Manus): `...\aula-ia-cientifica-actualizado\aula-ia-cientifica`,
  subida como rama `version-plan`. Solo es referencia.
- **Panel docente:** `/docente`, con usuario `docente` y la contraseña de `ADMIN_PASSWORD`. En `.env`, si la
  contraseña tiene `#`, va entre comillas.
