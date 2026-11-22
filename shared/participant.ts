// Código de participante: cada persona crea el suyo al entrar (por ejemplo "P01") y lo usa para
// volver a su avance. No se piden nombres ni datos personales. Como el código suele dictarse por voz,
// aquí se convierte lo dictado ("pe cero uno", "mi código es P 1 2") en un código compacto ("P01", "P12").

export const PARTICIPANT_CODE_PATTERN = /^[A-Z0-9_-]{2,32}$/;

// Letras tal como se pronuncian en español.
const SPOKEN_LETTERS: Record<string, string> = {
  a: "A", be: "B", ce: "C", de: "D", e: "E", efe: "F", ge: "G", hache: "H", i: "I", jota: "J",
  ka: "K", ele: "L", eme: "M", ene: "N", o: "O", pe: "P", cu: "Q", erre: "R", ere: "R", ese: "S",
  te: "T", u: "U", uve: "V", ve: "V", equis: "X", ye: "Y", zeta: "Z", seta: "Z",
};

const SPOKEN_NUMBERS: Record<string, string> = {
  cero: "0", uno: "1", una: "1", un: "1", dos: "2", tres: "3", cuatro: "4", cinco: "5", seis: "6",
  siete: "7", ocho: "8", nueve: "9", diez: "10", once: "11", doce: "12", trece: "13", catorce: "14",
  quince: "15", dieciseis: "16", diecisiete: "17", dieciocho: "18", diecinueve: "19", veinte: "20",
};

/** Palabras de relleno que se dicen antes del código: "mi código es…", "soy el…". */
const FILLER =
  /^soy\s+(?:el\s+)?|^(?:(?:mi|el|tu)\s+)?(?:codigo\b(?:\s+de participante\b)?)?\s*(?:(?:es|sera|seria)\b)?\s*(?:el\s+)?/;

/**
 * Convierte un código escrito o dictado en su forma guardada: mayúsculas, sin espacios.
 * Devuelve "" si no queda un código válido (2 a 32 letras, números, guion o guion bajo).
 */
export function normalizeParticipantCode(input: string): string {
  const words = input
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.,;:¿?¡!"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(FILLER, "")
    .replace(/\bdoble (?:u|ve|uve)\b/g, "w")
    .replace(/\bi griega\b/g, "ye")
    .replace(/\bguion bajo\b/g, "_")
    .replace(/\bguion\b/g, "-")
    .split(" ")
    .filter(Boolean);
  const code = words
    .map(word => SPOKEN_NUMBERS[word] ?? SPOKEN_LETTERS[word] ?? word.toUpperCase())
    .join("");
  return PARTICIPANT_CODE_PATTERN.test(code) ? code : "";
}
