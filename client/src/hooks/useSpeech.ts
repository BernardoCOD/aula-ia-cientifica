import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shouldInterrupt } from "@/lib/bargeIn";

// Reconocimiento (voz a texto) y síntesis (texto a voz) con la Web Speech API del navegador.
// Mientras el asistente habla, el micrófono sigue abierto para que la persona pueda interrumpirlo
// hablando ("barge-in"). Lo que se oye se compara con lo que se está leyendo, para no confundir la
// propia voz del asistente (captada por los parlantes) con una orden.

type RecognitionAlternative = { transcript: string; confidence: number };
type RecognitionResult = ArrayLike<RecognitionAlternative> & { isFinal: boolean };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
    webkitAudioContext?: typeof AudioContext;
  }
}

export type SpeechStatus = "idle" | "listening" | "speaking";

export type ListenOptions = {
  /** Sigue escuchando frase tras frase (se usa para la palabra de activación). */
  continuous?: boolean;
  onResult: (text: string) => void;
  /** Se llama si terminó sin captar ninguna frase (silencio o error). */
  onSilence?: (reason: "no-speech" | "error" | "not-allowed") => void;
};

export type SpeakOptions = {
  onBargeIn?: (heard: string) => void;
  onBlocked?: () => void;
};

const RATE_KEY = "aula-ia-speech-rate";
const RECOGNITION_LANG = "es-PE";

export const recognitionSupported = () =>
  typeof window !== "undefined" &&
  Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
export const synthesisSupported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;
/**
 * Interrumpir hablando. En Android, abrir el micrófono corta el audio de la lectura, así que allí
 * se interrumpe tocando la pantalla o el botón del asistente.
 */
export const bargeInSupported = () =>
  recognitionSupported() && !/android/i.test(navigator.userAgent);

/** Tono corto que indica por sonido que el micrófono se abrió o se cerró. */
function playTone(kind: "on" | "off") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const context = new AudioCtx();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = kind === "on" ? 880 : 440;
    gain.gain.value = 0.06;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    oscillator.onended = () => void context.close().catch(() => undefined);
  } catch {
    // El navegador puede bloquear el audio hasta la primera interacción; queda el indicador visual.
  }
}

/** Prefiere voces en español latinoamericano y, entre ellas, las de mejor calidad. */
function pickSpanishVoice() {
  const voices = window.speechSynthesis.getVoices().filter(voice =>
    voice.lang.toLowerCase().startsWith("es")
  );
  const score = (voice: SpeechSynthesisVoice) => {
    const lang = voice.lang.toLowerCase();
    let value = 0;
    if (lang === "es-pe") value += 40;
    else if (["es-419", "es-us", "es-mx", "es-co", "es-cl", "es-ar"].includes(lang))
      value += 30;
    else if (lang === "es-es") value += 10;
    if (/natural|online|neural|google/i.test(voice.name)) value += 20;
    if (voice.localService) value += 2;
    return value;
  };
  return voices.sort((a, b) => score(b) - score(a))[0];
}

