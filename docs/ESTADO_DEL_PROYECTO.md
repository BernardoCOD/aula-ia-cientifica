# Estado del proyecto — dónde nos quedamos

**Última actualización:** 2026-10-27
**Rama de trabajo en GitHub:** `claude/new-project-analysis-17vclq` (repositorio `BernardoCOD/aula-ia-cientifica`)

## 👉 Punto exacto donde se quedó Bernardo

Publicando la app en la nube con `docs/GUIA_PUBLICAR_EN_LA_NUBE.md`:

- **Parte 1 (Turso):** hecha. La base de datos está creada y ya tiene la URL `libsql://…` y el token.
- **Parte 2 (Render):** llegó hasta el **paso 6, "Pulsa Apply o Deploy Blueprint"**. Ya había llenado los
  valores (`GEMINI_API_KEY`, `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `ADMIN_PASSWORD`).

**Para retomar:**

1. Entrar a https://dashboard.render.com y revisar si el Blueprint `aula-ia` y el servicio
   `aula-ia-cientifica` ya existen:
   - **Si no existen** (no llegó a pulsar Apply): repetir la Parte 2 desde el paso 3. Los valores de Turso
     siguen sirviendo. Si perdió el token, crear uno nuevo en Turso.
   - **Si existen:** abrir el servicio → pestaña **Logs** y seguir con el paso 7.
2. **Paso 7:** en los Logs debe aparecer `[Database] Base de datos en la nube: …`, `[IA] Usando Google
   Gemini.` y `[Panel docente] Usuario "docente", …`. Si hay errores, copiar las últimas líneas para
   revisarlas.
3. **Paso 8:** copiar el link (`https://….onrender.com`), probarlo y compartirlo (Parte 3 de la guía).

## Lo que ya está hecho

| Fase | Estado |
|---|---|
| 0. Preparación | ✅ Plan en el repo, `docs/REQUISITOS.md`, `docs/DOCUMENTACION_TECNICA.md`, `CHANGELOG.md` |
| 1. Independizar de Manus y participantes adultos | ✅ Sin Manus; ingreso solo con código de participante ("pe cero uno" → P01); a la IA solo llegan el código y el avance |
| 5. Publicar (adelantada, en la nube) | 🟡 Código listo (`render.yaml`, soporte de Turso). **Falta terminar la publicación en Render** (ver arriba) |
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
