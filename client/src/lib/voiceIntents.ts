// Contrato cerrado de intenciones. La IA interpreta lenguaje natural; la interfaz
// ejecuta únicamente una intención segura y conocida.
export type VoiceIntent =
  | "NAVIGATE_HOME"
  | "NAVIGATE_MODULE"
  | "NAVIGATE_PRETEST"
  | "NAVIGATE_POSTEST"
  | "NAVIGATE_TUTOR"
  | "NAVIGATE_IDENTIFICATION"
  | "NAVIGATE_TEACHER"
  | "OPEN_MENU"
  | "OPEN_RESULTS"
  | "NEXT_CONTENT"
  | "PREVIOUS_CONTENT"
  | "GO_TO_QUESTION"
  | "REPEAT_CONTENT"
  | "READ_SCREEN"
  | "READ_SCREEN_FULL"
  | "READ_CONTENT"
  | "EXPLAIN_CONTENT"
  | "SIMPLIFY_EXPLANATION"
  | "START_ACTIVITY"
  | "SELECT_OPTION"
  | "WRITE_TEXT"
  | "FILL_FORM"
  | "LIST_CONTROLS"
  | "ACTIVATE_CONTROL"
  | "ACTIVATE_ASSISTANT"
  | "STOP_ASSISTANT"
  | "FOCUS_NEXT"
  | "FOCUS_PREVIOUS"
  | "ACTIVATE_FOCUSED"
  | "TEXT_SCALE_UP"
  | "TEXT_SCALE_DOWN"
  | "PAUSE"
  | "RESUME"
  | "GO_BACK"
  | "HELP"
  | "CURRENT_MODULE"
  | "CURRENT_CONTENT"
  | "LIST_MODULES"
  | "START_LEARNING"
  | "CONFIRM_LOGOUT"
  | "TOGGLE_SIMULATION"
  | "DECLINE"
  | "UNKNOWN";

export type AssistantMode = "learning" | "evaluation";
export type IntentResult = {
  intent: VoiceIntent;
  moduleNumber: number;
  optionLetter: "A" | "B" | "C" | "D" | "";
  message: string;
  value?: string;
  controlTarget?: string;
  questionIndex?: number;
  fields?: Record<string, string>;
  /** Certeza estimada de la interpretación (0 a 1). Los comandos locales deterministas usan valores altos; la IA estima la suya. */
  confidence?: number;
};

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
  onSelectOption?: (letter: "A" | "B" | "C" | "D") => void;
  onStartActivity?: () => void;
  onSelectTab?: (tab: string) => void;
};

export const HELP_MESSAGE =
  "Puedes decir: abrir Tutor IA, comenzar capacitación, abrir módulo dos, abrir pretest, abrir postest, ver resultados, qué módulos hay, activar texto a voz, lee todo para una lectura detallada, responder pregunta dos, qué botones hay, presiona continuar, enfoca siguiente control, aumentar letra o volver. Presiona Espacio para iniciar la conversación; cuando termine, di OK Jason o Hey Jason para reactivarla. Di detener asistente para terminar.";
export const NOT_UNDERSTOOD_MESSAGE =
  "No logré entenderte. Puedes decir: lee la pantalla, continuar, volver al inicio o qué puedo hacer.";
export const RECOGNITION_ERROR_MESSAGE =
  "Parece que no pude reconocer tu voz. Puedes intentarlo nuevamente o utilizar el teclado.";
export const AI_ERROR_MESSAGE =
  "El asistente inteligente no está disponible ahora. Puedes continuar con el teclado, los enlaces o el lector de pantalla.";
export const UNSUPPORTED_BROWSER_MESSAGE =
  "Tu navegador no admite reconocimiento de voz. Puedes escribir el comando o usar el teclado y los enlaces de la pantalla.";

const normalize = (value: string) =>
  value.toLocaleLowerCase("es").normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const numberWords: Record<string, number> = {
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
};
const questionNumber = (value: string) =>
  Number(value) || numberWords[value] || 0;