/** Divide el texto en frases: Chrome corta las locuciones largas a los ~15 segundos. */
function splitIntoChunks(text: string) {
  const sentences = text.replace(/\s+/g, " ").match(/[^.!?;:]+[.!?;:]*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > 220 && current) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function useSpeech() {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rate, setRateState] = useState(() => {
    try {
      return Number(localStorage.getItem(RATE_KEY)) || 1;
    } catch {
      return 1;
    }
  });
  const rateRef = useRef(rate);
  const recognitionRef = useRef<Recognition | null>(null);
  const speakTokenRef = useRef(0);
  const voiceRef = useRef<SpeechSynthesisVoice | undefined>(undefined);

  useEffect(() => {
    if (!synthesisSupported()) return;
    const load = () => (voiceRef.current = pickSpanishVoice());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
      recognitionRef.current?.abort();
    };
  }, []);

  const setRate = useCallback((value: number) => {
    const next = Math.min(1.6, Math.max(0.6, Math.round(value * 100) / 100));
    rateRef.current = next;
    setRateState(next);
    try {
      localStorage.setItem(RATE_KEY, String(next));
    } catch {}
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.abort();
      setStatus(current => (current === "listening" ? "idle" : current));
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    speakTokenRef.current++;
    if (synthesisSupported()) window.speechSynthesis.cancel();
    setStatus(current => (current === "speaking" ? "idle" : current));
  }, []);

  /**
   * Escucha mientras el asistente habla. Si la persona dice algo que no es el eco de la lectura, la
   * voz se calla al instante y onBargeIn recibe la frase completa ("" si no se entendió).
   */
  const listenWhileSpeaking = useCallback(
    (token: number, spoken: string, onBargeIn: (heard: string) => void) => {
      const RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!RecognitionClass) return;
      const recognition = new RecognitionClass();
      recognition.lang = RECOGNITION_LANG;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
      let interrupted = false;
      const finish = (heard: string) => {
        recognitionRef.current = null;
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;
        recognition.abort();
        setStatus("idle");
        onBargeIn(heard);
      };
      recognition.onresult = event => {
        let finalText = "";
        let interim = "";
        for (let index = event.resultIndex; index < event.results.length; index++) {
          const result = event.results[index];
          const text = result[0]?.transcript ?? "";
          if (result.isFinal) finalText += text;
          else interim += text;
        }
        const heard = (finalText || interim).trim();
        if (!heard) return;
        if (!interrupted) {
          if (!shouldInterrupt(heard, spoken, Boolean(finalText.trim()))) return;
          // La persona está hablando: el asistente se calla y la escucha hasta el final de la frase.
          interrupted = true;
          speakTokenRef.current++;
          window.speechSynthesis.cancel();
          setStatus("listening");
        }
        setTranscript(heard);
        if (finalText.trim()) finish(finalText.trim());
      };
      recognition.onerror = () => undefined;
      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return;
        if (interrupted) return finish("");
        // Chrome cierra la escucha cada cierto tiempo: se reabre mientras siga la lectura.
        if (token === speakTokenRef.current) {
          try {
            recognition.start();
          } catch {
            recognitionRef.current = null;
          }
        }
      };
      try {
        recognition.start();
      } catch {
        recognitionRef.current = null;
      }
    },
    []
  );

  /**
   * Lee el texto en voz alta y llama a onDone al terminar.
   * - onBargeIn: la persona puede interrumpir hablando; entonces se llama onBargeIn (con lo que dijo)
   *   en lugar de onDone.
   * - onBlocked: el navegador no deja hablar a la página hasta que la persona la toque una vez.
   */
  const speak = useCallback(
    (
      text: string,
      onDone?: () => void,
      { onBargeIn, onBlocked }: SpeakOptions = {}
    ) => {
      stopListening();
      const token = ++speakTokenRef.current;
      if (!synthesisSupported() || !text.trim()) {
        onDone?.();
        return;
      }
      window.speechSynthesis.cancel();
      const chunks = splitIntoChunks(text);
      setStatus("speaking");
      if (onBargeIn && bargeInSupported()) listenWhileSpeaking(token, text, onBargeIn);
      const next = (index: number) => {
        if (token !== speakTokenRef.current) return;
        if (index >= chunks.length) {
          stopListening();
          setStatus("idle");
          onDone?.();
          return;
        }
        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.lang = voiceRef.current?.lang ?? "es-US";
        if (voiceRef.current) utterance.voice = voiceRef.current;
        utterance.rate = rateRef.current;
        utterance.onend = () => next(index + 1);
        utterance.onerror = event => {
          if (event.error === "not-allowed" && token === speakTokenRef.current) {
            speakTokenRef.current++;
            stopListening();
            setStatus("idle");
            if (onBlocked) onBlocked();
            else onDone?.();
            return;
          }
          next(index + 1);
        };
        window.speechSynthesis.speak(utterance);
      };
      next(0);
    },
    [stopListening, listenWhileSpeaking]
  );

  const listen = useCallback(
    ({ continuous = false, onResult, onSilence }: ListenOptions) => {
      const RecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!RecognitionClass) {
        setError(
          "Este navegador no reconoce la voz. Usa Google Chrome o Microsoft Edge, o escribe tu orden."
        );
        return false;
      }
      // Nunca dos sesiones a la vez, y nunca escuchar mientras se habla.
      stopListening();
      if (speakTokenRef.current && window.speechSynthesis?.speaking) stopSpeaking();
      const recognition = new RecognitionClass();
      recognition.lang = RECOGNITION_LANG;
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
      let heardSomething = false;
      let failure: "no-speech" | "error" | "not-allowed" = "no-speech";
      setError(null);
      setTranscript("");

      let announcedStart = false;
      recognition.onstart = () => {
        setStatus("listening");
        // En escucha continua el reconocimiento se reinicia seguido: el tono suena solo la primera vez.
        if (!announcedStart) playTone("on");
        announcedStart = true;
      };
      recognition.onresult = event => {
        setError(null);
        let interim = "";
        for (let index = event.resultIndex; index < event.results.length; index++) {
          const result = event.results[index];
          const text = result[0]?.transcript ?? "";
          if (result.isFinal) {
            if (text.trim()) {
              heardSomething = true;
              setTranscript(text.trim());
              onResult(text.trim());
            }
          } else interim += text;
        }
        if (interim) setTranscript(interim.trim());
      };
      recognition.onerror = event => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          failure = "not-allowed";
          setError(
            "No tengo permiso para usar el micrófono. Actívalo en el candado de la barra de direcciones del navegador."
          );
        } else if (event.error === "network") {
          failure = "error";
          setError(
            "No pude conectar con el servicio de reconocimiento de voz. Revisa tu conexión a internet y abre la app en Google Chrome o Microsoft Edge (con el archivo Iniciar Aula IA)."
          );
        } else if (event.error !== "no-speech" && event.error !== "aborted") {
          failure = "error";
        }
      };
      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return;
        // En modo continuo (palabra de activación), Chrome corta cada cierto tiempo: se reanuda.
        // Tras un error de red se espera unos segundos para no reintentar en bucle.
        if (continuous && failure !== "not-allowed") {
          const retryDelay = failure === "error" ? 3000 : 0;
          failure = "no-speech";
          window.setTimeout(() => {
            if (recognitionRef.current !== recognition) return;
            try {
              recognition.start();
            } catch {
              recognitionRef.current = null;
              setStatus(current => (current === "listening" ? "idle" : current));
            }
          }, retryDelay);
          return;
        }
        recognitionRef.current = null;
        setStatus(current => (current === "listening" ? "idle" : current));
        playTone("off");
        if (!heardSomething) onSilence?.(failure);
      };
      try {
        recognition.start();
        return true;
      } catch {
        recognitionRef.current = null;
        return false;
      }
    },
    [stopListening, stopSpeaking]
  );

  return useMemo(
    () => ({
      status,
      transcript,
      error,
      setError,
      rate,
      setRate,
      listen,
      stopListening,
      speak,
      stopSpeaking,
      recognitionSupported: recognitionSupported(),
      synthesisSupported: synthesisSupported(),
    }),
    [status, transcript, error, rate, setRate, listen, stopListening, speak, stopSpeaking]
  );
}
