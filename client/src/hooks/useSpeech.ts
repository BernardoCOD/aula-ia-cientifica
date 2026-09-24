import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionResultLike = { transcript: string; confidence: number };
type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  }
}
export type SpeechStatus =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error";
export function getSpeechRecognitionSupport() {
  return (
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}
export function getSpeechSynthesisSupport() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Señal sonora breve del estado del micrófono (además del indicador visual), sin depender de archivos de audio externos. */
function playMicTone(kind: "on" | "off") {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const context = new AudioCtx();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = kind === "on" ? 880 : 440;
    gain.gain.value = 0.06;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    oscillator.onended = () => context.close().catch(() => undefined);
  } catch {
    // Si el navegador bloquea audio sin interacción previa, el indicador visual sigue disponible.
  }
}

type ListenOptions = { continuous?: boolean };

export function useSpeech() {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const keepListeningRef = useRef(false);
  const speechSupported = getSpeechRecognitionSupport();
  const synthesisSupported = getSpeechSynthesisSupport();

  useEffect(
    () => () => {
      keepListeningRef.current = false;
      recognitionRef.current?.abort();
      if (synthesisSupported) window.speechSynthesis.cancel();
    },
    [synthesisSupported]
  );

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      if (!synthesisSupported || !text) {
        onDone?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.rate = rate;
      setStatus("speaking");
      utterance.onend = () => {
        setStatus("idle");
        onDone?.();
      };
      utterance.onerror = () => {
        setStatus("idle");
        onDone?.();
      };
      window.speechSynthesis.speak(utterance);
    },
    [rate, synthesisSupported]
  );

  const stopSpeaking = useCallback(() => {
    if (synthesisSupported) window.speechSynthesis.cancel();
    setStatus("idle");
  }, [synthesisSupported]);
  const resumeSpeaking = useCallback(() => {
    if (synthesisSupported) window.speechSynthesis.resume();
  }, [synthesisSupported]);
  const listen = useCallback(
    (onResult: (text: string) => void, options: ListenOptions = {}) => {
      if (!speechSupported) {
        setStatus("error");
        setErrorMessage(
          "Tu navegador no admite reconocimiento de voz. Puedes escribir el comando o usar el teclado y los enlaces de la pantalla."
        );
        return;
      }
      const Recognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) return;
      const continuous = Boolean(options.continuous);
      keepListeningRef.current = continuous;
      const recognition = new Recognition();
      recognition.lang = "es-ES";
      recognition.continuous = continuous;
      recognition.interimResults = false;
      recognitionRef.current = recognition;
      setErrorMessage(null);
      setTranscript("");
      recognition.onstart = () => {
        setStatus("listening");
        playMicTone("on");
      };
      recognition.onresult = event => {
        const last = event.results.length - 1;
        const text = event.results?.[last]?.[0]?.transcript ?? "";
        if (text) {
          setTranscript(text);
          setStatus("processing");
          onResult(text);
          if (continuous) setStatus("listening");
        }
      };
      recognition.onerror = () => {
        if (!keepListeningRef.current) {
          setStatus("error");
          setErrorMessage(
            "Parece que no pude reconocer tu voz. Puedes intentarlo nuevamente o utilizar el teclado."
          );
          playMicTone("off");
        }
      };
      recognition.onend = () => {
        if (keepListeningRef.current)
          window.setTimeout(() => {
            try {
              recognition.start();
            } catch {}
          }, 250);
        else
          setStatus(current => {
            if (current === "listening") playMicTone("off");
            return current === "listening" ? "idle" : current;
          });
      };
      try {
        recognition.start();
      } catch {
        setStatus("error");
      }
    },
    [speechSupported]
  );
  const stopListening = useCallback(() => {
    const wasListening = keepListeningRef.current || status === "listening";
    keepListeningRef.current = false;
    recognitionRef.current?.stop();
    if (wasListening) playMicTone("off");
  }, [status]);
  return {
    status,
    setStatus,
    transcript,
    errorMessage,
    setErrorMessage,
    speechSupported,
    synthesisSupported,
    rate,
    setRate,
    listen,
    stopListening,
    speak,
    stopSpeaking,
    resumeSpeaking,
  };
}
