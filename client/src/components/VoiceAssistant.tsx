import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useLocation } from "wouter";
import {
  Accessibility,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  HelpCircle,
  Keyboard,
  Loader2,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Volume2,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAssistantContext } from "@/contexts/AssistantContext";
import { useSpeech } from "@/hooks/useSpeech";
import { modules } from "@/lib/student";
import {
  AI_ERROR_MESSAGE,
  HELP_MESSAGE,
  NOT_UNDERSTOOD_MESSAGE,
  UNSUPPORTED_BROWSER_MESSAGE,
  interpretLocalCommand,
  type AssistantScreenContext,
  type IntentResult,
  type VoiceIntent,
} from "@/lib/voiceIntents";

const STATUS_LABEL: Record<string, string> = {
  idle: "Listo para ayudarte.",
  listening: "Estoy escuchando…",
  processing: "Procesando…",
  speaking: "Estoy leyendo…",
  error: "Revisa el micrófono o utiliza el teclado.",
};
const textSizeKey = "aula-ia-text-size";

// Intenciones que cambian de pantalla, escriben datos o activan controles: son las únicas
// que el modo simulación intercepta. Leer, listar o pedir ayuda siempre se ejecuta de verdad.
const MUTATING_INTENTS = new Set<VoiceIntent>([
  "NAVIGATE_HOME",
  "NAVIGATE_MODULE",
  "NAVIGATE_PRETEST",
  "NAVIGATE_POSTEST",
  "NAVIGATE_TUTOR",
  "NAVIGATE_IDENTIFICATION",
  "NAVIGATE_TEACHER",
  "OPEN_MENU",
  "OPEN_RESULTS",
  "GO_BACK",
  "START_LEARNING",
  "START_ACTIVITY",
  "NEXT_CONTENT",
  "PREVIOUS_CONTENT",
  "GO_TO_QUESTION",
  "SELECT_OPTION",
  "WRITE_TEXT",
  "FILL_FORM",
  "ACTIVATE_CONTROL",
  "ACTIVATE_FOCUSED",
  "CONFIRM_LOGOUT",
]);

type SimulationEntry = {
  received: string;
  context: string;
  intent: string;
  confidence: number;
  target: string;
  action: string;
  validation: string;
  execution: string;
};

const normalizeSpeech = (text: string) =>
  text.toLocaleLowerCase("es").normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

function visibleControls() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      "button, a, input, select, textarea, [tabindex]:not([tabindex='-1'])"
    )
  ).filter(
    element =>
      !element.closest("[data-voice-assistant]") &&
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.offsetParent !== null
  );
}

function fieldName(element: HTMLElement) {
  const label = element.closest("label")?.textContent?.trim();
  return (
    element.getAttribute("aria-label") ||
    element.getAttribute("placeholder") ||
    element.getAttribute("name") ||
    label ||
    ""
  ).toLocaleLowerCase("es");
}

function setFieldValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
) {
  if (
    (element instanceof HTMLInputElement && element.type === "password") ||
    /contraseña|contrasena|password|clave/.test(fieldName(element))
  )
    return false;
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.focus();
  return true;
}

function findField(kind: "student" | "school") {
  return Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "main input, main textarea"
    )
  ).find(element => {
    const name = fieldName(element);
    return kind === "student"
      ? /estudiante|codigo|código/.test(name)
      : /colegio|escuela/.test(name);
  });
}

function findNamedField(target: string) {
  const normalized = target.toLocaleLowerCase("es");
  return Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "main input, main textarea"
    )
  ).find(
    element =>
      fieldName(element).includes(normalized) ||
      (normalized.includes("colegio") &&
        /colegio|escuela/.test(fieldName(element))) ||
      (normalized.includes("respuesta") &&
        /respuesta|intento/.test(fieldName(element)))
  );
}

function controlsSummary() {
  return visibleControls()
    .map(
      (element, index) =>
        `${index + 1}. ${element.getAttribute("aria-label") || element.textContent?.trim() || element.getAttribute("placeholder") || fieldName(element) || "control sin nombre"}`
    )
    .slice(0, 20)
    .join(". ");
}

/** Localiza un control visible por nombre, sin ejecutar ninguna acción sobre él (usado también por el modo simulación). */
function locateNamedControl(target: string) {
  const normalized = target.toLocaleLowerCase("es");
  return visibleControls().find(element =>
    (
      element.getAttribute("aria-label") ||
      element.textContent ||
      element.getAttribute("title") ||
      ""
    )
      .toLocaleLowerCase("es")
      .includes(normalized)
  );
}

function controlLabel(element: HTMLElement, fallback: string) {
  return (
    element.getAttribute("aria-label") ||
    element.textContent?.trim() ||
    fallback
  );
}

/** Un enlace interno que probablemente navegue a otra ruta: permite verificar después que la pantalla cambió. */
function isNavigationControl(element: HTMLElement) {
  return (
    element instanceof HTMLAnchorElement &&
    (element.getAttribute("href") || "").startsWith("/")
  );
}

