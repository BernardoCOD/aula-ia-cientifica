# Estado del proyecto — dónde nos quedamos

**Última actualización:** 2026-11-22
**Rama de trabajo en GitHub:** `claude/new-project-analysis-17vclq` (repositorio `BernardoCOD/aula-ia-cientifica`)

## 👉 Punto exacto donde se quedó Bernardo

✅ **La app está publicada y verificada:** **https://aula-ia-cientifica.onrender.com**
(panel docente: `/docente`). Los Logs del 21 de noviembre confirman Gemini, el panel docente y la base de
datos en la nube (`aula-ia-bernardocod.aws-us-east-1.turso.io`).

**Fase 2 (uso sin manos) terminada el 22 de noviembre.** Bernardo probó el paso 1 (lectura breve e
interrupción por voz) y le pareció perfecto. **Falta que pruebe el paso 2 con micrófono:**

- la bienvenida hablada (o el aviso "Toca la pantalla para activar la voz");
- el ingreso guiado ("quiero empezar" → "pe cero uno" → "sí");
- "siguiente", "anterior" y "activar".

**Siguiente:** Fase 3 (plan abajo), esperando el "ok" de Bernardo.

## Lo que ya está hecho

| Fase | Estado |
|---|---|
| 0. Preparación | ✅ Plan en el repo, `docs/REQUISITOS.md`, `docs/DOCUMENTACION_TECNICA.md`, `CHANGELOG.md` |
| 1. Independizar de Manus y participantes adultos | ✅ Sin Manus; ingreso solo con código de participante ("pe cero uno" → P01); a la IA solo llegan el código y el avance |
| 5. Publicar (adelantada, en la nube) | ✅ Publicada en https://aula-ia-cientifica.onrender.com con Render + Turso |
| 2. Uso sin manos | ✅ Lectura breve, interrupción por voz, bienvenida, ingreso guiado y "siguiente / anterior / activar" |
| 3, 4, 6 | ⬜ Pendientes |

Verificación al cierre: `pnpm check` sin errores y `pnpm test` con 42 de 42 pruebas aprobadas.

## Fase 3 propuesta: acciones sobre la pantalla (esperando "ok")

Criterio del plan: "se resuelve un cuestionario, se cambia de pestaña y se ajusta la configuración solo
con la voz". Ya funcionan los cuestionarios, la velocidad de voz y el tamaño de letra. Falta:

1. **Alto contraste por voz** ("activa el alto contraste"), recordado en el dispositivo (requisito RF-08).
2. **Pestañas al instante** ("abre la pestaña retos") sin pasar por la IA.
3. **Revisar las preguntas libres** sobre el contenido del curso y el bloqueo en modo evaluación.
4. Pruebas, documentación, commit y push.

Después: **Fase 4 (evidencias para el TIF)**, con el registro de comandos y tiempos, el cuestionario Likert
por voz y la exportación a Excel. Es la más importante para el informe.

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
