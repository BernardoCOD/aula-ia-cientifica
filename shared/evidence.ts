// Registro de evidencias del TIF (Fase 4): cada orden dicha o escrita al asistente se guarda como una
// interacción, sin audio, con los indicadores de la ficha de observación.

/** Quién resolvió la orden. */
export const RECOGNIZED_BY = [
  "local", // comando instantáneo del navegador, sin IA
  "ia", // la interpretó el modelo de lenguaje (Gemini)
  "codigo", // código de participante dictado en el ingreso
  "confirmacion", // respuesta sí o no a una confirmación
  "no_entendido", // no se entendió (por ejemplo, ni sí ni no ante una confirmación)
  "ia_no_disponible", // la orden necesitaba la IA y no estaba disponible
] as const;
export type RecognizedBy = (typeof RECOGNIZED_BY)[number];

export const RECOGNIZED_BY_LABELS: Record<RecognizedBy, string> = {
  local: "Comando local",
  ia: "IA (Gemini)",
  codigo: "Código de participante",
  confirmacion: "Confirmación sí/no",
  no_entendido: "No entendido",
  ia_no_disponible: "IA no disponible",
};

/** Una orden cuenta como reconocida si el asistente la entendió y pudo atenderla. */
export const isRecognized = (recognizedBy: RecognizedBy, intent: string) =>
  recognizedBy !== "no_entendido" && recognizedBy !== "ia_no_disponible" && intent !== "error";

/** Pedir ayuda o que repita cuenta como "necesitó ayuda". */
export const HELP_INTENTS = ["help", "repeat"];

const TASKS: [RegExp, string][] = [
  [/^codigo_dictado$/, "Ingresar con código"],
  [/^confirmar_/, "Confirmar o cancelar una acción"],
  [/^select_option$/, "Responder evaluación"],
  [/^submit_evaluation$/, "Enviar evaluación"],
  [/^(?:next_question|previous_question|go_to_question|read_question|read_question_text|read_options|read_option|evaluation_progress)$/, "Recorrer la evaluación"],
  [/^(?:navigate|back)$/, "Navegar entre pantallas"],
  [/^(?:focus_next|focus_previous|activate_focused)$/, "Recorrer y activar controles"],
  [/^(?:read|repeat)$/, "Leer la pantalla"],
  [/^(?:text_size|speech_rate)$/, "Ajustar la configuración"],
  [/^help$/, "Pedir ayuda"],
  [/^(?:pause|stop_assistant|wake|simulation)$/, "Controlar el asistente"],
  [/^decline$/, "Protección de privacidad"],
  [/(?:^|,)consult(?:,|$)/, "Consulta en internet"],
  [/(?:^|,)(?:fill|select|click|focus|scroll)(?:,|$)/, "Actuar sobre la pantalla"],
  [/(?:^|,)navigate(?:,|$)/, "Navegar entre pantallas"],
  [/(?:^|,)(?:text_size|speech_rate)(?:,|$)/, "Ajustar la configuración"],
  [/(?:^|,)read_page(?:,|$)/, "Leer la pantalla"],
  [/(?:^|,)stop_assistant(?:,|$)/, "Controlar el asistente"],
  [/^respuesta$/, "Pregunta a la IA"],
];

/**
 * Tarea de la ficha de observación según la intención: el nombre del comando local
 * ("select_option") o las acciones que eligió la IA ("navigate,click"; "respuesta" si solo respondió).
 */
export function taskFor(intent: string): string {
  return TASKS.find(([pattern]) => pattern.test(intent))?.[1] ?? "Otra";
}

/** Privacidad: lo que mencione contraseñas o claves no se guarda. */
export function redactHeard(text: string): string {
  const normalized = text
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return /\b(contrasena|password|clave secreta|mi clave|token)\b/.test(normalized)
    ? "[omitido por privacidad]"
    : text;
}