/** Controles cuya activación no debe ejecutarse sin una confirmación explícita: envíos, publicaciones o eliminaciones. */
function isRiskyControl(element: HTMLElement) {
  if (element instanceof HTMLButtonElement && element.type === "submit")
    return true;
  const signal =
    `${element.getAttribute("data-ai-action") || ""} ${element.getAttribute("aria-label") || ""} ${element.textContent || ""}`.toLocaleLowerCase(
      "es"
    );
  return /(enviar|publicar|eliminar|borrar|delete|submit|send|compartir|descargar|ejecutar|guardar evaluaci)/.test(
    signal
  );
}

function screenSummary(context: AssistantScreenContext) {
  const main = document.querySelector("main");
  const title = main?.querySelector("h1")?.textContent?.trim();
  const description = main
    ?.querySelector("h1 + p, h1 ~ p")
    ?.textContent?.trim();
  const controls = Array.from(
    main?.querySelectorAll<HTMLElement>("button, a, input, select, textarea") ??
      []
  )
    .slice(0, 12)
    .map(
      element =>
        element.getAttribute("aria-label") ||
        element.textContent?.trim() ||
        element.getAttribute("placeholder") ||
        element.getAttribute("name")
    )
    .filter(Boolean);
  const contextText = context.currentQuestion
    ? `${context.currentQuestion}. Alternativas: ${(context.currentOptions ?? []).map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join(". ")}`
    : context.currentContent;
  return [
    title && `Título: ${title}`,
    description && `Descripción: ${description}`,
    contextText && `Contenido principal: ${contextText}`,
    controls.length && `Controles disponibles: ${controls.join(", ")}`,
    context.route && `Ubicación: ${context.route}`,
  ]
    .filter(Boolean)
    .join(". ")
    .slice(0, 1800);
}

/**
 * Lectura detallada y jerárquica ("lee todo"): a diferencia de screenSummary (resumen breve,
 * usado por defecto), recorre encabezados, pestañas, menús, diálogos, errores, estados de
 * carga, el elemento enfocado y la lista completa de controles.
 */
function screenSummaryDetailed(context: AssistantScreenContext) {
  const main = document.querySelector("main");
  const headings = Array.from(
    main?.querySelectorAll<HTMLElement>("h1, h2, h3") ?? []
  )
    .map(heading => heading.textContent?.trim())
    .filter(Boolean);
  const tabs = Array.from(
    document.querySelectorAll<HTMLElement>("[role='tab']")
  ).map(
    tab =>
      `${tab.textContent?.trim() ?? ""}${tab.getAttribute("aria-selected") === "true" ? " (activa)" : ""}`
  );
  const menus = Array.from(document.querySelectorAll<HTMLElement>("nav")).map(
    nav => nav.getAttribute("aria-label") || "menú de navegación"
  );
  const dialogs = Array.from(
    document.querySelectorAll<HTMLElement>("[role='dialog']")
  )
    .map(
      dialog =>
        dialog.getAttribute("aria-label") ||
        dialog.textContent?.trim()?.slice(0, 140)
    )
    .filter(Boolean);
  const errors = Array.from(
    document.querySelectorAll<HTMLElement>(
      "[role='alert'], [aria-invalid='true']"
    )
  )
    .map(error => error.textContent?.trim())
    .filter(Boolean);
  const loading = Array.from(
    document.querySelectorAll<HTMLElement>("[aria-busy='true']")
  )
    .map(element => element.getAttribute("aria-label") || "sección cargando")
    .filter(Boolean);
  const focused =
    document.activeElement instanceof HTMLElement &&
    document.activeElement !== document.body &&
    !document.activeElement.closest("[data-voice-assistant]")
      ? controlLabel(document.activeElement, "")
      : "";
  const controls = controlsSummary();
  const contextText = context.currentQuestion
    ? `Pregunta actual: ${context.currentQuestion}. Alternativas: ${(context.currentOptions ?? []).map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join(". ")}`
    : context.currentContent;
  const parts = [
    headings.length ? `Encabezados en orden: ${headings.join(". ")}` : null,
    tabs.length ? `Pestañas: ${tabs.join(", ")}` : null,
    menus.length ? `Menús disponibles: ${menus.join(", ")}` : null,
    dialogs.length ? `Diálogos abiertos: ${dialogs.join(". ")}` : null,
    errors.length ? `Mensajes de error visibles: ${errors.join(". ")}` : null,
    loading.length ? `Contenido cargando: ${loading.join(". ")}` : null,
    focused ? `Elemento actualmente enfocado: ${focused}.` : null,
    contextText ? `Contenido principal: ${contextText}` : null,
    controls ? `Todos los controles disponibles, en orden: ${controls}` : null,
  ].filter(Boolean);
  return parts.length
    ? parts.join(". ").slice(0, 3600)
    : "No encontré más detalle para leer en esta pantalla.";
}

