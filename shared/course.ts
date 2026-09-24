// Contenido de la capacitación compartido por el cliente (páginas) y el servidor (asistente de IA).

export const courseModules = [
  {
    id: "m1",
    number: "01",
    title: "IA para comprender",
    short: "Reconoce la IA como apoyo para entender contenidos de clase.",
  },
  {
    id: "m2",
    number: "02",
    title: "Instrucciones que ayudan",
    short: "Formula prompts claros para aprender, practicar y recibir orientación.",
  },
  {
    id: "m3",
    number: "03",
    title: "Pensar con apoyo de IA",
    short: "Resuelve problemas sin entregar tu razonamiento a la herramienta.",
  },
  {
    id: "m4",
    number: "04",
    title: "Verificar antes de usar",
    short: "Contrasta respuestas, fuentes, fechas y evidencias.",
  },
  {
    id: "m5",
    number: "05",
    title: "Investigar y organizar",
    short: "Usa la IA para ordenar preguntas e información sin reemplazar tus fuentes.",
  },
  {
    id: "m6",
    number: "06",
    title: "Comunicar con criterio",
    short: "Elabora respuestas propias, éticas y fundamentadas para tus clases.",
  },
] as const;

export const lessons: Record<
  string,
  {
    eyebrow: string;
    intro: string;
    points: { title: string; text: string }[];
    exercise: string;
    options: string[];
    correct: number;
  }
> = {
  m1: {
    eyebrow: "Comprender con apoyo",
    intro:
      "La inteligencia artificial puede ayudarte a entender contenidos de clase, proponer ejemplos y ofrecer otra explicación. Sus respuestas no garantizan verdad ni comprensión: tú decides qué te sirve y debes revisar lo que produce.",
    points: [
      {
        title: "Para aprender",
        text: "Pide explicaciones graduales, ejemplos, comparaciones y preguntas para comprobar tu comprensión.",
      },
      {
        title: "Tu criterio",
        text: "La herramienta genera resultados a partir de patrones; no reemplaza tu lectura, análisis ni decisión.",
      },
    ],
    exercise:
      "Una respuesta de IA explica un tema de ciencias. ¿Qué demuestra aprendizaje?",
    options: [
      "Copiarla sin leer.",
      "Comprenderla, comprobarla y explicarla con tus palabras.",
      "Elegir la más larga.",
    ],
    correct: 1,
  },
  m2: {
    eyebrow: "Preguntar para aprender",
    intro:
      "Una instrucción clara orienta a la IA hacia una ayuda concreta. Incluye el tema, el propósito, el contexto y el formato que necesitas; así la respuesta puede convertirse en una oportunidad de aprendizaje.",
    points: [
      {
        title: "Da contexto",
        text: "Indica el grado, el tema, lo que ya intentaste y la parte que no comprendes.",
      },
      {
        title: "Pide una acción",
        text: "Solicita explicar, comparar, dar una pista, formular preguntas o revisar un procedimiento.",
      },
    ],
    exercise: "¿Cuál pedido ayuda mejor a estudiar un concepto?",
    options: [
      "Explícame esto.",
      "Haz mi tarea.",
      "Explica el concepto para mi grado, con un ejemplo y una pregunta para comprobarlo.",
    ],
    correct: 2,
  },
  m3: {
    eyebrow: "Pensar antes de delegar",
    intro:
      "La IA puede acompañar la resolución de problemas, pero tu razonamiento debe estar presente. Empieza con un intento propio y pide pistas o retroalimentación para revisar tus pasos, no una solución para copiar.",
    points: [
      {
        title: "Primero intenta",
        text: "Anota qué sabes, qué estrategia elegiste y dónde aparece tu duda.",
      },
      {
        title: "Después consulta",
        text: "Pide que señale un posible error, un contraejemplo o una pista sin resolver todo.",
      },
    ],
    exercise: "¿Qué solicitud mantiene activo tu razonamiento?",
    options: [
      "Dame solo la respuesta.",
      "Revisa mi procedimiento y dame una pista sobre el paso que debo reconsiderar.",
      "Resuelve todo con palabras difíciles.",
    ],
    correct: 1,
  },
  m4: {
    eyebrow: "Antes de creer",
    intro:
      "Una respuesta de IA puede ser correcta, incompleta o inventada. Verificar implica identificar afirmaciones, revisar autores y fechas, buscar la fuente original y contrastar la evidencia antes de usarla en clase.",
    points: [
      {
        title: "Contrasta",
        text: "Compara la afirmación con libros, artículos, instituciones u otras fuentes confiables.",
      },
      {
        title: "Detecta alertas",
        text: "Desconfía de citas inexistentes, datos sin origen, contradicciones y seguridad sin evidencias.",
      },
    ],
    exercise: "La IA menciona un estudio que no encuentras. ¿Qué haces?",
    options: [
      "Lo citas porque suena académico.",
      "Buscas la fuente y no lo usas hasta confirmar que existe.",
      "Le pides a la misma IA que lo confirme.",
    ],
    correct: 1,
  },
  m5: {
    eyebrow: "Investigar y organizar",
    intro:
      "La IA puede ayudarte a ordenar preguntas, subtemas y posibles relaciones para iniciar una investigación. No debe reemplazar la lectura de fuentes ni decidir por ti qué evidencia es válida.",
    points: [
      {
        title: "Organiza",
        text: "Pide categorías, preguntas de investigación o un esquema que después revisarás.",
      },
      {
        title: "Investiga",
        text: "Consulta fuentes reales, registra sus datos y decide con argumentos qué información utilizar.",
      },
    ],
    exercise: "¿Qué tarea puede apoyar la IA sin reemplazar tu investigación?",
    options: [
      "Elegir la conclusión definitiva.",
      "Proponer subtemas y preguntas para luego investigar en fuentes confiables.",
      "Inventar referencias.",
    ],
    correct: 1,
  },
  m6: {
    eyebrow: "Comunicar con criterio",
    intro:
      "Aprender con IA termina cuando puedes explicar, argumentar y comunicar una elaboración propia. Usa la herramienta como una segunda mirada, protege tus datos, reconoce la ayuda y conserva la responsabilidad sobre tu trabajo.",
    points: [
      {
        title: "Elabora",
        text: "Relaciona ideas, evidencias y conclusiones; no entregues un texto que no puedes explicar.",
      },
      {
        title: "Actúa con ética",
        text: "Protege información personal, evita inventar fuentes y transparenta cuándo recibiste apoyo.",
      },
    ],
    exercise: "¿Qué hace responsable una entrega apoyada por IA?",
    options: [
      "Presentar todo como propio.",
      "Revisar, comprender, citar o reconocer la ayuda y escribir una versión propia.",
      "Compartir contraseñas para dar contexto.",
    ],
    correct: 1,
  },
};
