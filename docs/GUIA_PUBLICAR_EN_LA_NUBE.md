# Guía: publicar Aula IA en la nube

Con esta guía la app queda en un **link HTTPS** (por ejemplo `https://aula-ia-cientifica.onrender.com`) que
compañeros, docentes y participantes pueden abrir desde su laptop, computadora o celular, **sin que tu PC
esté encendida**. Todo es gratuito. Tiempo aproximado: 20 a 30 minutos, solo la primera vez.

| Servicio | Para qué | Plan |
|---|---|---|
| **Turso** (turso.tech) | Base de datos en la nube (libSQL, compatible con SQLite) | Gratuito |
| **Render** (render.com) | Servidor donde corre la app | Gratuito |
| **Google AI Studio** | Clave de Gemini (la misma que usas en tu PC) | Gratuito |

> ¿Por qué dos servicios? El disco gratuito de Render **se borra** cada vez que el servidor se duerme o se
> actualiza. Si la base de datos estuviera ahí, se perderían los participantes y sus resultados. Turso la
> guarda de forma permanente.

Ten a mano: tu cuenta de **GitHub** (BernardoCOD) y tu clave de **Gemini** (`AIza…`).

---

## Parte 1 — Crear la base de datos en Turso

1. Entra a **https://turso.tech** y pulsa **Sign up**. Elige **Continue with GitHub** e inicia sesión con
   BernardoCOD.
2. En el panel, crea una base de datos (**Create Database** o **New Database**):
   - **Nombre:** `aula-ia`.
   - **Ubicación:** la más cercana a **Virginia (EE. UU.)**, por ejemplo `AWS US East (Virginia)`. Así queda
     cerca del servidor de Render.
3. Abre la base `aula-ia` y **copia su URL**. Empieza con `libsql://`, por ejemplo
   `libsql://aula-ia-bernardocod.turso.io`. Guárdala en un Bloc de notas.
4. En la misma página, crea un **token**: busca **Create Token** o **Generate Token**.
   - **Expiración:** *Never* (sin vencimiento).
   - **Permiso:** lectura y escritura (*Read & Write*).
   - **Copia el token y guárdalo:** se muestra **una sola vez**. Es un texto muy largo que empieza con `ey…`.

⚠️ El token es como una contraseña de la base de datos: no lo compartas ni lo pegues en el chat.

## Parte 2 — Publicar la app en Render

1. Entra a **https://render.com**, pulsa **Get Started** y elige **GitHub** para crear la cuenta.
2. Render pedirá permiso para ver tus repositorios. Elige **Only select repositories**, marca
   **aula-ia-cientifica** y acepta.
3. En el panel de Render pulsa **New +** → **Blueprint**.
4. Elige el repositorio **BernardoCOD/aula-ia-cientifica**:
   - **Branch (rama):** `claude/new-project-analysis-17vclq` (es la que tiene la versión actualizada y el
     archivo `render.yaml`).
   - **Blueprint Name:** `aula-ia`.
5. Render lee el archivo `render.yaml` y te pide **cuatro valores**. Pégalos sin comillas:

   | Variable | Qué poner |
   |---|---|
   | `GEMINI_API_KEY` | Tu clave de Gemini (`AIza…`) |
   | `DATABASE_URL` | La URL de Turso (`libsql://…`) |
   | `DATABASE_AUTH_TOKEN` | El token de Turso (`ey…`) |
   | `ADMIN_PASSWORD` | La contraseña que usarás en el panel docente. Aquí sí puede tener `#` |

   `ADMIN_USERNAME` (`docente`) y `JWT_SECRET` (un valor aleatorio) ya vienen configurados.
