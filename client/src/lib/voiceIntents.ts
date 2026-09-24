// Comandos de voz locales: se reconocen al instante en el navegador, sin red ni IA, y mantienen
// la app usable aunque el servicio de IA falle. Todo lo demás lo interpreta el agente de IA.
// Solo se incluyen frases inequívocas: ante la duda, la orden pasa al agente, que ve la pantalla.

export type { AssistantMode } from "@shared/assistant";
import type { AssistantMode } from "@shared/assistant";

export type AssistantScreenContext = {
  mode: AssistantMode;
  route?: string;
  moduleId?: string;
  moduleTitle?: string;
  currentContent?: string;
  currentQuestion?: string;
  currentOptions?: string[];
  questionIndex?: number;
  totalQuestions?: number;
};

export type AssistantHandlers = {
  onNext?: () => void;
  onPrevious?: () => void;
  onGoToQuestion?: (index: number) => void;
  onContinue?: () => void;
  onSelectOption?: (letter: OptionLetter) => void;
  onStartActivity?: () => void;
};

export type OptionLetter = "A" | "B" | "C" | "D";

export type LocalCommand =
  | { kind: "wake" }
  | { kind: "stop_assistant" }
  | { kind: "pause" }
  | { kind: "repeat" }
  | { kind: "read"; full: boolean }
  | { kind: "text_size"; direction: 1 | -1 }
  | { kind: "speech_rate"; value: "slower" | "faster" | "normal" }
  | { kind: "help" }
  | { kind: "simulation" }
  | { kind: "decline"; message: string }
  | { kind: "select_option"; letter: OptionLetter }
  | { kind: "next_question" }
  | { kind: "previous_question" }
  | { kind: "go_to_question"; index: number }
  | { kind: "read_question" }
  | { kind: "navigate"; path: string; label: string }
  | { kind: "back" };

export const ASSISTANT_NAME = "Jason";

export const HELP_MESSAGE =
  "Puedes hablarme con naturalidad. Por ejemplo: abre el módulo dos, qué hay en la pantalla, lee todo, llévame a mis resultados, escribe mi código A12 en el campo del estudiante, cuánto avancé, qué es un prompt, o busca en consultas cómo verificar una noticia. En las evaluaciones di: lee la pregunta, opción B o siguiente pregunta. Para detener la lectura di para. Para que deje de escucharte di detener asistente.";
export const AI_UNAVAILABLE_MESSAGE =
  "El asistente inteligente no está disponible en este momento. Puedo seguir ayudándote con órdenes directas como: abre el módulo dos, lee la pantalla, siguiente pregunta o ve al inicio.";
export const UNSUPPORTED_BROWSER_MESSAGE =
  "Este navegador no reconoce la voz. Usa Google Chrome o Microsoft Edge, o escribe tu orden en el cuadro de texto.";

export const normalizeSpeech = (value: string) =>
  value
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¿?¡!.,;:"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const NUMBER_WORDS: Record<string, number> = {
  uno: 1, una: 1, primera: 1, primero: 1,
  dos: 2, segunda: 2, segundo: 2,
  tres: 3, tercera: 3, tercero: 3,
  cuatro: 4, cuarta: 4, cuarto: 4,
  cinco: 5, quinta: 5, quinto: 5,
  seis: 6, sexta: 6, sexto: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10,
};
const toNumber = (word: string) => Number(word) || NUMBER_WORDS[word] || 0;
const NUMBER = "(\\d+|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|primera|primero|segunda|segundo|tercera|tercero|cuarta|cuarto|quinta|quinto|sexta|sexto)";

// Frases de activación. El reconocimiento suele transcribir "Jason" como "yeison" o "jeison".
export const WAKE_PATTERN =
  /\b(?:ok|okey|oye|hey|hola|ey)\s+(?:jason|yeison|jeison|jaison|jayson|aula)\b\s*(.*)$/;

const GO = "(?:abre|abrir|ir a|ir al|ve a|ve al|vamos a|vamos al|llevame a|llevame al|quiero ir a|quiero ir al|entra a|entra al|entrar a|entrar al|muestrame|mostrar|pasa a|pasa al|regresa a|regresa al|volver a|volver al|vuelve a|vuelve al)";

const ROUTES: { pattern: RegExp; path: string; label: string }[] = [
  { pattern: /^(?:la )?(?:pagina de )?inicio$|^(?:la )?pagina principal$/, path: "/", label: "el inicio" },
  { pattern: /^(?:mi )?(?:ruta|panel(?: del estudiante)?|menu(?: principal)?|tablero)$/, path: "/dashboard", label: "tu ruta de aprendizaje" },
  { pattern: /^(?:el )?tutor(?: ia| de ia| inteligente)?$/, path: "/tutor", label: "el Tutor IA" },
  { pattern: /^(?:el )?(?:pretest|diagnostico|prueba inicial|evaluacion inicial)$/, path: "/diagnostico", label: "el pretest" },
  { pattern: /^(?:el )?(?:postest|evaluacion final|prueba final)$/, path: "/postest", label: "la evaluación final" },
  { pattern: /^(?:la )?(?:identificacion|ficha|registro)$/, path: "/identificacion", label: "la identificación" },
  { pattern: /^(?:el )?panel (?:docente|del docente|del profesor)$/, path: "/docente", label: "el panel docente" },
  { pattern: /^(?:el )?(?:area de )?consultas?$/, path: "/consultas", label: "el Área de consultas" },
  { pattern: /^(?:mis )?resultados$|^mi progreso$/, path: "/dashboard?tab=resultados", label: "tus resultados" },
];