/** Comandos deterministas: mantienen usable la app aunque la IA o internet fallen. */
export function interpretLocalCommand(text: string): IntentResult | null {
  const value = normalize(text);
  const rawText = text.trim();
  // Los comandos deterministas reconocidos por patrón son de alta confianza; los que dependen
  // de un nombre libre dictado por la persona (botón, campo) son algo menos seguros.
  const result = (
    intent: VoiceIntent,
    message: string,
    extra: Partial<IntentResult> = {}
  ): IntentResult => ({
    intent,
    moduleNumber: 0,
    optionLetter: "",
    message,
    confidence: 0.95,
    ...extra,
  });
  if (
    /(contraseña|contrasena|clave|password|token|codigo de acceso)/.test(value)
  )
    return result(
      "DECLINE",
      "No puedo leer, repetir ni procesar credenciales. Puedes pedirme que enfoque el campo correspondiente."
    );
  if (
    /(modo simulacion|modo simulación|simular acciones|activar simulacion|activar simulación|desactivar simulacion|desactivar simulación)/.test(
      value
    )
  )
    return result("TOGGLE_SIMULATION", "Cambiaré el modo simulación.");
  if (
    /(activar asistente|hablar con ia|oye aula ia|ok yeison|hey yeison|oye yeison|ok jason|hey jason|oye jason|modo conversacion|modo conversación)/.test(
      value
    )
  )
    return result("ACTIVATE_ASSISTANT", "Asistente conversacional activado.");
  if (
    /(desactivar asistente|detener conversacion|detener conversación|silenciar asistente)/.test(
      value
    )
  )
    return result("STOP_ASSISTANT", "Modo conversacional desactivado.");
  if (
    /(tutor ia|tutor inteligente|tutor de ia|ayuda personalizada|retroalimentacion|retroalimentación)/.test(
      value
    )
  )
    return result("NAVIGATE_TUTOR", "Abriré el Tutor IA.");
  if (
    /(identificarme|identificacion|identificación|registrarme|datos del estudiante)/.test(
      value
    )
  )
    return result(
      "NAVIGATE_IDENTIFICATION",
      "Abriré la identificación del estudiante."
    );
  if (/(panel docente|vista docente|espacio del profesor)/.test(value))
    return result("NAVIGATE_TEACHER", "Abriré el panel docente.");
  if (
    /(que modulos hay|qué módulos hay|lista de modulos|lista de módulos|mis modulos|mis módulos)/.test(
      value
    )
  )
    return result("LIST_MODULES", "Te diré los módulos disponibles.");
  if (
    /(pregunta siguiente|siguiente pregunta|avanza a la siguiente pregunta)/.test(
      value
    )
  )
    return result("NEXT_CONTENT", "Iré a la siguiente pregunta.");
  if (
    /(pregunta anterior|anterior pregunta|vuelve a la pregunta anterior)/.test(
      value
    )
  )
    return result("PREVIOUS_CONTENT", "Volveré a la pregunta anterior.");
  const questionMatch = value.match(
    /(?:responder|responde|contestar|contesta|ir a|ve a|pasar a|abrir)\s+(?:la\s+)?pregunta\s+(\d+|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)/
  );
  if (questionMatch) {
    const number = questionNumber(questionMatch[1]);
    return number > 0
      ? result("GO_TO_QUESTION", `Iré a la pregunta ${number}.`, {
          questionIndex: number - 1,
        })
      : null;
  }
  const spokenOption = rawText.match(
    /(?:responde|elige|selecciona)\s+(?:la\s+)?(?:opcion|opción|alternativa)?\s*(primera|segunda|tercera|cuarta|[abcd])\b/i
  );
  if (spokenOption) {
    const letter =
      (
        { primera: "A", segunda: "B", tercera: "C", cuarta: "D" } as Record<
          string,
          string
        >
      )[spokenOption[1].toLowerCase()] ?? spokenOption[1].toUpperCase();
    return result("SELECT_OPTION", `Seleccionaré la opción ${letter}.`, {
      optionLetter: letter as "A" | "B" | "C" | "D",
    });
  }
  const targetedWrite = rawText.match(
    /en\s+(?:el|la)\s+(?:apartado|campo|seccion|sección)(?:\s+de)?\s+(.+?)\s+(?:escribe|escribir|responde|responder|contesta|contestar|rellena|rellenar)\s+(.+)$/i
  );
  if (targetedWrite)
    return result("WRITE_TEXT", `Escribiré en ${targetedWrite[1].trim()}.`, {
      controlTarget: targetedWrite[1].trim(),
      value: targetedWrite[2].trim(),
      confidence: 0.85,
    });
  const completeMatch = rawText.match(
    /completa(?:r)?\s+estudiante\s+(.+?)(?:\s+colegio\s+(.+))?$/i
  );
  if (completeMatch)
    return result("FILL_FORM", "Completaré los campos permitidos.", {
      fields: {
        student: completeMatch[1].trim(),
        ...(completeMatch[2] ? { school: completeMatch[2].trim() } : {}),
      },
      confidence: 0.85,
    });
  const writeMatch = rawText.match(
    /(?:escribe|escribir|dicta|dictar|responde|responder|contesta|contestar|rellena|rellenar)\s+(.+)/i
  );
  if (writeMatch)
    return result("WRITE_TEXT", "Escribiré el texto en el campo activo.", {
      value: writeMatch[1].trim(),
      confidence: 0.8,
    });
  if (
    /(que botones hay|qué botones hay|que controles hay|qué controles hay|leer botones|leer controles)/.test(
      value
    )
  )
    return result(
      "LIST_CONTROLS",
      "Te diré los botones y controles disponibles."
    );
  if (/^(pausa|silencio|deten|detener|para la lectura)/.test(value))
    return result("PAUSE", "Lectura pausada.");
  if (/(continua leyendo|reanuda|reanudar lectura|sigue leyendo)/.test(value))
    return result("RESUME", "Continúo leyendo.");
  if (
    /(lee todo|leelo todo|léelo todo|leer todo|lectura completa|lectura detallada|describe todo|describeme todo|descríbeme todo)/.test(
      value
    )
  )
    return result(
      "READ_SCREEN_FULL",
      "Te daré una lectura detallada y completa de esta pantalla."
    );
  if (
    /(lee|leer|activa|activar|enciende|encender)\s*(en voz alta|texto a voz|lectura|la lectura|la pantalla|la pagina|la página)?|que hay en pantalla/.test(
      value
    )
  )
    return result(
      "READ_SCREEN",
      "Leeré la información relevante de esta pantalla."
    );
  if (/(desactivar lectura|silencio|detener lectura)/.test(value))
    return result("PAUSE", "Lectura pausada.");
  if (/(donde estoy|en que pantalla|ubicacion|ubicación)/.test(value))
    return result("CURRENT_CONTENT", "Voy a decirte dónde estás.");
  if (/(que puedo hacer|qué puedo hacer|ayuda|comandos)/.test(value))
    return result("HELP", HELP_MESSAGE);
  if (/^(repetir|repite|otra vez)/.test(value))
    return result("REPEAT_CONTENT", "Repetiré la información anterior.");
  if (
    /(aumentar|aumenta|agrandar|grande).*(letra|texto)|letra mas grande/.test(
      value
    )
  )
    return result("TEXT_SCALE_UP", "Aumentaré el tamaño del texto.");
  if (
    /(disminuir|disminuye|reducir|pequena|pequeña).*(letra|texto)|letra mas pequena/.test(
      value
    )
  )
    return result("TEXT_SCALE_DOWN", "Disminuiré el tamaño del texto.");
  if (/(enfoca|enfocar|siguiente control|siguiente elemento)/.test(value))
    return result("FOCUS_NEXT", "Enfocaré el siguiente control.");
  if (/(control anterior|elemento anterior|enfoca anterior)/.test(value))
    return result("FOCUS_PREVIOUS", "Enfocaré el control anterior.");
  if (
    /(activar|presionar|seleccionar|elegir) (el )?(control|boton|botón|enlace) actual|activar/.test(
      value
    )
  )
    return result("ACTIVATE_FOCUSED", "Activaré el control enfocado.");
  if (/(opcion|opción|alternativa)\s*([abcd])\b/.test(value))
    return result("SELECT_OPTION", "Registraré la opción que indicaste.", {
      optionLetter: value
        .match(/(?:opcion|opción|alternativa)\s*([abcd])\b/)?.[1]
        .toUpperCase() as "A" | "B" | "C" | "D",
    });
  const moduleMatch = value.match(
    /(?:modulo|módulo)\s*(\d|uno|una|dos|tres|cuatro|cinco|seis)/
  );
  if (moduleMatch) {
    const moduleNumber =
      Number(moduleMatch[1]) || numberWords[moduleMatch[1]] || 0;
    return result("NAVIGATE_MODULE", `Abriré el módulo ${moduleNumber}.`, {
      moduleNumber,
    });
  }
  const activateMatch = value.match(
    /(?:presiona|presionar|pulsa|pulsar|activa|activar|abre|abrir)\s+(?:el|la)?\s*(boton|botón|enlace)?\s*(.+)$/
  );
  if (activateMatch && activateMatch[2])
    return result("ACTIVATE_CONTROL", `Buscaré ${activateMatch[2].trim()}.`, {
      controlTarget: activateMatch[2].trim(),
      confidence: 0.8,
    });
  if (/(pretest|diagnostico|diagnóstico|prueba inicial)/.test(value))
    return result("NAVIGATE_PRETEST", "Abriré el diagnóstico inicial.");
  if (/(postest|evaluacion final|evaluación final|prueba final)/.test(value))
    return result("NAVIGATE_POSTEST", "Abriré la evaluación final.");
  if (/(resultado|progreso|avance)/.test(value))
    return result("OPEN_RESULTS", "Abriré tus resultados y progreso.");
  if (/(menu|menú|panel principal|mi ruta)/.test(value))
    return result("OPEN_MENU", "Abriré el menú principal.");
  if (/(inicio|página principal|pagina principal|home)/.test(value))
    return result("NAVIGATE_HOME", "Volveré al inicio.");
  if (/(volver|regresar|atrás|atras)/.test(value))
    return result("GO_BACK", "Volveré a la pantalla anterior.");
  if (/(continuar|siguiente|avanzar|sigue)/.test(value))
    return result("NEXT_CONTENT", "Continuaré con el siguiente paso.");
  if (/(anterior|retroceder)/.test(value))
    return result("PREVIOUS_CONTENT", "Volveré al paso anterior.");
  if (
    /(estudiar|comenzar capacitacion|comenzar capacitación|quiero aprender)/.test(
      value
    )
  )
    return result("START_LEARNING", "Abriré tu capacitación.");
  if (/(salir|cerrar sesion|cerrar sesión)/.test(value))
    return result(
      "CONFIRM_LOGOUT",
      "Puedo ayudarte a cerrar sesión. Confirma diciendo: confirmar salida."
    );
  if (/confirmar salida/.test(value))
    return result(
      "CONFIRM_LOGOUT",
      "La salida debe confirmarse desde el botón de la pantalla por seguridad."
    );
  return null;
}
