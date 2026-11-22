import { normalizeSpeech } from "./voiceIntents";

// Interrupción por voz ("barge-in"): mientras el asistente habla, el micrófono sigue abierto para que
// la persona pueda interrumpirlo. Como el micrófono también puede captar la voz del asistente por los
// parlantes, lo que se oye se compara con lo que el asistente está diciendo: si coincide, es su propio
// eco y se ignora.

/** Palabras que siempre detienen al asistente, aunque aparezcan en lo que está leyendo. */
const STOP_WORDS =
  /^(?:oye |ok |hey )?(?:para|alto|basta|silencio|callate|detente|stop|espera|jason|yeison)$/;

/** true si lo oído parece la propia voz del asistente captada por el micrófono. */
export function isLikelyEcho(heard: string, spoken: string) {
  const heardText = normalizeSpeech(heard);
  const spokenText = normalizeSpeech(spoken);
  if (!heardText) return true;
  if (spokenText.includes(heardText)) return true;
  const spokenWords = new Set(spokenText.split(" "));
  const words = heardText.split(" ");
  // Las palabras cortas ("a", "la", "de") aparecen en casi cualquier frase: no sirven para decidir.
  const meaningful = words.filter(word => word.length >= 3);
  const sample = meaningful.length ? meaningful : words;
  const found = sample.filter(word => spokenWords.has(word)).length;
  return found / sample.length >= 0.6;
}

/**
 * Decide si lo que se oyó mientras el asistente hablaba es la persona interrumpiendo.
 * Con resultados parciales espera al menos dos palabras, para no cortar por un ruido.
 */
export function shouldInterrupt(heard: string, spoken: string, isFinal: boolean) {
  const heardText = normalizeSpeech(heard);
  if (!heardText) return false;
  if (STOP_WORDS.test(heardText)) return true;
  if (isLikelyEcho(heardText, spoken)) return false;
  return isFinal || heardText.split(" ").length >= 2;
}
