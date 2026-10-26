export type AssessmentQuestion = {
  id: string;
  text: string;
  options: string[];
  correct: number;
  content: string;
  capacity: string;
  cognitiveLevel: "comprensión" | "aplicación" | "análisis";
};

export const pretestQuestions: AssessmentQuestion[] = [
  {
    id: "pre-01",
    text: "En una clase de ciencias, una estudiante no comprende por qué ocurre un fenómeno. ¿Cuál sería el uso más adecuado de una IA para apoyarla?",
    options: [
      "Pedirle que entregue una respuesta final sin leerla.",
      "Solicitar una explicación gradual con un ejemplo y luego comprobarla.",
      "Copiar la primera explicación que aparezca.",
      "Pedirle que reemplace el estudio del tema.",
    ],
    correct: 1,
    content: "IA como apoyo al aprendizaje",
    capacity: "Selecciona un uso de IA que favorece la comprensión",
    cognitiveLevel: "aplicación",
  },
  {
    id: "pre-02",
    text: "Un estudiante quiere comprender la fotosíntesis para una exposición. ¿Qué instrucción sería más útil para obtener una respuesta adecuada?",
    options: [
      "Fotosíntesis.",
      "Hazme todo sobre esto.",
      "Explica la fotosíntesis para segundo de secundaria, con pasos, un ejemplo y una pregunta de comprobación.",
      "Dame una respuesta rápida.",
    ],
    correct: 2,
    content: "Prompts claros",
    capacity: "Construye una instrucción con propósito, contexto y formato",
    cognitiveLevel: "aplicación",
  },
  {
    id: "pre-03",
    text: "Una IA explica un concepto de matemática, pero el estudiante aún tiene dudas. ¿Qué acción ayuda más a aprender?",
    options: [
      "Pedir otro ejemplo y explicar con sus palabras qué parte no comprende.",
      "Copiar la explicación sin intentar resolver.",
      "Pedir únicamente la respuesta del ejercicio.",
      "Cerrar el tema porque la IA ya respondió.",
    ],
    correct: 0,
    content: "Comprensión de contenidos académicos",
    capacity: "Usa la IA para aclarar y reconstruir una explicación",
    cognitiveLevel: "aplicación",
  },
  {
    id: "pre-04",
    text: "Antes de consultar una IA sobre un problema de física, un estudiante ya intentó resolverlo. ¿Qué solicitud mantiene su razonamiento activo?",
    options: [
      "Resuelve el problema completo y no muestres pasos.",
      "Dime solo el resultado para copiarlo.",
      "Revisa mi procedimiento, señala el paso que debo reconsiderar y dame una pista.",
      "Escribe una solución con palabras más difíciles.",
    ],
    correct: 2,
    content: "IA para resolver problemas",
    capacity: "Solicita apoyo sin sustituir el razonamiento propio",
    cognitiveLevel: "aplicación",
  },
  {
    id: "pre-05",
    text: "Una herramienta genera un dato sobre la contaminación de un río. Antes de incluirlo en un informe, ¿qué debería hacer el estudiante?",
    options: [
      "Usarlo porque la respuesta parece convincente.",
      "Pedir a la misma IA que diga que es correcto.",
      "Buscar la fuente original, revisar la fecha y contrastarlo con otra fuente confiable.",
      "Eliminar cualquier dato que provenga de una IA.",
    ],
    correct: 2,
    content: "Verificación y contraste",
    capacity: "Contrasta una afirmación generada por IA con evidencias",
    cognitiveLevel: "análisis",
  },
  {
    id: "pre-06",
    text: "La IA presenta una cita con un autor y un enlace que no se pueden encontrar. ¿Cuál es la interpretación más responsable?",
    options: [
      "La cita debe ser verdadera porque tiene formato académico.",
      "Puede tratarse de información inventada y debe verificarse antes de usarla.",
      "El enlace no importa si la explicación está bien escrita.",
      "Basta con cambiar el nombre del autor.",
    ],
    correct: 1,
    content: "Errores e información poco confiable",
    capacity: "Identifica una señal de posible invención de la IA",
    cognitiveLevel: "análisis",
  },
  {
    id: "pre-07",
    text: "Para investigar las causas de un problema ambiental, ¿cómo puede apoyar mejor la IA al estudiante?",
    options: [
      "Pedir una lista final y usarla sin revisarla.",
      "Solicitar que organice preguntas y posibles categorías para luego investigar fuentes.",
      "Dejar que seleccione la única explicación válida.",
      "Usar sus respuestas como sustituto de las fuentes.",
    ],
    correct: 1,
    content: "Investigación y organización",
    capacity:
      "Usa la IA para organizar una investigación sin reemplazar las fuentes",
    cognitiveLevel: "aplicación",
  },
  {
    id: "pre-08",
    text: "Dos respuestas de IA explican de manera distinta un hecho histórico. ¿Qué demuestra un uso crítico?",
    options: [
      "Elegir la respuesta más larga.",
      "Aceptar la que use palabras más técnicas.",
      "Comparar sus afirmaciones con fuentes y revisar qué evidencias las respaldan.",
      "Promediar ambas respuestas.",
    ],
    correct: 2,
    content: "Lectura crítica de respuestas",
    capacity: "Evalúa respuestas de IA mediante evidencias y criterios",
    cognitiveLevel: "análisis",
  },
  {
    id: "pre-09",
    text: "Al pedir ayuda a una IA para una tarea, ¿qué práctica protege al estudiante y mantiene la responsabilidad académica?",
    options: [
      "Compartir contraseñas para recibir una respuesta personalizada.",
      "Entregar el texto generado como si fuera propio.",
      "Evitar datos personales, reconocer la ayuda y elaborar la versión comprendida.",
      "Pedir que invente fuentes para completar el trabajo.",
    ],
    correct: 2,
    content: "Uso ético y responsable",
    capacity: "Aplica criterios de privacidad, honestidad y autoría",
    cognitiveLevel: "aplicación",
  },
  {
    id: "pre-10",
    text: "¿Cuál secuencia representa mejor el aprendizaje con apoyo de inteligencia artificial?",
    options: [
      "Copiar → pegar → entregar.",
      "Preguntar → aceptar → olvidar.",
      "Pensar → consultar → verificar → comprender → comunicar.",
      "Generar → reemplazar → publicar.",
    ],
    correct: 2,
    content: "IA como apoyo, no reemplazo",
    capacity: "Integra un proceso de aprendizaje autónomo y crítico",
    cognitiveLevel: "comprensión",
  },
];