export function interpretLocalCommand(
  text: string,
  options: { inQuestion?: boolean } = {}
): LocalCommand | null {
  const value = normalizeSpeech(text);
  if (!value) return null;

  // Privacidad: nada que mencione credenciales se procesa ni se envía a la IA.
  if (/\b(contrasena|password|clave secreta|mi clave|token)\b/.test(value))
    return {
      kind: "decline",
      message:
        "Por tu seguridad no leo, escribo ni envío contraseñas. Puedo enfocar el campo para que tú o una persona de confianza la escriba.",
    };

  if (/^(?:ok |oye |hey )?(?:jason |yeison )?(?:detener|desactivar|apagar|terminar|cerrar) (?:el )?asistente$|^deja de escuchar(?:me)?$|^(?:adios|chau|hasta luego)(?: jason| yeison)?$/.test(value))
    return { kind: "stop_assistant" };
  if (WAKE_PATTERN.test(value) && !WAKE_PATTERN.exec(value)?.[1]?.trim())
    return { kind: "wake" };
  if (/^(?:para|pausa|pausar|silencio|callate|detente|basta|alto|stop|deja de leer|deten la lectura|detener lectura)$/.test(value))
    return { kind: "pause" };
  if (/^(?:repite|repitelo|repetir|otra vez|que dijiste|puedes repetir)$/.test(value))
    return { kind: "repeat" };
  if (/^(?:lee|leer|leeme) (?:todo|toda la pantalla|todo el contenido)$|^lectura (?:completa|detallada)$|^describeme todo$/.test(value))
    return { kind: "read", full: true };
  if (/^(?:lee|leer|leeme) (?:la )?(?:pantalla|pagina)$|^(?:activa|activar|enciende) (?:el )?texto a voz$/.test(value))
    return { kind: "read", full: false };
  if (/(?:aumenta|aumentar|agranda|agrandar|sube|subir|mas grande).*(?:letra|texto)|letra mas grande/.test(value))
    return { kind: "text_size", direction: 1 };
  if (/(?:disminuye|disminuir|reduce|reducir|achica|baja|bajar).*(?:letra|texto)|letra mas pequena/.test(value))
    return { kind: "text_size", direction: -1 };
  if (/(?:habla|hablar|lee|leer)? ?mas (?:lento|despacio)$/.test(value))
    return { kind: "speech_rate", value: "slower" };
  if (/(?:habla|hablar|lee|leer)? ?mas rapido$/.test(value))
    return { kind: "speech_rate", value: "faster" };
  if (/^(?:velocidad normal|habla normal)$/.test(value))
    return { kind: "speech_rate", value: "normal" };
  if (/^(?:ayuda|que puedo decir|que puedo hacer|comandos|que comandos hay)$/.test(value))
    return { kind: "help" };
  if (/\bmodo simulacion\b/.test(value)) return { kind: "simulation" };

  if (options.inQuestion) {
    const option =
      value.match(/^(?:la )?(?:opcion|alternativa|letra|respuesta)? ?([abcd])$/) ??
      value.match(/(?:opcion|alternativa|letra|marca|marco|marcar|elijo|elige|selecciona|respondo|responde)(?: la)?(?: opcion| alternativa| letra)? ([abcd])\b/);
    if (option)
      return { kind: "select_option", letter: option[1].toUpperCase() as OptionLetter };
    const ordinal = value.match(/(?:elijo|elige|selecciona|marca|marco|responde|respondo|opcion|alternativa)(?: la)? (primera|segunda|tercera|cuarta)\b/);
    if (ordinal)
      return {
        kind: "select_option",
        letter: "ABCD"[toNumber(ordinal[1]) - 1] as OptionLetter,
      };
    if (/^(?:siguiente pregunta|pregunta siguiente|siguiente|proxima pregunta|avanza)$/.test(value))
      return { kind: "next_question" };
    if (/^(?:pregunta anterior|anterior pregunta|anterior|regresa a la pregunta anterior)$/.test(value))
      return { kind: "previous_question" };
    const question = value.match(new RegExp(`(?:ir a|ve a|pasa a|abre|responder|contestar)(?: la)? pregunta ${NUMBER}\\b`));
    if (question && toNumber(question[1]) > 0)
      return { kind: "go_to_question", index: toNumber(question[1]) - 1 };
    if (/^(?:lee|leer|leeme|repite|repetir)(?: otra vez)? la pregunta$|^(?:cual es )?la pregunta$/.test(value))
      return { kind: "read_question" };
  }

  if (/^(?:volver|regresar|atras|ve atras|vuelve atras|regresa)$/.test(value))
    return { kind: "back" };
  const moduleMatch = value.match(new RegExp(`^${GO}? ?(?:el )?modulo ${NUMBER}$`));
  if (moduleMatch) {
    const number = toNumber(moduleMatch[1]);
    if (number >= 1 && number <= 6)
      return { kind: "navigate", path: `/modulo/m${number}`, label: `el módulo ${number}` };
  }
  const go = value.match(new RegExp(`^${GO} (.+)$`));
  if (go) {
    const destination = go[1].replace(/^(?:la|el|los|las|mi|mis) /, "");
    const route = ROUTES.find(item => item.pattern.test(destination) || item.pattern.test(go[1]));
    if (route) return { kind: "navigate", path: route.path, label: route.label };
  }
  return null;
}
