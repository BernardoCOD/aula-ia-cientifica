import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import {
  Accessibility,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Ear,
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
import { TRPCClientError } from "@trpc/client";
import type { AgentAction, AgentReply, AgentTurn } from "@shared/assistant";
import { trpc } from "@/lib/trpc";
import { useAssistantContext } from "@/contexts/AssistantContext";
import { useSpeech } from "@/hooks/useSpeech";
import { getStudent } from "@/lib/student";
import {
  AI_UNAVAILABLE_MESSAGE,
  ASSISTANT_NAME,
  HELP_MESSAGE,
  UNSUPPORTED_BROWSER_MESSAGE,
  WAKE_PATTERN,
  interpretLocalCommand,
  normalizeSpeech,
  type LocalCommand,
} from "@/lib/voiceIntents";
import {
  accessibleName,
  elementById,
  speakableFull,
  speakableSummary,
  takeSnapshot,
} from "@/lib/pageSnapshot";
import {
  executeAction,
  isRiskyElement,
  waitForPageToSettle,
  type ActionEnvironment,
} from "@/lib/pageActions";

type ListeningMode = "off" | "wake" | "conversation";
type PendingConfirmation = { question: string; actions: AgentAction[]; speech: string };
type HistoryItem = { you: string; assistant: string };

const TEXT_SIZE_KEY = "aula-ia-text-size";
const ALWAYS_LISTEN_KEY = "aula-ia-always-listen";
const YES = /^(?:si|claro|confirmo|confirmar|adelante|dale|acepto|correcto|hazlo|de acuerdo|ok|okey|por supuesto)\b/;
const NO = /^(?:no|cancela|cancelar|detente|olvidalo|negativo|mejor no|todavia no)\b/;

const readStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};

function describeAction(action: AgentAction) {
  const element = action.target ? elementById(action.target) : undefined;
  const name = element ? `«${accessibleName(element)}»` : action.target;
  switch (action.type) {
    case "navigate": return `Abriría la pantalla ${action.target}.`;
    case "click": return `Pulsaría ${name}.`;
    case "fill": return `Escribiría "${action.value}" en ${name}.`;
    case "select": return `Elegiría "${action.value}" en ${name}.`;
    case "scroll": return "Desplazaría la pantalla.";
    case "focus": return `Enfocaría ${name}.`;
    case "back": return "Volvería a la pantalla anterior.";
    case "read_page": return "Leería la pantalla.";
    case "text_size": return "Cambiaría el tamaño de letra.";
    case "speech_rate": return "Cambiaría la velocidad de voz.";
    case "consult": return `Buscaría "${action.value}" en el Área de consultas.`;
    case "stop_assistant": return "Dejaría de escuchar.";
  }
}