export const postestQuestions: AssessmentQuestion[] = [
  {
    id: "post-01",
    text: "Una alumna debe entender un concepto de biología que le resulta confuso. ¿Qué interacción con una IA favorece más su aprendizaje?",
    options: [
      "Pedir una respuesta para memorizarla.",
      "Solicitar una explicación por pasos, formular una duda propia y revisar la información.",
      "Copiar un resumen sin relacionarlo con la clase.",
      "Pedir que la IA estudie en su lugar.",
    ],
    correct: 1,
    content: "IA como apoyo al aprendizaje",
    capacity: "Selecciona un uso de IA que favorece la comprensión",
    cognitiveLevel: "aplicación",
  },
  {
    id: "post-02",
    text: "Para recibir retroalimentación sobre un párrafo de historia, ¿cuál instrucción está mejor planteada?",
    options: [
      "Corrige esto.",
      "Historia.",
      "Revisa este párrafo para tercer grado, identifica una idea poco clara y sugiere una pregunta para mejorarla sin reescribirlo completo.",
      "Escribe mi trabajo de historia.",
    ],
    correct: 2,
    content: "Prompts claros",
    capacity: "Construye una instrucción con propósito, contexto y formato",
    cognitiveLevel: "aplicación",
  },
  {
    id: "post-03",
    text: "Un estudiante lee una respuesta de IA sobre un tema que no domina. ¿Qué puede pedir para comprobar que realmente comprendió?",
    options: [
      "Una versión más larga para copiar.",
      "Un ejemplo, una comparación y una pregunta que pueda responder con sus palabras.",
      "La misma respuesta repetida.",
      "Una calificación sin explicación.",
    ],
    correct: 1,
    content: "Comprensión de contenidos académicos",
    capacity: "Usa la IA para aclarar y reconstruir una explicación",
    cognitiveLevel: "aplicación",
  },
  {
    id: "post-04",
    text: "Después de resolver un problema de proporciones, un estudiante quiere usar IA de forma formativa. ¿Qué debería solicitar?",
    options: [
      "Que cambie sus números y entregue el resultado.",
      "Que le indique solo si está bien.",
      "Que revise su estrategia, explique un posible error y le dé una pista para corregirlo.",
      "Que resuelva otro ejercicio para copiar el método.",
    ],
    correct: 2,
    content: "IA para resolver problemas",
    capacity: "Solicita apoyo sin sustituir el razonamiento propio",
    cognitiveLevel: "aplicación",
  },
  {
    id: "post-05",
    text: "Una IA proporciona una cifra sobre el consumo de agua en la comunidad. ¿Cuál procedimiento permite usarla responsablemente?",
    options: [
      "Copiarla porque aparece con muchos decimales.",
      "Compararla con un informe institucional y revisar el año y el método de medición.",
      "Confirmarla con otra conversación idéntica.",
      "Cambiar la cifra para que coincida con la conclusión.",
    ],
    correct: 1,
    content: "Verificación y contraste",
    capacity: "Contrasta una afirmación generada por IA con evidencias",
    cognitiveLevel: "análisis",
  },
  {
    id: "post-06",
    text: "Una respuesta de IA menciona un estudio, pero no aparecen el artículo, la revista ni el autor al buscarlos. ¿Qué debe concluir el estudiante?",
    options: [
      "Que es un estudio reciente y por eso no aparece.",
      "Que la información requiere confirmación y no debe citarse hasta encontrar evidencia real.",
      "Que puede inventar los datos que faltan.",
      "Que todas las respuestas de IA son inútiles.",
    ],
    correct: 1,
    content: "Errores e información poco confiable",
    capacity: "Identifica una señal de posible invención de la IA",
    cognitiveLevel: "análisis",
  },
  {
    id: "post-07",
    text: "Un equipo prepara una investigación sobre hábitos de lectura. ¿Qué tarea puede delegar parcialmente a una IA sin perder el control del trabajo?",
    options: [
      "Elegir automáticamente la conclusión.",
      "Organizar subtemas y proponer preguntas que luego serán investigadas en fuentes confiables.",
      "Reemplazar la lectura de los artículos.",
      "Decidir qué evidencia es verdadera sin justificarlo.",
    ],
    correct: 1,
    content: "Investigación y organización",
    capacity:
      "Usa la IA para organizar una investigación sin reemplazar las fuentes",
    cognitiveLevel: "aplicación",
  },
  {
    id: "post-08",
    text: "Dos herramientas ofrecen explicaciones opuestas sobre un fenómeno. ¿Qué acción muestra pensamiento crítico?",
    options: [
      "Escoger la que responda primero.",
      "Escoger la que tenga más palabras.",
      "Separar sus afirmaciones, compararlas con fuentes y justificar cuál resulta mejor respaldada.",
      "Combinar ambas sin revisar sus diferencias.",
    ],
    correct: 2,
    content: "Lectura crítica de respuestas",
    capacity: "Evalúa respuestas de IA mediante evidencias y criterios",
    cognitiveLevel: "análisis",
  },
  {
    id: "post-09",
    text: "Para pedir apoyo con una actividad escolar, ¿qué decisión es ética y responsable?",
    options: [
      "Enviar nombres, teléfonos y contraseñas para dar contexto.",
      "Presentar como propio todo lo que produzca la herramienta.",
      "Proteger los datos personales, declarar la ayuda recibida y revisar el trabajo antes de entregarlo.",
      "Solicitar referencias inexistentes para que el informe parezca completo.",
    ],
    correct: 2,
    content: "Uso ético y responsable",
    capacity: "Aplica criterios de privacidad, honestidad y autoría",
    cognitiveLevel: "aplicación",
  },
  {
    id: "post-10",
    text: "¿Qué diferencia el aprendizaje con IA de la simple obtención de una respuesta?",
    options: [
      "La rapidez con que se copia el texto.",
      "La cantidad de palabras generadas.",
      "El estudiante analiza la respuesta, verifica su calidad, la comprende y comunica una elaboración propia.",
      "Que la IA tome todas las decisiones.",
    ],
    correct: 2,
    content: "IA como apoyo, no reemplazo",
    capacity: "Integra un proceso de aprendizaje autónomo y crítico",
    cognitiveLevel: "comprensión",
  },
];

export function validateAssessmentBank(bank: AssessmentQuestion[]) {
  return (
    bank.length === 10 &&
    bank.every(
      question =>
        question.options.length === 4 &&
        question.correct >= 0 &&
        question.correct < 4 &&
        new Set(question.options).size === 4
    )
  );
}

export const assessmentControlTable = pretestQuestions.map(
  (question, index) => ({
    item: index + 1,
    content: question.content,
    capacity: question.capacity,
    cognitiveLevel: question.cognitiveLevel,
    correctAnswer: String.fromCharCode(65 + question.correct),
  })
);