/** Describe en español lo que HARÍA la acción, usado únicamente por el modo simulación (nunca se ejecuta). */
function describeProposedAction(result: IntentResult): string {
  switch (result.intent) {
    case "NAVIGATE_HOME":
      return "Volvería a la pantalla de inicio.";
    case "NAVIGATE_MODULE":
      return `Abriría el módulo ${result.moduleNumber}.`;
    case "NAVIGATE_PRETEST":
      return "Abriría el diagnóstico inicial.";
    case "NAVIGATE_POSTEST":
      return "Abriría la evaluación final.";
    case "NAVIGATE_TUTOR":
      return "Abriría el Tutor IA.";
    case "NAVIGATE_IDENTIFICATION":
      return "Abriría la identificación del estudiante.";
    case "NAVIGATE_TEACHER":
      return "Abriría el panel docente.";
    case "OPEN_MENU":
      return "Abriría el menú principal.";
    case "OPEN_RESULTS":
      return "Abriría tus resultados y progreso.";
    case "GO_BACK":
      return "Volvería a la pantalla anterior.";
    case "START_LEARNING":
      return "Abriría la capacitación.";
    case "START_ACTIVITY":
    case "NEXT_CONTENT":
      return "Avanzaría al siguiente contenido.";
    case "PREVIOUS_CONTENT":
      return "Volvería al contenido anterior.";
    case "GO_TO_QUESTION":
      return `Iría a la pregunta ${(result.questionIndex ?? 0) + 1}.`;
    case "SELECT_OPTION":
      return `Seleccionaría la opción ${result.optionLetter}.`;
    case "WRITE_TEXT":
      return `Escribiría "${result.value ?? ""}" en el campo correspondiente.`;
    case "FILL_FORM":
      return "Completaría los campos permitidos del formulario.";
    case "ACTIVATE_CONTROL":
      return `Activaría el control "${result.controlTarget ?? ""}".`;
    case "ACTIVATE_FOCUSED":
      return "Activaría el control actualmente enfocado.";
    case "CONFIRM_LOGOUT":
      return "Cerraría la sesión.";
    default:
      return "Ejecutaría la acción solicitada.";
  }
}

