# Requisitos del prototipo — Aula IA Científica

**Proyecto:** Asistente de voz con inteligencia artificial para capacitación de personas con discapacidad
visual y motriz, Lima, 2026 (TIF Nivel II, UCV).
**Objetivo específico que atiende:** OE1. Identificar los requisitos funcionales y de accesibilidad.
**Estado:** actualizado al cierre de la Fase 1. Se revisa al cerrar cada fase.

**Leyenda de estado** (verificado en el código de la rama `main`): ✅ cumplido · 🟡 parcial · ⬜ pendiente.

## 1. Usuarios y contexto de uso

| Perfil | Descripción | Necesidad principal |
|---|---|---|
| Participante con discapacidad visual | Adulto vinculado a la Videna (IPD), ciego o con baja visión | Recibir toda la información por voz y operar sin ver la pantalla |
| Participante con discapacidad motriz | Adulto sin uso de brazos | Operar sin teclado ni ratón, con comandos cortos y sin tiempos límite |
| Docente / investigador | Integrante del grupo del TIF | Ver resultados por participante y exportar las evidencias |

**Contexto de uso (ISO 9241-11):** sesión de capacitación sobre IA, en PC/laptop con Chrome o Edge o en celular
Android con Chrome, con micrófono y parlantes, conectado a internet, a través de un link HTTPS.

> **Pendiente del grupo:** unificar la versión del TIF (solo visual o visual + motriz; una sesión o
> pretest–postest; cuestionario de 12 o 15 ítems). Estos requisitos cubren **ambas** discapacidades y
> dejan el cuestionario **configurable**, para servir a cualquiera de las dos versiones.

## 2. Marcos de referencia

| Marco | Qué aporta a los requisitos |
|---|---|
| **WCAG 2.2** (W3C, 2023), nivel AA | Criterios verificables de accesibilidad web: perceptible, operable, comprensible y robusto |
| **DUA 3.0** (CAST, 2024) | Múltiples formas de representación, de acción y expresión, y de compromiso |
| **ISO 9241-11:2018** | Usabilidad como eficacia, eficiencia y satisfacción en un contexto de uso |
| **ISO/IEC 25010:2023** | Características de calidad del producto (adecuación funcional, eficiencia de desempeño, capacidad de interacción, seguridad, etc.) |

En las tablas, "WCAG x.x.x" indica el criterio de conformidad; "DUA: Representación / Acción y expresión /
Compromiso" indica el principio; "ISO 9241-11" indica la dimensión de usabilidad que el requisito permite medir.

## 3. Requisitos funcionales (RF)