6. Pulsa **Apply** o **Deploy Blueprint**. Render instala y compila la app; tarda de 3 a 6 minutos.
7. Abre el servicio **aula-ia-cientifica** y mira la pestaña **Logs**. Al terminar debe decir:

   ```
   Aula IA lista en http://localhost:10000/
   [Panel docente] Usuario "docente", contraseña de N caracteres.
   [IA] Usando Google Gemini.
   [Database] Base de datos en la nube: aula-ia-bernardocod.turso.io
   ```

   El número de puerto puede variar; Render lo asigna solo.
8. Arriba del servicio verás el **link de tu app**, por ejemplo `https://aula-ia-cientifica.onrender.com`.
   Ese es el link para compartir.

## Parte 3 — Compartir y usar

1. Envía el link a tus compañeros y a tu docente por WhatsApp, correo o aula virtual.
2. Deben abrirlo en **Google Chrome** o **Microsoft Edge**. En celular, en **Chrome para Android**.
3. La primera vez, el navegador pide **permiso para el micrófono**: pulsar **Permitir**.
4. En otros dispositivos, el navegador no deja que la app hable hasta que la persona **toque la pantalla
   una vez**. Por ejemplo, el botón **"Hablar con Jason"**. Es una regla de los navegadores. En la Fase 2
   se prepara una bienvenida que lo indica.
5. El **panel docente** está en el mismo link terminado en `/docente`, por ejemplo
   `https://aula-ia-cientifica.onrender.com/docente`. Usuario `docente` y la contraseña de `ADMIN_PASSWORD`.

**El servidor gratuito se duerme** después de 15 minutos sin visitas. La primera persona que entre esperará
alrededor de **un minuto** mientras despierta; después funciona normal. **Antes de una clase o sesión, abre
el link unos 2 minutos antes.**

## Parte 4 — Actualizaciones

Cada vez que se sube un cambio a la rama `claude/new-project-analysis-17vclq`, Render **vuelve a publicar la
app sola** en unos minutos. Los datos no se pierden, porque están en Turso.

Si necesitas cambiar una clave o la contraseña: en Render abre el servicio → **Environment** → edita el valor
→ **Save Changes**. Render reinicia la app con el valor nuevo.

## Límites del plan gratuito

| Límite | Qué significa para el proyecto |
|---|---|
| Render se duerme tras 15 minutos sin visitas | La primera visita tarda alrededor de un minuto |
| Render: 750 horas al mes | Alcanza para un servicio encendido todo el mes |
| Gemini gratuito: límite por minuto y por día | El cupo lo comparten **todas** las personas que usen el link. Si se agota, el asistente lo avisa y las órdenes directas siguen funcionando |
| Turso gratuito: 5 GB y millones de lecturas al mes | Mucho más de lo que necesita el piloto |

Render indica que el plan gratuito no es para producción. Para un prototipo y una prueba piloto es suficiente.

## Privacidad (para el consentimiento informado)

- La base de datos queda en servidores de **Turso** y la app en servidores de **Render**, ambos en EE. UU.
- Solo se guardan el **código de participante** y sus respuestas y avance: no nombres ni datos personales.
- Lo demás no cambia: la voz la reconoce el navegador (Google en Chrome, Microsoft en Edge) y la IA es
  Gemini (Google).

## Si algo falla

| Problema | Qué hacer |
|---|---|
| El link tarda mucho la primera vez | Es normal: el servidor está despertando. Espera un minuto y recarga |
| En Logs: `Falta GEMINI_API_KEY` | Environment → agrega o corrige `GEMINI_API_KEY` → Save Changes |
| En Logs: `No se pudo abrir la base de datos` | Revisa `DATABASE_URL` (debe empezar con `libsql://`) y que el token sea el de esa base y no haya vencido |
| En Logs: `Base de datos local` en lugar de `en la nube` | Falta `DATABASE_URL`: los datos se perderían. Agrégala en Environment |
| El panel docente dice que no está configurado | Falta `ADMIN_PASSWORD` en Environment |
| La compilación falla (Build failed) | Copia las últimas líneas de los Logs y envíalas para revisarlas |