export function VoiceAssistant() {
  const [, navigate] = useLocation();
  const { screenContext, handlersRef } = useAssistantContext();
  const speech = useSpeech();
  const interpret = trpc.assistant.interpretIntent.useMutation();
  const [open, setOpen] = useState(false);
  const [lastResponse, setLastResponse] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [typedCommand, setTypedCommand] = useState("");
  const [conversationMode, setConversationMode] = useState(false);
  const [wakeListening, setWakeListening] = useState(false);
  const [microphoneArmed, setMicrophoneArmed] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulationEntry, setSimulationEntry] =
    useState<SimulationEntry | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    description: string;
    execute: () => void;
  } | null>(null);
  const [history, setHistory] = useState<{ you: string; assistant: string }[]>(
    []
  );
  const lastSpokenRef = useRef("");
  const lastRawTextRef = useRef("");
  const conversationModeRef = useRef(false);
  const simulationModeRef = useRef(false);
  const pendingConfirmationRef = useRef<typeof pendingConfirmation>(null);
  const sendCommandRef = useRef<(text: string) => void>(() => undefined);
  const handleMicPressRef = useRef<() => void>(() => undefined);
  const startWakeListeningRef = useRef<() => void>(() => undefined);
  const startConversationListeningRef = useRef<() => void>(() => undefined);
  const currentRouteRef = useRef<string | undefined>(screenContext.route);
  const previousRouteRef = useRef<string | undefined>(undefined);
  const mountedRouteRef = useRef(false);
  const listModulesMessage = `Los módulos disponibles son: ${modules.map((module, index) => `${index + 1}. ${module.title}`).join(". ")}.`;

  useEffect(() => {
    const saved = Number(localStorage.getItem(textSizeKey) || "100");
    document.documentElement.style.fontSize = `${saved}%`;
  }, []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      const isSingleKeyMicShortcut =
        event.code === "Space" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        !typing;
      const isPrimaryShortcut =
        event.ctrlKey &&
        event.shiftKey &&
        (event.code === "Space" || event.key === " ");
      const isLegacyShortcut =
        event.altKey && event.shiftKey && event.key.toLowerCase() === "v";
      if (isSingleKeyMicShortcut || isPrimaryShortcut || isLegacyShortcut) {
        event.preventDefault();
        if (isSingleKeyMicShortcut) startConversationListeningRef.current();
        else handleMicPressRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  useEffect(() => {
    simulationModeRef.current = simulationMode;
  }, [simulationMode]);
  useEffect(() => {
    pendingConfirmationRef.current = pendingConfirmation;
  }, [pendingConfirmation]);
  useEffect(() => {
    currentRouteRef.current = screenContext.route;
  }, [screenContext.route]);

  const announce = useCallback(
    (text: string) => {
      if (!text) return;
      lastSpokenRef.current = text;
      setLastResponse(text);
      setHistory(previous => [
        ...previous.slice(-4),
        {
          you: lastRawTextRef.current || "(acción de la interfaz)",
          assistant: text,
        },
      ]);
      speech.speak(text);
    },
    [speech]
  );

  // Detección de cambios: cuando la ruta publicada por la pantalla realmente cambia (navegación
  // por voz, clic o teclado), anuncia el nuevo título y lo lee, sin releer todo el DOM de nuevo.
  useEffect(() => {
    if (!mountedRouteRef.current) {
      mountedRouteRef.current = true;
      previousRouteRef.current = screenContext.route;
      return;
    }
    if (
      !screenContext.route ||
      screenContext.route === previousRouteRef.current
    )
      return;
    previousRouteRef.current = screenContext.route;
    const timer = window.setTimeout(() => {
      const title = document.querySelector("main h1")?.textContent?.trim();
      const parts = [
        title && `Cambiaste a la pantalla: ${title}.`,
        screenContext.currentContent,
      ].filter(Boolean) as string[];
      if (parts.length) announce(parts.join(" "));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [screenContext, announce]);

  const changeTextSize = useCallback(
    (direction: 1 | -1) => {
      const current = Number(localStorage.getItem(textSizeKey) || "100");
      const next = Math.min(140, Math.max(90, current + direction * 10));
      localStorage.setItem(textSizeKey, String(next));
      document.documentElement.style.fontSize = `${next}%`;
      announce(`Tamaño de texto: ${next} por ciento.`);
    },
    [announce]
  );
  const focusControl = useCallback(
    (direction: 1 | -1) => {
      const controls = visibleControls();
      const current = document.activeElement as HTMLElement | null;
      const index = Math.max(0, current ? controls.indexOf(current) : -1);
      const next =
        controls[(index + direction + controls.length) % controls.length];
      next?.focus();
      announce(
        next
          ? `Enfocado: ${next.getAttribute("aria-label") || next.textContent?.trim() || next.getAttribute("placeholder") || "control"}.`
          : "No encontré controles disponibles."
      );
    },
    [announce]
  );

  const toggleSimulation = useCallback(() => {
    setSimulationMode(previous => {
      const next = !previous;
      if (!next) setSimulationEntry(null);
      announce(
        next
          ? "Modo simulación activado. Describiré lo que haría sin hacer clic, navegar ni modificar datos reales. Di modo simulación otra vez para desactivarlo."
          : "Modo simulación desactivado. Las acciones volverán a ejecutarse normalmente."
      );
      return next;
    });
  }, [announce]);

  // Activa (foco + clic) un control ya localizado y, si es un enlace de navegación interna,
  // verifica tras un breve margen que la pantalla realmente cambió antes de darlo por hecho.
  const performActivation = useCallback(
    (element: HTMLElement, label: string) => {
      element.focus();
      element.click();
      if (isNavigationControl(element)) {
        const capturedRoute = currentRouteRef.current;
        window.setTimeout(() => {
          if (currentRouteRef.current === capturedRoute)
            announce(
              `Presioné ${label}, pero todavía no detecto un cambio de pantalla. Puedes decir "qué botones hay" para confirmar el nombre exacto o inténtalo de nuevo.`
            );
        }, 1200);
      }
      return `Activé ${label}.`;
    },
    [announce]
  );

  const runIntent = useCallback(
    (result: IntentResult) => {
      if (result.intent === "TOGGLE_SIMULATION") {
        toggleSimulation();
        return;
      }

      if (
        screenContext.mode === "evaluation" &&
        (result.intent === "WRITE_TEXT" || result.intent === "FILL_FORM")
      ) {
        announce(
          "Durante la evaluación solo puedo leer, seleccionar alternativas y avanzar. No puedo escribir respuestas por ti."
        );
        return;
      }

      if (simulationModeRef.current && MUTATING_INTENTS.has(result.intent)) {
        const located =
          result.intent === "ACTIVATE_CONTROL" && result.controlTarget
            ? locateNamedControl(result.controlTarget)
            : null;
        const target =
          result.controlTarget ||
          result.value ||
          result.optionLetter ||
          (result.moduleNumber
            ? `módulo ${result.moduleNumber}`
            : "pantalla actual");
        const validation =
          result.intent === "ACTIVATE_CONTROL"
            ? result.controlTarget
              ? located
                ? "Elemento encontrado, visible y habilitado."
                : "No se encontró un elemento visible con ese nombre."
              : "Sin objetivo especificado."
            : "No requiere localizar un elemento en pantalla.";
        const action = describeProposedAction(result);
        setSimulationEntry({
          received: lastRawTextRef.current || "(sin texto)",
          context:
            screenContext.currentContent ||
            screenContext.route ||
            "sin contexto adicional",
          intent: result.intent,
          confidence: result.confidence ?? 0.9,
          target: String(target),
          action,
          validation,
          execution: "No ejecutado: modo simulación activo.",
        });
        announce(
          `Simulación: ${action} ${validation} No hice ningún cambio real.`
        );
        return;
      }

      let spoken = result.message;
      switch (result.intent) {
        case "NAVIGATE_HOME":
          navigate("/");
          break;
        case "NAVIGATE_MODULE":
          result.moduleNumber >= 1 && result.moduleNumber <= modules.length
            ? navigate(`/modulo/m${result.moduleNumber}`)
            : (spoken = "Tenemos módulos del uno al seis.");
          break;
        case "NAVIGATE_PRETEST":
          navigate("/diagnostico");
          break;
        case "NAVIGATE_POSTEST":
          navigate("/postest");
          break;
        case "NAVIGATE_TUTOR":
          navigate("/tutor");
          break;
        case "NAVIGATE_IDENTIFICATION":
          navigate("/identificacion");
          break;
        case "NAVIGATE_TEACHER":
          navigate("/docente");
          break;
        case "OPEN_MENU":
          navigate("/dashboard");
          break;
        case "OPEN_RESULTS":
          navigate("/dashboard?tab=resultados");
          break;
        case "GO_BACK":
          window.history.length > 1 ? window.history.back() : navigate("/");
          break;
        case "START_LEARNING":
          navigate("/identificacion");
          break;
        case "CURRENT_MODULE":
          spoken = screenContext.moduleTitle
            ? `Estás en ${screenContext.moduleTitle}.`
            : (screenContext.currentContent ?? "Estás en la pantalla actual.");
          break;
        case "CURRENT_CONTENT":
          spoken =
            screenContext.currentContent ??
            (screenSummary(screenContext) ||
              "No tengo una descripción adicional de esta pantalla.");
          break;
        case "READ_SCREEN":
        case "READ_CONTENT":
          spoken = screenSummary(screenContext) || result.message;
          break;
        case "READ_SCREEN_FULL":
          spoken = screenSummaryDetailed(screenContext);
          break;
        case "REPEAT_CONTENT":
          spoken =
            lastSpokenRef.current ||
            screenSummary(screenContext) ||
            result.message;
          break;
        case "NEXT_CONTENT":
        case "START_ACTIVITY":
          (
            handlersRef.current.onNext ??
            handlersRef.current.onContinue ??
            handlersRef.current.onStartActivity
          )?.();
          break;
        case "PREVIOUS_CONTENT":
          handlersRef.current.onPrevious?.();
          break;
        case "GO_TO_QUESTION":
          if (typeof result.questionIndex === "number")
            handlersRef.current.onGoToQuestion?.(result.questionIndex);
          break;
        case "SELECT_OPTION":
          if (result.optionLetter)
            handlersRef.current.onSelectOption?.(result.optionLetter);
          break;
        case "WRITE_TEXT": {
          const active = document.activeElement;
          const field = result.controlTarget
            ? findNamedField(result.controlTarget)
            : active instanceof HTMLInputElement ||
                active instanceof HTMLTextAreaElement
              ? active
              : document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
                  "main input:not([type='password']), main textarea"
                );
          spoken =
            field && result.value && setFieldValue(field, result.value)
              ? `Escribí: ${result.value}.`
              : "No encontré un campo de texto seguro. Di enfoca siguiente control y luego escribe tu respuesta.";
          break;
        }
        case "FILL_FORM": {
          const fields = result.fields ?? {};
          const studentField = fields.student
            ? findField("student")
            : undefined;
          const schoolField = fields.school ? findField("school") : undefined;
          const studentDone = Boolean(
            studentField &&
              fields.student &&
              setFieldValue(studentField, fields.student)
          );
          const schoolDone = Boolean(
            schoolField &&
              fields.school &&
              setFieldValue(schoolField, fields.school)
          );
          spoken =
            studentDone || schoolDone
              ? `Completé ${[studentDone && "el estudiante", schoolDone && "el colegio"].filter(Boolean).join(" y ")}. Revisa los datos y di continuar cuando estés listo.`
              : "No encontré esos campos en esta pantalla.";
          break;
        }
        case "LIST_CONTROLS":
          spoken = controlsSummary() || "No encontré controles disponibles.";
          break;
        case "ACTIVATE_CONTROL": {
          if (!result.controlTarget) {
            spoken = "Di el nombre del botón que quieres activar.";
            break;
          }
          const located = locateNamedControl(result.controlTarget);
          if (!located) {
            spoken = `No encontré un botón o enlace llamado ${result.controlTarget}. Di qué botones hay para conocer los nombres disponibles.`;
            break;
          }
          const label = controlLabel(located, result.controlTarget);
          if (
            typeof result.confidence === "number" &&
            result.confidence < 0.55
          ) {
            setPendingConfirmation({
              description: `Activarías ${label}.`,
              execute: () => announce(performActivation(located, label)),
            });
            spoken = `No estoy segura de haber entendido bien. ¿Quisiste decir "${label}"? Di sí para continuar o no para cancelar.`;
            break;
          }
          if (isRiskyControl(located)) {
            setPendingConfirmation({
              description: `Vas a activar ${label}.`,
              execute: () => announce(performActivation(located, label)),
            });
            spoken = `¿Confirmas ${label}? Di sí para continuar o no para cancelar.`;
            break;
          }
          spoken = performActivation(located, label);
          break;
        }
        case "ACTIVATE_ASSISTANT":
          conversationModeRef.current = true;
          setConversationMode(true);
          spoken =
            "Modo conversacional activado. Puedes hablar y después de cada respuesta volveré a escucharte. Di detener asistente para terminar.";
          break;
        case "STOP_ASSISTANT":
          conversationModeRef.current = false;
          setConversationMode(false);
          setWakeListening(false);
          setPendingConfirmation(null);
          speech.stopListening();
          spoken = "Modo conversacional desactivado.";
          window.setTimeout(() => startWakeListeningRef.current(), 350);
          break;
        case "FOCUS_NEXT":
          focusControl(1);
          return;
        case "FOCUS_PREVIOUS":
          focusControl(-1);
          return;
        case "ACTIVATE_FOCUSED":
          (document.activeElement as HTMLElement | null)?.click();
          spoken = "Control activado.";
          break;
        case "TEXT_SCALE_UP":
          changeTextSize(1);
          return;
        case "TEXT_SCALE_DOWN":
          changeTextSize(-1);
          return;
        case "PAUSE":
          speech.stopSpeaking();
          setLastResponse("Lectura pausada.");
          return;
        case "RESUME":
          speech.resumeSpeaking();
          if (!speech.synthesisSupported || !window.speechSynthesis.speaking)
            spoken = lastSpokenRef.current || screenSummary(screenContext);
          else return;
          break;
        case "LIST_MODULES":
          spoken = listModulesMessage;
          break;
        case "HELP":
          spoken = HELP_MESSAGE;
          break;
        case "CONFIRM_LOGOUT":
          spoken =
            "Por seguridad, el cierre de sesión debe confirmarse con el botón visible. No puedo cerrar una sesión solo por una frase ambigua.";
          break;
        default:
          break;
      }
      announce(spoken);
    },
    [
      announce,
      changeTextSize,
      focusControl,
      handlersRef,
      listModulesMessage,
      navigate,
      performActivation,
      screenContext,
      speech,
      toggleSimulation,
    ]
  );

  const restartConversation = useCallback(() => {
    if (!conversationModeRef.current || !speech.speechSupported) return;
    window.setTimeout(() => {
      if (conversationModeRef.current)
        speech.listen(text =>
          text ? sendCommandRef.current(text) : restartConversation()
        );
    }, 1000);
  }, [speech]);
  const sendToAssistant = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      lastRawTextRef.current = text.trim();
      const pending = pendingConfirmationRef.current;
      if (pending) {
        const normalized = normalizeSpeech(text);
        if (
          /^(si|sí|confirmar|confirmo|adelante|dale|acepto|correcto)\b/.test(
            normalized
          )
        ) {
          setPendingConfirmation(null);
          pending.execute();
          restartConversation();
          return;
        }
        if (
          /^(no|cancelar|cancela|detente|olvidalo|olvídalo|negativo)\b/.test(
            normalized
          )
        ) {
          setPendingConfirmation(null);
          announce("Entendido, cancelé esa acción.");
          restartConversation();
          return;
        }
        announce(
          `${pending.description} Di sí para continuar o no para cancelar.`
        );
        restartConversation();
        return;
      }
      const local = interpretLocalCommand(text);
      if (local) {
        runIntent(local);
        restartConversation();
        return;
      }
      interpret.mutate(
        { text: text.trim(), mode: screenContext.mode, context: screenContext },
        {
          onSuccess: result => {
            runIntent(result as IntentResult);
            restartConversation();
          },
          onError: () => {
            announce(AI_ERROR_MESSAGE);
            restartConversation();
          },
        }
      );
    },
    [announce, interpret, restartConversation, runIntent, screenContext]
  );
  useEffect(() => {
    sendCommandRef.current = sendToAssistant;
  }, [sendToAssistant]);
  const startWakeListening = useCallback(() => {
    if (!speech.speechSupported) {
      setLastResponse(UNSUPPORTED_BROWSER_MESSAGE);
      return;
    }
    setOpen(true);
    setMicrophoneArmed(true);
    setWakeListening(true);
    setLastResponse('Micrófono listo. Di “OK Jason” o “Hey Jason” para activar el asistente.');
    speech.listen(
      text => {
        const phrase = normalizeSpeech(text);
        const wakeMatch = phrase.match(
          /(?:ok|hey|oye)\s+jason(?:[,:;.!?]|\s|$)(.*)$/
        );
        if (/(hablar con asistente|oye aula ia|activar asistente)/.test(phrase) || wakeMatch) {
          setWakeListening(false);
          speech.stopListening();
          const commandAfterWake = wakeMatch?.[1]?.trim();
          sendCommandRef.current(commandAfterWake || "activar asistente");
        }
      },
      { continuous: true }
    );
  }, [speech]);
  const startConversationListening = useCallback(() => {
    if (!speech.speechSupported) {
      setOpen(true);
      setLastResponse(UNSUPPORTED_BROWSER_MESSAGE);
      return;
    }
    setOpen(true);
    setMicrophoneArmed(true);
    setWakeListening(false);
    conversationModeRef.current = true;
    setConversationMode(true);
    speech.stopListening();
    window.setTimeout(() => {
      if (conversationModeRef.current)
        speech.listen(text => {
          if (text) sendCommandRef.current(text);
        });
    }, 120);
  }, [speech]);
  useEffect(() => {
    startWakeListeningRef.current = startWakeListening;
  }, [startWakeListening]);
  useEffect(() => {
    startConversationListeningRef.current = startConversationListening;
  }, [startConversationListening]);
  const handleMicPress = useCallback(() => {
    setOpen(true);
    if (!speech.speechSupported) {
      setLastResponse(UNSUPPORTED_BROWSER_MESSAGE);
      return;
    }
    speech.listen(text =>
      text ? sendToAssistant(text) : setLastResponse(NOT_UNDERSTOOD_MESSAGE)
    );
  }, [sendToAssistant, speech]);
  useEffect(() => {
    handleMicPressRef.current = handleMicPress;
  }, [handleMicPress]);
  const handleTypedSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (typedCommand.trim()) {
      sendToAssistant(typedCommand);
      setTypedCommand("");
    }
  };
  const status = interpret.isPending ? "processing" : speech.status;

  return (
    <div
      data-voice-assistant
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3"
    >
      {open && (
        <section
          role="dialog"
          aria-modal="false"
          aria-label="Asistente global de accesibilidad"
          className="w-[min(94vw,390px)] rounded-2xl border border-[#dce9e7] bg-white p-4 shadow-lift"
        >
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-bold text-[#26356b]">
              <Accessibility size={17} className="text-[#5b4bdb]" />
              Asistente accesible
            </p>
            <button
              type="button"
              onClick={() => {
                conversationModeRef.current = false;
                setConversationMode(false);
                setMicrophoneArmed(false);
                setPendingConfirmation(null);
                setOpen(false);
                speech.stopSpeaking();
                speech.stopListening();
              }}
              aria-label="Cerrar asistente"
              className="rounded-full p-1 text-[#688084] hover:bg-[#f5faf9]"
            >
              <X size={16} />
            </button>
          </div>
          <p
            role="status"
            aria-live="polite"
            className="mt-2 text-xs font-bold uppercase tracking-[.1em] text-[#5b4bdb]"
          >
            {simulationMode
              ? "Modo simulación activo — no se ejecutan cambios reales"
              : conversationMode
                ? "Modo conversacional activo"
                : (STATUS_LABEL[status] ?? STATUS_LABEL.idle)}
          </p>
          {speech.transcript && (
            <p className="mt-2 rounded-lg bg-[#f5f1ff] px-3 py-2 text-sm text-[#6954a8]">
              Tú: “{speech.transcript}”
            </p>
          )}
          {(lastResponse || speech.errorMessage) && (
            <p
              aria-live="polite"
              className="mt-2 flex items-start gap-2 rounded-lg bg-[#eef8f6] px-3 py-2 text-sm text-[#26356b]"
            >
              <Volume2 size={16} className="mt-0.5 shrink-0 text-[#5b4bdb]" />
              <span>{speech.errorMessage || lastResponse}</span>
            </p>
          )}
          {pendingConfirmation && (
            <p
              role="alert"
              className="mt-2 flex items-start gap-2 rounded-lg border border-[#f0d5c4] bg-[#fff7ed] px-3 py-2 text-sm font-bold text-[#8a5a2c]"
            >
              <ShieldCheck size={16} className="mt-0.5 shrink-0" />
              <span>
                {pendingConfirmation.description} Di “sí” para continuar o “no”
                para cancelar.
              </span>
            </p>
          )}
          {screenContext.mode === "evaluation" && (
            <p className="mt-2 text-xs font-bold text-[#b55e3d]">
              Evaluación: puedo leer y navegar, pero no resolver ni dar pistas.
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleMicPress}
              disabled={status === "listening" || status === "processing"}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#26356b] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {status === "listening" ? (
                <Mic size={16} className="animate-pulse" />
              ) : status === "processing" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Mic size={16} />
              )}
              Hablar
            </button>
            <button
              type="button"
              onClick={() =>
                speech.status === "speaking"
                  ? speech.stopSpeaking()
                  : speech.speak(screenSummary(screenContext))
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce9e7] px-3 py-2.5 text-sm font-bold text-[#26356b]"
            >
              {speech.status === "speaking" ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}
              Leer pantalla
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                announce(lastSpokenRef.current || screenSummary(screenContext))
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce9e7] px-3 py-2 text-xs font-bold text-[#26356b]"
            >
              <RotateCcw size={14} />
              Repetir
            </button>
            <button
              type="button"
              onClick={() => speech.stopSpeaking()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce9e7] px-3 py-2 text-xs font-bold text-[#26356b]"
            >
              <Pause size={14} />
              Detener lectura
            </button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => changeTextSize(1)}
              aria-label="Aumentar letra"
              className="rounded-lg border border-[#dce9e7] px-2 py-2 text-xs font-bold text-[#26356b]"
            >
              A+
              <ChevronUp size={13} className="mx-auto" />
            </button>
            <button
              type="button"
              onClick={() => changeTextSize(-1)}
              aria-label="Disminuir letra"
              className="rounded-lg border border-[#dce9e7] px-2 py-2 text-xs font-bold text-[#26356b]"
            >
              A−
              <ChevronDown size={13} className="mx-auto" />
            </button>
            <label className="flex items-center justify-center gap-1 rounded-lg border border-[#dce9e7] px-1 text-xs text-[#26356b]">
              Velocidad
              <select
                aria-label="Velocidad de lectura"
                value={speech.rate}
                onChange={event => speech.setRate(Number(event.target.value))}
                className="w-12 bg-transparent font-bold"
              >
                <option value="0.75">0.75</option>
                <option value="1">1</option>
                <option value="1.25">1.25</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelp(value => !value)}
              aria-label="Ayuda del asistente"
              className="rounded-xl border border-[#dce9e7] p-2.5 text-[#547074]"
            >
              <HelpCircle size={18} />
            </button>
            {!wakeListening && !conversationMode && (
              <button
                type="button"
                onClick={startWakeListening}
                className="rounded-xl border border-[#dce9e7] px-2.5 py-2 text-xs font-bold text-[#26356b]"
              >
                Escuchar frase
              </button>
            )}
            {(wakeListening || conversationMode) && (
              <button
                type="button"
                onClick={() => {
                  conversationModeRef.current = false;
                  setConversationMode(false);
                  setMicrophoneArmed(false);
                  setWakeListening(false);
                  speech.stopListening();
                }}
                className="rounded-xl border border-[#f0d5c4] px-2.5 py-2 text-xs font-bold text-[#a9583b]"
              >
                Detener voz
              </button>
            )}
            <button
              type="button"
              onClick={toggleSimulation}
              aria-pressed={simulationMode}
              title="Modo simulación: describe las acciones sin ejecutarlas"
              className={`ml-auto rounded-xl border px-2.5 py-2 text-xs font-bold ${simulationMode ? "border-[#5b4bdb] bg-[#f5f1ff] text-[#5b4bdb]" : "border-[#dce9e7] text-[#547074]"}`}
            >
              <FlaskConical size={14} className="mr-1 inline" />
              Simulación
            </button>
          </div>
          <p className="mt-2 text-xs text-[#688084]">
            {microphoneArmed
              ? 'Micrófono habilitado. Di “OK Jason” o “Hey Jason” para reactivar el asistente cuando esté en espera.'
              : 'Presiona Espacio una vez para iniciar la conversación; después di tus comandos directamente.'}
          </p>
          {showHelp && (
            <p className="mt-2 rounded-lg bg-[#fff7ed] px-3 py-2 text-xs leading-relaxed text-[#8a5a2c]">
              {HELP_MESSAGE}
            </p>
          )}
          {simulationMode && simulationEntry && (
            <div className="mt-3 space-y-1 rounded-lg border border-[#dce9e7] bg-[#f7f8ff] px-3 py-2 text-xs text-[#36414f]">
              <p className="font-bold text-[#5b4bdb]">
                Detalle de la simulación
              </p>
              <p>
                <strong>Orden recibida:</strong> {simulationEntry.received}
              </p>
              <p>
                <strong>Contexto enviado:</strong> {simulationEntry.context}
              </p>
              <p>
                <strong>Intención:</strong> {simulationEntry.intent} ·{" "}
                <strong>Confianza:</strong>{" "}
                {Math.round(simulationEntry.confidence * 100)}%
              </p>
              <p>
                <strong>Elemento objetivo:</strong> {simulationEntry.target}
              </p>
              <p>
                <strong>Acción propuesta:</strong> {simulationEntry.action}
              </p>
              <p>
                <strong>Validación:</strong> {simulationEntry.validation}
              </p>
              <p>
                <strong>Ejecución:</strong> {simulationEntry.execution}
              </p>
            </div>
          )}
          {history.length > 0 && (
            <div className="mt-3 max-h-32 space-y-1.5 overflow-y-auto border-t border-[#eef2f1] pt-2 text-xs text-[#688084]">
              {history.map((item, index) => (
                <p key={index}>
                  <strong className="text-[#26356b]">Tú:</strong> {item.you}{" "}
                  <br />
                  <strong className="text-[#5b4bdb]">Asistente:</strong>{" "}
                  {item.assistant}
                </p>
              ))}
            </div>
          )}
          <form
            onSubmit={handleTypedSubmit}
            className="mt-3 flex items-center gap-2 border-t border-[#eef2f1] pt-3"
          >
            <Keyboard
              size={15}
              className="shrink-0 text-[#8a9a9b]"
              aria-hidden="true"
            />
            <label className="sr-only" htmlFor="voice-assistant-text-input">
              Escribe un comando
            </label>
            <input
              id="voice-assistant-text-input"
              value={typedCommand}
              onChange={event => setTypedCommand(event.target.value)}
              placeholder="O escribe un comando…"
              className="focus-ring w-full rounded-lg border border-[#dce9e7] px-3 py-1.5 text-sm text-[#26356b] outline-none"
            />
          </form>
          <p className="mt-2 text-[11px] leading-snug text-[#8a9a9b]">
            No grabamos audio ni conversaciones. El texto de tu orden y lo
            visible en pantalla se envían a un servicio de IA solo para
            interpretar la orden; nunca enviamos contraseñas ni datos
            protegidos.
          </p>
        </section>
      )}
      <button
        type="button"
        onClick={() => (open ? handleMicPress() : setOpen(true))}
        onDoubleClick={() => {
          setOpen(true);
          speech.status === "speaking"
            ? speech.stopSpeaking()
            : speech.speak(screenSummary(screenContext));
        }}
        aria-label={
          open
            ? "Hablar con asistente. Doble toque para activar o detener texto a voz"
            : "Abrir asistente de accesibilidad. Doble toque para leer la pantalla"
        }
        aria-pressed={open}
        data-ai-target="assistant-button"
        data-ai-action="open-assistant"
        className="flex items-center gap-2 rounded-full bg-[#26356b] px-5 py-3.5 text-sm font-bold text-white shadow-lift hover:bg-[#4036a5]"
      >
        {speech.speechSupported ? <Mic size={18} /> : <MicOff size={18} />}
        Hablar con asistente
      </button>
    </div>
  );
}