| Código | Requisito | WCAG 2.2 | DUA 3.0 | ISO 9241-11 | Fase | Estado |
|---|---|---|---|---|---|---|
| RF-01 | Activar el asistente diciendo una palabra de activación ("Oye Jason"), sin tecla ni clic | 2.1.1 (alternativa al teclado), 2.5.3 | Acción y expresión | Eficacia | 2 | ✅ |
| RF-02 | Tras conceder el micrófono una sola vez, la app escucha sola al abrir y da una **bienvenida hablada** que explica qué se puede decir | 3.3.2, 1.4.2 | Representación, Compromiso | Eficacia, satisfacción | 2 | 🟡 escucha sola; falta la bienvenida hablada |
| RF-03 | Ingresar con un **código de participante dicho por voz** (ej. "P cero uno"), sin contraseña | 3.3.8, 3.3.7 | Acción y expresión | Eficacia, eficiencia | 1, 2 | 🟡 Fase 1: solo código, creado por el participante y normalizado al dictarlo ("pe cero uno" → P01); falta el ingreso guiado por voz (Fase 2) |
| RF-04 | Navegar por voz entre secciones, módulos y páginas ("abre el módulo dos", "volver al inicio") | 2.4.2, 2.4.5 | Acción y expresión | Eficacia | 2, 3 | ✅ |
| RF-05 | Leer la pantalla: resumen breve por defecto, "lee todo", "repite", "dónde estoy" y "qué puedo hacer" | 1.1.1, 1.3.1, 2.4.6 | Representación | Eficacia | 3 | ✅ |
| RF-06 | Actuar sobre los controles visibles: pulsar, escribir, marcar, abrir pestañas o secciones y desplazarse | 4.1.2, 2.5.3 | Acción y expresión | Eficacia, eficiencia | 3 | ✅ |
| RF-07 | Navegación secuencial por voz: "siguiente", "anterior", "activar" | 2.4.3, 2.1.1 | Acción y expresión | Eficiencia | 3 | 🟡 solo entre preguntas; falta en toda la pantalla |
| RF-08 | Ajustar por voz la velocidad de la voz, el tamaño de letra y el contraste | 1.4.4, 1.4.3 | Representación (personalizar la presentación) | Satisfacción | 3 | 🟡 velocidad y letra; falta contraste |
| RF-09 | Responder preguntas libres sobre el contenido de la capacitación | 3.1.3 (AAA, buena práctica) | Representación (construcción del conocimiento) | Eficacia | 3 | ✅ |
| RF-10 | Buscar en internet temas de la capacitación y leer la respuesta con sus fuentes (Área de consultas) | 1.1.1 | Representación | Eficacia | 3 | ✅ |
| RF-11 | Resolver cuestionarios por voz: leer pregunta y alternativas, marcar la opción dictada y avanzar | 2.1.1, 4.1.2 | Acción y expresión | Eficacia | 3 | ✅ |
| RF-12 | Pedir confirmación "sí / no" antes de enviar, borrar o finalizar | 3.3.4 | Acción y expresión (estrategias) | Eficacia | 2 | ✅ |
| RF-13 | En modo evaluación, no dar respuestas ni pistas (bloqueado en el servidor, no solo en la IA) | — | — | Validez de la evaluación | 3 | ✅ |
| RF-14 | Anunciar por voz los cambios de pantalla, los resultados de cada acción y los errores | 4.1.3, 3.3.1 | Representación | Eficacia | 2, 3 | 🟡 anuncia resultados de acciones; revisar cambios de pantalla |
| RF-15 | Comandos locales deterministas que funcionan sin IA ni red (respaldo si la IA falla) | — | Acción y expresión | Eficacia | 2 | ✅ |
| RF-16 | Modo alternativo de teclado y texto siempre disponible | 2.1.1, 2.1.2 | Acción y expresión (múltiples medios) | Eficacia | todas | ✅ |
| RF-17 | Registrar, **sin audio**, por participante y sesión: comando emitido, comando reconocido (local o IA), intención, tarea, si se completó, tiempo de respuesta (ms) y si necesitó ayuda | — | — | Eficacia, eficiencia (indicadores de la ficha de observación) | 4 | ⬜ |
| RF-18 | Cuestionario Likert **configurable desde un archivo** (12 o 15 ítems, dimensiones editables), leído y respondido por voz | 2.1.1, 3.3.2 | Acción y expresión | Satisfacción | 4 | ⬜ |
| RF-19 | Panel docente con resultados por indicador y dimensión, y exportación a Excel/CSV | 1.3.1 | — | (análisis de los tres indicadores) | 4 | 🟡 panel y exportación CSV; faltan indicadores y Excel |

## 4. Requisitos no funcionales (RNF)