export function VoiceAssistant() {
  const [location, navigate] = useLocation();
  const { screenContext, handlersRef, speakRef } = useAssistantContext();
  const speech = useSpeech();
  const agent = trpc.assistant.act.useMutation();
  const status = trpc.assistant.status.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });
  const aiReady = status.data?.aiReady ?? true;

  const [open, setOpen] = useState(false);
  const [mode, setModeState] = useState<ListeningMode>("off");
  const [busy, setBusy] = useState(false);
  const [lastResponse, setLastResponse] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, setPendingState] = useState<PendingConfirmation | null>(null);
  const [simulation, setSimulation] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [alwaysListen, setAlwaysListen] = useState(() => readStorage(ALWAYS_LISTEN_KEY) === "1");

  // Refs: los callbacks de voz se ejecutan fuera del ciclo de React y necesitan el valor actual.
  const modeRef = useRef<ListeningMode>("off");
  const pendingRef = useRef<PendingConfirmation | null>(null);
  const simulationRef = useRef(false);
  const screenRef = useRef(screenContext);
  const locationRef = useRef(location);
  const agentHistoryRef = useRef<AgentTurn[]>([]);
  const lastSpokenRef = useRef("");
  const lastUserTextRef = useRef("");
  const silenceCountRef = useRef(0);
  const greetedRef = useRef(false);
  const selfNavigationRef = useRef(0);
  const handleRef = useRef<(text: string) => void>(() => undefined);

  screenRef.current = screenContext;
  locationRef.current = location;

  const setMode = useCallback((next: ListeningMode) => {
    modeRef.current = next;
    setModeState(next);
  }, []);
  const setPending = useCallback((next: PendingConfirmation | null) => {
    pendingRef.current = next;
    setPendingState(next);
  }, []);

  useEffect(() => {
    const saved = Number(readStorage(TEXT_SIZE_KEY) || "100");
    document.documentElement.style.fontSize = `${saved}%`;
  }, []);

  // ---- Escucha -------------------------------------------------------------------------------

  const listenForWakeWord = useCallback(() => {
    if (!speech.recognitionSupported) return;
    speech.listen({
      continuous: true,
      onResult: text => {
        const match = WAKE_PATTERN.exec(normalizeSpeech(text));
        if (!match) return;
        speech.stopListening();
        setMode("conversation");
        setOpen(true);
        silenceCountRef.current = 0;
        const command = match[1]?.trim();
        if (command) handleRef.current(command);
        else respondRef.current("Dime.");
      },
    });
  }, [speech, setMode]);

  const listenForCommand = useCallback(() => {
    if (!speech.recognitionSupported) return;
    speech.listen({
      onResult: text => handleRef.current(text),
      onSilence: reason => {
        if (modeRef.current !== "conversation") return;
        if (reason === "not-allowed") {
          setMode("off");
          return;
        }
        silenceCountRef.current++;
        if (silenceCountRef.current >= 2) {
          // Dos silencios seguidos: queda en espera para no tener el micrófono abierto sin motivo.
          silenceCountRef.current = 0;
          const next = alwaysListenRef.current ? "wake" : "off";
          setMode(next);
          respondRef.current(
            next === "wake"
              ? `Quedo en espera. Di oye ${ASSISTANT_NAME} cuando me necesites.`
              : "Quedo en espera. Presiona la barra espaciadora cuando me necesites."
          );
          return;
        }
        listenForCommand();
      },
    });
  }, [speech, setMode]);

  /** Después de hablar, vuelve a escuchar según el modo (nunca mientras habla). */
  const resumeListening = useCallback(() => {
    if (modeRef.current === "conversation") listenForCommand();
    else if (modeRef.current === "wake") listenForWakeWord();
  }, [listenForCommand, listenForWakeWord]);

  const alwaysListenRef = useRef(alwaysListen);
  alwaysListenRef.current = alwaysListen;

  // ---- Hablar --------------------------------------------------------------------------------

  const say = useCallback(
    (text: string) =>
      new Promise<void>(resolve => {
        if (!text) return resolve();
        lastSpokenRef.current = text;
        setLastResponse(text);
        speech.speak(text, resolve);
      }),
    [speech]
  );

  /** Responde en voz alta, lo registra en el historial y luego vuelve a escuchar. */
  const respond = useCallback(
    (text: string) => {
      if (!text) {
        resumeListening();
        return;
      }
      setHistory(previous => [
        ...previous.slice(-5),
        { you: lastUserTextRef.current || "(acción)", assistant: text },
      ]);
      lastUserTextRef.current = "";
      void say(text).then(resumeListening);
    },
    [say, resumeListening]
  );
  const respondRef = useRef(respond);
  respondRef.current = respond;

  useEffect(() => {
    speakRef.current = text => respondRef.current(text);
  }, [speakRef]);

  const rememberTurn = (role: AgentTurn["role"], text: string) => {
    if (!text) return;
    agentHistoryRef.current = [...agentHistoryRef.current, { role, text }].slice(-10);
  };

  // ---- Acciones de accesibilidad --------------------------------------------------------------

  const changeTextSize = useCallback((direction: 1 | -1) => {
    const current = Number(readStorage(TEXT_SIZE_KEY) || "100");
    const next = Math.min(150, Math.max(90, current + direction * 10));
    writeStorage(TEXT_SIZE_KEY, String(next));
    document.documentElement.style.fontSize = `${next}%`;
    return next;
  }, []);

  const changeSpeechRate = useCallback(
    (value: "slower" | "faster" | "normal") => {
      speech.setRate(value === "normal" ? 1 : speech.rate + (value === "faster" ? 0.15 : -0.15));
    },
    [speech]
  );

  const currentSnapshot = useCallback(
    () =>
      takeSnapshot(locationRef.current + window.location.search, screenRef.current.mode, {
        moduleTitle: screenRef.current.moduleTitle,
        currentContent: screenRef.current.currentContent,
        currentQuestion: screenRef.current.currentQuestion,
        currentOptions: screenRef.current.currentOptions,
        questionIndex: screenRef.current.questionIndex,
        totalQuestions: screenRef.current.totalQuestions,
      }),
    []
  );

  const readQuestion = useCallback(() => {
    const screen = screenRef.current;
    if (!screen.currentQuestion) return "No hay una pregunta activa en esta pantalla.";
    return `Pregunta ${(screen.questionIndex ?? 0) + 1} de ${screen.totalQuestions ?? ""}. ${screen.currentQuestion} ${(screen.currentOptions ?? []).map((option, index) => `Opción ${String.fromCharCode(65 + index)}: ${option.replace(/[.\s]+$/, "")}.`).join(" ")}`;
  }, []);

  const stopAssistant = useCallback(() => {
    setPending(null);
    const next = alwaysListenRef.current ? "wake" : "off";
    setMode(next);
    speech.stopListening();
  }, [speech, setMode, setPending]);

  const actionEnvironment: ActionEnvironment = {
    navigate: path => {
      selfNavigationRef.current = Date.now();
      navigate(path);
    },
    goBack: () => {
      selfNavigationRef.current = Date.now();
      window.history.back();
    },
    readPage: () => undefined, // la lectura se hace al final, con la pantalla ya actualizada
    changeTextSize,
    changeSpeechRate,
    stopAssistant,
  };
  const envRef = useRef(actionEnvironment);
  envRef.current = actionEnvironment;

  // ---- Comandos locales ----------------------------------------------------------------------

  const runLocal = useCallback(
    (command: LocalCommand) => {
      const handlers = handlersRef.current;
      switch (command.kind) {
        case "wake":
          setMode("conversation");
          return respond("Dime.");
        case "stop_assistant":
          stopAssistant();
          return void say(
            alwaysListenRef.current
              ? `De acuerdo. Di oye ${ASSISTANT_NAME} cuando me necesites.`
              : "De acuerdo. Presiona la barra espaciadora cuando me necesites."
          ).then(resumeListening);
        case "pause":
          speech.stopSpeaking();
          setLastResponse("Lectura detenida.");
          return resumeListening();
        case "repeat":
          return respond(lastSpokenRef.current || speakableSummary(currentSnapshot()));
        case "read":
          return respond(
            command.full ? speakableFull(currentSnapshot()) : speakableSummary(currentSnapshot())
          );
        case "text_size":
          return respond(`Tamaño de letra: ${changeTextSize(command.direction)} por ciento.`);
        case "speech_rate":
          changeSpeechRate(command.value);
          return respond(
            command.value === "slower"
              ? "Hablaré más despacio."
              : command.value === "faster"
                ? "Hablaré más rápido."
                : "Velocidad normal."
          );
        case "help":
          return respond(HELP_MESSAGE);
        case "simulation": {
          const next = !simulationRef.current;
          simulationRef.current = next;
          setSimulation(next);
          setSimulationLog([]);
          return respond(
            next
              ? "Modo simulación activado. Te diré qué haría sin tocar nada de la página."
              : "Modo simulación desactivado. Las acciones se ejecutarán de verdad."
          );
        }
        case "decline":
          return respond(command.message);
        case "select_option":
          if (!handlers.onSelectOption)
            return respond("No hay una pregunta activa para marcar una alternativa.");
          handlers.onSelectOption(command.letter);
          return respond(`Marqué la opción ${command.letter}.`);
        case "next_question":
          handlers.onNext?.();
          window.setTimeout(() => respond(readQuestion()), 150);
          return;
        case "previous_question":
          handlers.onPrevious?.();
          window.setTimeout(() => respond(readQuestion()), 150);
          return;
        case "go_to_question":
          handlers.onGoToQuestion?.(command.index);
          window.setTimeout(() => respond(readQuestion()), 150);
          return;
        case "read_question":
          return respond(readQuestion());
        case "navigate":
          envRef.current.navigate(command.path);
          return respond(`Abrí ${command.label}.`);
        case "back":
          envRef.current.goBack();
          return respond("Volví a la pantalla anterior.");
      }
    },
    [
      changeSpeechRate,
      changeTextSize,
      currentSnapshot,
      handlersRef,
      readQuestion,
      respond,
      resumeListening,
      say,
      setMode,
      speech,
      stopAssistant,
    ]
  );

  // ---- Agente de IA --------------------------------------------------------------------------

  const executeActions = useCallback(async (actions: AgentAction[]) => {
    const results: string[] = [];
    let failed = false;
    let readMode: "summary" | "full" | null = null;
    for (const action of actions) {
      if (action.type === "read_page") {
        readMode = action.value === "full" ? "full" : "summary";
        continue;
      }
      const outcome = await executeAction(action, envRef.current);
      results.push(outcome.ok ? outcome.detail : `FALLÓ: ${outcome.detail}`);
      if (!outcome.ok) {
        failed = true;
        break;
      }
    }
    return { results, failed, readMode };
  }, []);

  const finishReply = useCallback(
    async (reply: AgentReply, results: string[], failed: boolean, readMode: "summary" | "full" | null) => {
      if (failed) {
        const problem = results[results.length - 1]?.replace("FALLÓ: ", "") ?? "algo salió mal";
        respond(`Intenté hacerlo, pero ${problem}. ¿Quieres que lo intente de otra forma?`);
        return;
      }
      if (readMode) {
        if (reply.speech) await say(reply.speech);
        await new Promise(resolve => window.setTimeout(resolve, 300));
        const snapshot = currentSnapshot();
        respond(readMode === "full" ? speakableFull(snapshot) : speakableSummary(snapshot));
        return;
      }
      respond(reply.speech || "Listo.");
    },
    [currentSnapshot, respond, say]
  );

  const runAgent = useCallback(
    async (text: string, step = 0, previousResults: string[] = []): Promise<void> => {
      setBusy(true);
      let reply: AgentReply;
      try {
        reply = await agent.mutateAsync({
          text,
          studentCode: getStudent()?.code,
          history: step === 0 ? agentHistoryRef.current : [],
          step,
          previousResults,
          snapshot: currentSnapshot(),
        });
      } catch (error) {
        setBusy(false);
        respond(
          error instanceof TRPCClientError && error.message
            ? error.message
            : AI_UNAVAILABLE_MESSAGE
        );
        return;
      } finally {
        setBusy(false);
      }

      if (simulationRef.current) {
        const described = reply.actions.map(describeAction);
        setSimulationLog([
          `Orden: ${text}`,
          ...described,
          reply.confirm ? `Pediría confirmación: ${reply.confirm}` : "Sin confirmación necesaria.",
          `Respuesta: ${reply.speech || "(sin texto)"}`,
        ]);
        rememberTurn("assistant", reply.speech);
        respond(
          `Simulación. ${described.join(" ") || "No haría ninguna acción."} ${reply.speech} No hice ningún cambio real.`
        );
        return;
      }

      // Confirmación: la pide el agente o, como segunda barrera, la exige el propio navegador.
      const riskyClick = reply.actions.find(action => {
        const element = action.type === "click" ? elementById(action.target) : undefined;
        return element ? isRiskyElement(element) : false;
      });
      const confirmation =
        reply.confirm ||
        (riskyClick
          ? `¿Confirmas que quieres pulsar «${accessibleName(elementById(riskyClick.target)!)}»?`
          : "");
      if (confirmation && reply.actions.length) {
        setPending({ question: confirmation, actions: reply.actions, speech: reply.speech });
        rememberTurn("assistant", confirmation);
        respond(`${confirmation} Di sí o no.`);
        return;
      }

      const pathBefore = window.location.pathname;
      const { results, failed, readMode } = await executeActions(reply.actions);
      if (reply.continue && !failed && step < 4) {
        await Promise.all([say(reply.speech), waitForPageToSettle(pathBefore)]);
        return runAgent(text, step + 1, [...previousResults, ...results]);
      }
      rememberTurn("assistant", failed ? results.join("; ") : reply.speech);
      await finishReply(reply, results, failed, readMode);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agent, currentSnapshot, executeActions, finishReply, respond, say, setPending]
  );

  // ---- Punto de entrada de cada frase -------------------------------------------------------

  const handleUtterance = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      silenceCountRef.current = 0;
      lastUserTextRef.current = text;
      setOpen(true);
      const normalized = normalizeSpeech(text);

      const confirmation = pendingRef.current;
      if (confirmation) {
        if (YES.test(normalized)) {
          setPending(null);
          rememberTurn("user", text);
          void executeActions(confirmation.actions).then(({ results, failed, readMode }) =>
            finishReply(
              { speech: confirmation.speech, actions: [], confirm: "", continue: false },
              results,
              failed,
              readMode
            )
          );
          return;
        }
        if (NO.test(normalized)) {
          setPending(null);
          respond("Entendido, no hice nada.");
          return;
        }
        respond(`${confirmation.question} Responde sí o no.`);
        return;
      }

      const local = interpretLocalCommand(text, {
        inQuestion: Boolean(screenRef.current.currentQuestion),
      });
      if (local) {
        runLocal(local);
        return;
      }
      if (!aiReady) {
        respond(AI_UNAVAILABLE_MESSAGE);
        return;
      }
      rememberTurn("user", text);
      void runAgent(text);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aiReady, executeActions, finishReply, respond, runAgent, runLocal, setPending]
  );
  handleRef.current = handleUtterance;

  // ---- Controles para iniciar y detener -----------------------------------------------------

  const startConversation = useCallback(() => {
    setOpen(true);
    if (!speech.recognitionSupported) {
      setLastResponse(UNSUPPORTED_BROWSER_MESSAGE);
      speech.speak(UNSUPPORTED_BROWSER_MESSAGE);
      return;
    }
    silenceCountRef.current = 0;
    setMode("conversation");
    if (!greetedRef.current) {
      greetedRef.current = true;
      respond(
        aiReady
          ? `Hola, soy ${ASSISTANT_NAME}. ¿En qué te ayudo?`
          : `Hola, soy ${ASSISTANT_NAME}. ${AI_UNAVAILABLE_MESSAGE}`
      );
    } else {
      speech.stopSpeaking();
      listenForCommand();
    }
  }, [aiReady, listenForCommand, respond, setMode, speech]);

  const stopEverything = useCallback(() => {
    setMode("off");
    setPending(null);
    speech.stopSpeaking();
    speech.stopListening();
  }, [setMode, setPending, speech]);

  const toggleAlwaysListen = useCallback(() => {
    const next = !alwaysListenRef.current;
    alwaysListenRef.current = next;
    setAlwaysListen(next);
    writeStorage(ALWAYS_LISTEN_KEY, next ? "1" : "0");
    if (next && modeRef.current === "off") {
      setMode("wake");
      void say(`Escucha continua activada. Di oye ${ASSISTANT_NAME} para hablarme.`).then(
        listenForWakeWord
      );
    } else if (!next && modeRef.current === "wake") {
      setMode("off");
      speech.stopListening();
      void say("Escucha continua desactivada.");
    }
  }, [listenForWakeWord, say, setMode, speech]);

  // Escucha continua guardada: se activa al cargar (útil para quien no puede usar las manos).
  useEffect(() => {
    if (alwaysListenRef.current && speech.recognitionSupported) {
      setMode("wake");
      listenForWakeWord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atajos de teclado: Espacio (sin un control enfocado), Ctrl+Shift+Espacio y Escape.
  const startRef = useRef(startConversation);
  startRef.current = startConversation;
  const stopRef = useRef(stopEverything);
  stopRef.current = stopEverything;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest(
        "input, textarea, select, button, a, [contenteditable='true'], [role='button'], [role='tab'], [role='checkbox'], [role='radio'], [role='menuitem'], [role='option']"
      );
      const plainSpace =
        event.code === "Space" && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey;
      const globalShortcut =
        (event.ctrlKey && event.shiftKey && event.code === "Space") ||
        (event.altKey && event.shiftKey && event.key.toLowerCase() === "v");
      if (globalShortcut || (plainSpace && !interactive)) {
        event.preventDefault();
        startRef.current();
      } else if (event.key === "Escape" && modeRef.current !== "off") {
        stopRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Si la persona cambia de pantalla por su cuenta (clic o teclado) con el asistente activo,
  // se anuncia la pantalla nueva. Las navegaciones del propio asistente ya se anuncian en su respuesta.
  const previousLocationRef = useRef(location);
  useEffect(() => {
    if (previousLocationRef.current === location) return;
    previousLocationRef.current = location;
    if (modeRef.current === "off" || Date.now() - selfNavigationRef.current < 4000) return;
    const timer = window.setTimeout(() => {
      const title = document.querySelector("main h1, h1")?.textContent?.trim();
      if (title) respondRef.current(`Estás en: ${title}.`);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [location]);

  const handleTypedSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!typed.trim()) return;
    handleUtterance(typed);
    setTyped("");
  };

  const statusLabel = busy
    ? "Pensando…"
    : speech.status === "listening"
      ? mode === "wake"
        ? `En espera: di "oye ${ASSISTANT_NAME}"`
        : "Te escucho…"
      : speech.status === "speaking"
        ? "Hablando…"
        : mode === "conversation"
          ? "Conversación activa"
          : "Listo para ayudarte";

  return (
    <div data-voice-assistant className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <p className="sr-only" aria-live="polite">
        {lastResponse}
      </p>
      {open && (
        <section
          role="dialog"
          aria-modal="false"
          aria-label="Asistente de voz"
          className="max-h-[80vh] w-[min(94vw,400px)] overflow-y-auto rounded-2xl border border-[#dce9e7] bg-white p-4 shadow-lift"
        >
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-bold text-[#26356b]">
              <Accessibility size={17} className="text-[#5b4bdb]" />
              {ASSISTANT_NAME} · asistente de voz
            </p>
            <button
              type="button"
              onClick={() => {
                stopEverything();
                setOpen(false);
              }}
              aria-label="Cerrar asistente"
              className="rounded-full p-1 text-[#688084] hover:bg-[#f5faf9]"
            >
              <X size={16} />
            </button>
          </div>

          <p role="status" className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-[#5b4bdb]">
            {busy && <Loader2 size={13} className="animate-spin" />}
            {simulation ? "Modo simulación · sin cambios reales" : statusLabel}
          </p>

          {!aiReady && (
            <p className="mt-2 flex items-start gap-2 rounded-lg border border-[#f0d5c4] bg-[#fff7ed] px-3 py-2 text-xs text-[#8a5a2c]">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              La IA no está configurada (falta ANTHROPIC_API_KEY en el servidor). Funcionan solo las órdenes directas.
            </p>
          )}
          {speech.transcript && (
            <p className="mt-2 rounded-lg bg-[#f5f1ff] px-3 py-2 text-sm text-[#6954a8]">
              Tú: “{speech.transcript}”
            </p>
          )}
          {(lastResponse || speech.error) && (
            <p className="mt-2 flex items-start gap-2 rounded-lg bg-[#eef8f6] px-3 py-2 text-sm text-[#26356b]">
              <Volume2 size={16} className="mt-0.5 shrink-0 text-[#5b4bdb]" />
              <span>{speech.error || lastResponse}</span>
            </p>
          )}
          {pending && (
            <div role="alert" className="mt-2 rounded-lg border border-[#f0d5c4] bg-[#fff7ed] px-3 py-2 text-sm font-bold text-[#8a5a2c]">
              <p className="flex items-start gap-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                {pending.question}
              </p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => handleUtterance("sí")} className="rounded-lg bg-[#26356b] px-3 py-1.5 text-xs text-white">
                  Sí, hazlo
                </button>
                <button type="button" onClick={() => handleUtterance("no")} className="rounded-lg border border-[#f0d5c4] px-3 py-1.5 text-xs">
                  No
                </button>
              </div>
            </div>
          )}
          {screenContext.mode === "evaluation" && (
            <p className="mt-2 text-xs font-bold text-[#b55e3d]">
              Evaluación: puedo leer, moverme entre preguntas y marcar la opción que me digas, pero no ayudarte a responder.
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => (mode === "conversation" ? stopEverything() : startConversation())}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#26356b] px-3 py-2.5 text-sm font-bold text-white"
            >
              {speech.status === "listening" && mode === "conversation" ? (
                <Mic size={16} className="animate-pulse" />
              ) : (
                <Mic size={16} />
              )}
              {mode === "conversation" ? "Terminar" : "Hablar"}
            </button>
            <button
              type="button"
              onClick={() =>
                speech.status === "speaking"
                  ? speech.stopSpeaking()
                  : respond(speakableSummary(currentSnapshot()))
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce9e7] px-3 py-2.5 text-sm font-bold text-[#26356b]"
            >
              {speech.status === "speaking" ? <Pause size={16} /> : <Play size={16} />}
              {speech.status === "speaking" ? "Detener" : "Leer pantalla"}
            </button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            <button type="button" onClick={() => respond(lastSpokenRef.current || speakableSummary(currentSnapshot()))} aria-label="Repetir la última respuesta" className="rounded-lg border border-[#dce9e7] px-2 py-2 text-[#26356b]">
              <RotateCcw size={14} className="mx-auto" />
            </button>
            <button type="button" onClick={() => runLocal({ kind: "text_size", direction: 1 })} aria-label="Aumentar letra" className="rounded-lg border border-[#dce9e7] px-2 py-1 text-xs font-bold text-[#26356b]">
              A+ <ChevronUp size={12} className="mx-auto" />
            </button>
            <button type="button" onClick={() => runLocal({ kind: "text_size", direction: -1 })} aria-label="Disminuir letra" className="rounded-lg border border-[#dce9e7] px-2 py-1 text-xs font-bold text-[#26356b]">
              A− <ChevronDown size={12} className="mx-auto" />
            </button>
            <label className="flex flex-col items-center justify-center rounded-lg border border-[#dce9e7] text-[10px] text-[#26356b]">
              Voz
              <select
                aria-label="Velocidad de la voz"
                value={String(speech.rate)}
                onChange={event => speech.setRate(Number(event.target.value))}
                className="bg-transparent text-xs font-bold"
              >
                {[0.75, 0.9, 1, 1.15, 1.3].map(value => (
                  <option key={value} value={value}>
                    {value}x
                  </option>
                ))}
                {![0.75, 0.9, 1, 1.15, 1.3].includes(speech.rate) && (
                  <option value={speech.rate}>{speech.rate}x</option>
                )}
              </select>
            </label>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleAlwaysListen}
              aria-pressed={alwaysListen}
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-bold ${alwaysListen ? "border-[#5b4bdb] bg-[#f5f1ff] text-[#5b4bdb]" : "border-[#dce9e7] text-[#547074]"}`}
            >
              <Ear size={14} /> Escucha continua
            </button>
            <button
              type="button"
              onClick={() => runLocal({ kind: "simulation" })}
              aria-pressed={simulation}
              title="Describe lo que haría sin ejecutar nada"
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-bold ${simulation ? "border-[#5b4bdb] bg-[#f5f1ff] text-[#5b4bdb]" : "border-[#dce9e7] text-[#547074]"}`}
            >
              <FlaskConical size={14} /> Simulación
            </button>
            <button
              type="button"
              onClick={() => setShowHelp(value => !value)}
              aria-expanded={showHelp}
              aria-label="Ayuda del asistente"
              className="ml-auto rounded-xl border border-[#dce9e7] p-2 text-[#547074]"
            >
              <HelpCircle size={16} />
            </button>
          </div>
          <p className="mt-2 text-xs text-[#688084]">
            {alwaysListen
              ? `Escucha continua activa: di "oye ${ASSISTANT_NAME}" en cualquier momento.`
              : "Presiona Espacio (o Ctrl + Mayús + Espacio) para hablar. Escape detiene."}
          </p>
          {showHelp && (
            <p className="mt-2 rounded-lg bg-[#fff7ed] px-3 py-2 text-xs leading-relaxed text-[#8a5a2c]">
              {HELP_MESSAGE}
            </p>
          )}
          {simulation && simulationLog.length > 0 && (
            <div className="mt-3 space-y-1 rounded-lg border border-[#dce9e7] bg-[#f7f8ff] px-3 py-2 text-xs text-[#36414f]">
              <p className="font-bold text-[#5b4bdb]">Detalle de la simulación</p>
              {simulationLog.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          )}
          {history.length > 0 && (
            <div className="mt-3 max-h-36 space-y-1.5 overflow-y-auto border-t border-[#eef2f1] pt-2 text-xs text-[#688084]">
              {history.map((item, index) => (
                <p key={index}>
                  <strong className="text-[#26356b]">Tú:</strong> {item.you}
                  <br />
                  <strong className="text-[#5b4bdb]">{ASSISTANT_NAME}:</strong> {item.assistant}
                </p>
              ))}
            </div>
          )}
          <form onSubmit={handleTypedSubmit} className="mt-3 flex items-center gap-2 border-t border-[#eef2f1] pt-3">
            <Keyboard size={15} className="shrink-0 text-[#8a9a9b]" aria-hidden="true" />
            <label className="sr-only" htmlFor="voice-assistant-text-input">
              Escribe una orden para el asistente
            </label>
            <input
              id="voice-assistant-text-input"
              value={typed}
              onChange={event => setTyped(event.target.value)}
              placeholder="O escribe tu orden…"
              className="focus-ring w-full rounded-lg border border-[#dce9e7] px-3 py-1.5 text-sm text-[#26356b] outline-none"
            />
          </form>
          <p className="mt-2 text-[11px] leading-snug text-[#8a9a9b]">
            No grabamos audio. Tu orden y el contenido visible de la pantalla se envían al servicio de IA (Claude) solo para responderte; nunca las contraseñas.
          </p>
        </section>
      )}
      <button
        type="button"
        onClick={() => (open ? (mode === "conversation" ? stopEverything() : startConversation()) : setOpen(true))}
        aria-label={
          open
            ? mode === "conversation"
              ? "Terminar la conversación con el asistente"
              : "Hablar con el asistente"
            : "Abrir el asistente de voz. También puedes presionar Espacio para hablar"
        }
        aria-pressed={mode === "conversation"}
        data-ai-action="open-assistant"
        className={`flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white shadow-lift transition ${mode === "conversation" ? "bg-[#5b4bdb]" : "bg-[#26356b] hover:bg-[#4036a5]"}`}
      >
        {speech.recognitionSupported ? (
          <Mic size={18} className={speech.status === "listening" ? "animate-pulse" : ""} />
        ) : (
          <MicOff size={18} />
        )}
        {mode === "conversation" ? "Escuchando" : `Hablar con ${ASSISTANT_NAME}`}
      </button>
    </div>
  );
}
