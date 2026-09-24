// Protocolo entre el asistente de voz (navegador) y el agente de IA (servidor).
// El navegador describe la pantalla en una "fotografía" (PageSnapshot); el agente responde qué
// decir y qué acciones ejecutar sobre los elementos de esa fotografía, identificados por id.

export type AssistantMode = "learning" | "evaluation";

export type SnapshotElement = {
  /** Identificador estable dentro de la fotografía (por ejemplo "e12"). */
  id: string;
  /** Tipo de control: button, link, textbox, textarea, checkbox, radio, select, tab, option... */
  kind: string;
  label: string;
  /** Valor actual de campos de texto o listas (nunca se envía el de contraseñas). */
  value?: string;
  /** Estados relevantes: "marcado", "seleccionado", "deshabilitado", "pestaña activa"... */
  state?: string;
  href?: string;
  /** Contexto del control: la pregunta o sección a la que pertenece. */
  group?: string;
};

export type SnapshotTable = {
  caption: string;
  headers: string[];
  rows: string[][];
};

export type PageSnapshot = {
  route: string;
  title: string;
  mode: AssistantMode;
  headings: string[];
  /** Texto visible de la pantalla, recortado. */
  text: string;
  elements: SnapshotElement[];
  tables: SnapshotTable[];
  dialogs: string[];
  alerts: string[];
  focused?: string;
  /** Datos que la propia pantalla publica (pregunta actual, módulo, etc.). */
  screen?: {
    moduleTitle?: string;
    currentContent?: string;
    currentQuestion?: string;
    currentOptions?: string[];
    questionIndex?: number;
    totalQuestions?: number;
  };
};

export const AGENT_ACTION_TYPES = [
  "navigate",
  "click",
  "fill",
  "select",
  "scroll",
  "focus",
  "back",
  "read_page",
  "text_size",
  "speech_rate",
  "consult",
  "stop_assistant",
] as const;
export type AgentActionType = (typeof AGENT_ACTION_TYPES)[number];

export type AgentAction = {
  type: AgentActionType;
  /** Ruta (navigate), id de elemento (click, fill, select, focus, scroll) o "". */
  target: string;
  /** Texto a escribir, opción a elegir, pregunta a consultar, "up"/"down", etc. o "". */
  value: string;
};

export type AgentReply = {
  /** Lo que el asistente dice en voz alta. */
  speech: string;
  actions: AgentAction[];
  /** Si no está vacío, se pregunta esto antes de ejecutar las acciones (envíos, borrados...). */
  confirm: string;
  /** true si después de ejecutar las acciones necesita ver la nueva pantalla para seguir. */
  continue: boolean;
};

export type AgentTurn = { role: "user" | "assistant"; text: string };

/** Rutas de la aplicación que el agente puede abrir directamente. */
export const APP_ROUTES: { path: string; name: string; description: string }[] = [
  { path: "/", name: "Inicio", description: "Bienvenida y presentación de Aula IA." },
  {
    path: "/identificacion",
    name: "Identificación",
    description: "Ficha del estudiante: código, grado, sección y colegio.",
  },
  {
    path: "/diagnostico",
    name: "Pretest o diagnóstico",
    description: "Evaluación inicial de 10 preguntas (modo evaluación).",
  },
  {
    path: "/dashboard",
    name: "Mi ruta (panel del estudiante)",
    description:
      "Pestañas: Inicio, Módulos, Retos, Tutor IA, Consultas, Evaluación final, Resultados y Mi ficha.",
  },
  {
    path: "/modulo/m1",
    name: "Módulos 1 a 6",
    description: "Contenido de cada módulo: /modulo/m1 hasta /modulo/m6.",
  },
  {
    path: "/tutor",
    name: "Tutor IA",
    description: "El estudiante escribe su respuesta y recibe retroalimentación.",
  },
  {
    path: "/consultas",
    name: "Área de consultas",
    description:
      "Búsqueda en internet de temas relacionados con la capacitación, con fuentes.",
  },
  {
    path: "/postest",
    name: "Postest o evaluación final",
    description: "Evaluación final de 10 preguntas (modo evaluación).",
  },
  {
    path: "/docente",
    name: "Panel docente",
    description: "Acceso con usuario y contraseña para docentes: estudiantes y resultados.",
  },
];