| Código | Requisito | Referencia | Fase | Estado |
|---|---|---|---|---|
| RNF-01 | Español de Perú (es-PE), lenguaje simple y mensajes breves | WCAG 3.1.1, 3.1.5 (AAA, como buena práctica); DUA Representación (lenguaje) | todas | ✅ textos para personas adultas (Fase 1) |
| RNF-02 | Ninguna acción tiene tiempo límite ni exige precisión; tiempos de espera de escucha generosos | WCAG 2.2.1; ISO/IEC 25010 capacidad de interacción (inclusividad) | 2 | 🟡 revisar en Fase 2 |
| RNF-03 | Comandos cortos y tolerantes a variaciones (sinónimos, errores de reconocimiento, números dichos con palabras) | DUA Acción y expresión; ISO/IEC 25010 protección frente a errores del usuario | 2, 3 | ✅ |
| RNF-04 | Semidúplex: el asistente no escucha mientras habla, y la voz se puede detener con un comando ("para") | WCAG 1.4.2 | 2 | ✅ |
| RNF-05 | **Privacidad:** no se graba audio; los campos de contraseña nunca se leen, se escriben ni se envían a la IA; no se envían nombres ni datos personales a la IA | Ley N.º 29733 (Perú); ISO/IEC 25010 seguridad (confidencialidad) | todas | ✅ desde la Fase 1, a la IA solo llegan el código y el avance |
| RNF-06 | **Seguridad del agente:** la IA solo devuelve acciones de una lista cerrada que el servidor valida; nunca se ejecuta código arbitrario; las claves de la IA solo existen en el servidor | ISO/IEC 25010 seguridad (integridad) | 1, 3 | ✅ |
| RNF-07 | Compatibilidad: Chrome y Edge de escritorio, y Chrome en Android | WCAG 4.1.2; ISO/IEC 25010 compatibilidad | 5 | 🟡 probado en Chrome/Edge de escritorio |
| RNF-08 | Publicación con un link **HTTPS** en internet, sin depender de la PC del autor (el navegador solo permite el micrófono en sitios seguros) | ISO/IEC 25010 flexibilidad | 5 | 🟡 listo para publicar en Render + Turso (docs/GUIA_PUBLICAR_EN_LA_NUBE.md) |
| RNF-09 | Tiempo de respuesta: comandos locales en menos de 1 s; comandos con IA medidos en cada interacción (meta propuesta: 5 s o menos, a validar en el piloto) | ISO 9241-11 eficiencia; ISO/IEC 25010 eficiencia de desempeño | 4 | ⬜ se medirá en la Fase 4 |
| RNF-10 | Conformidad con **WCAG 2.2 nivel AA**: contraste mínimo, foco visible y no oculto, tamaño mínimo de los objetivos, etiquetas que coinciden con el nombre accesible | WCAG 1.4.3, 1.4.11, 2.4.7, 2.4.11, 2.5.3, 2.5.8 | 6 | ⬜ |
| RNF-11 | Proveedor de IA configurable por `.env` (Google Gemini gratuito por defecto; opción de pago a futuro) | ISO/IEC 25010 mantenibilidad (modificabilidad) | 1 | ✅ |
| RNF-12 | Funciona en Windows (scripts con `cross-env`) y guarda los datos en una base SQLite local | ISO/IEC 25010 flexibilidad (instalabilidad) | 0, 5 | ✅ |
| RNF-13 | Pruebas automáticas para la lógica crítica (validación de acciones, modo evaluación, registro de evidencias) | ISO/IEC 25010 mantenibilidad (capacidad de ser probado) | todas | 🟡 31 pruebas; faltan las de evidencias (Fase 4) |

## 5. Trazabilidad con los objetivos del TIF

| Objetivo específico | Requisitos |
|---|---|
| OE1. Identificar requisitos funcionales y de accesibilidad | Este documento |
| OE2. Desarrollar el prototipo (consultar información y realizar actividades por voz) | RF-01 a RF-16, RNF-01 a RNF-08, RNF-11, RNF-12 |
| OE3. Evaluar el funcionamiento (reconocimiento, tareas, tiempos) | RF-17, RF-19, RNF-09 |
| OE4. Determinar la percepción (accesibilidad, facilidad de uso, satisfacción) | RF-18, RF-19 |

## 6. Criterios de aceptación generales

- Un participante completa el recorrido **ingreso → módulo → cuestionario → resultados** sin teclado ni ratón.
- Toda acción que envía, borra o finaliza pide confirmación "sí / no".
- En una evaluación, ninguna respuesta del asistente contiene la alternativa correcta ni pistas.
- El panel docente descarga un Excel con los indicadores por participante.
- La revisión de WCAG 2.2 AA (Fase 6) no tiene errores bloqueantes.
