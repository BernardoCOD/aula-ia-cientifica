import {
  ArrowLeft,
  ExternalLink,
  Globe2,
  Loader2,
  Search,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { getStudent } from "@/lib/student";
import {
  useAssistantContext,
  useAssistantScreen,
} from "@/contexts/AssistantContext";

type Entry = {
  question: string;
  answer: string;
  related: boolean;
  sources: { title: string; url: string }[];
};

const EXAMPLES = [
  "¿Cómo puedo saber si una noticia sobre inteligencia artificial es verdadera?",
  "¿Qué herramientas de IA ayudan a personas con discapacidad visual?",
  "¿Cómo escribir un buen prompt para estudiar ciencias?",
  "¿Qué riesgos de privacidad tiene usar chatbots de IA?",
];

/**
 * Área de consultas: búsqueda en internet (con Claude) limitada a los temas de la capacitación.
 * Las respuestas se leen en voz alta y muestran sus fuentes. Se puede abrir con ?q= desde el
 * asistente de voz ("busca en consultas...") y la búsqueda arranca sola.
 */
export default function ConsultasPage() {
  const search = useSearch();
  const { speakRef } = useAssistantContext();
  const [question, setQuestion] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const ask = trpc.consultas.ask.useMutation();
  const lastAutoQuery = useRef<string | null>(null);
  const latest = entries[0];

  useAssistantScreen({
    mode: "learning",
    route: "/consultas",
    currentContent: ask.isPending
      ? "Buscando información en internet, espera unos segundos."
      : latest
        ? `Última consulta: ${latest.question}. Respuesta: ${latest.answer}`
        : "Área de consultas. Haz una pregunta sobre inteligencia artificial, uso responsable de la IA, verificación de información o accesibilidad, y buscaré en internet con fuentes.",
  });

  const submit = async (text: string, announce = true) => {
    const value = text.trim();
    if (value.length < 3 || ask.isPending) return;
    setError(null);
    // Si la búsqueda la pidió el asistente por voz, él ya avisó que está buscando.
    if (announce) speakRef.current("Buscando, dame unos segundos.");
    try {
      const result = await ask.mutateAsync({
        question: value,
        studentCode: getStudent()?.code,
        history: entries
          .filter(entry => entry.related)
          .slice(0, 2)
          .map(entry => ({ question: entry.question, answer: entry.answer.slice(0, 3900) })),
      });
      setEntries(previous => [{ question: value, ...result }, ...previous].slice(0, 10));
      setQuestion("");
      speakRef.current(
        result.related && result.sources.length
          ? `${result.answer} Encontré ${result.sources.length} fuentes; están en la lista de la pantalla.`
          : result.answer
      );
    } catch (caught) {
      const message =
        caught instanceof Error && caught.message
          ? caught.message
          : "No pude completar la búsqueda. Inténtalo otra vez.";
      setError(message);
      speakRef.current(message);
    }
  };

  // Búsqueda iniciada por el asistente de voz: /consultas?q=...
  useEffect(() => {
    const query = new URLSearchParams(search).get("q");
    if (query && query !== lastAutoQuery.current) {
      lastAutoQuery.current = query;
      setQuestion(query);
      void submit(query, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(question);
  };

  return (
    <div className="min-h-screen bg-[#f5faf9]">
      <header className="border-b border-[#dce9e7] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-[#547074]">
            <ArrowLeft size={17} /> Volver a mi ruta
          </Link>
          <div className="flex items-center gap-2 text-sm font-bold text-[#26356b]">
            <Sparkles size={17} className="text-[#e27a4f]" /> Aula IA
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-10 lg:px-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e4e8ff] text-[#5b4bdb]">
          <Globe2 size={26} />
        </div>
        <p className="mt-6 text-sm font-bold uppercase tracking-[.15em] text-[#e27a4f]">
          Investiga con fuentes
        </p>
        <h1 className="mt-2 text-4xl font-bold text-[#26356b] sm:text-5xl">
          Área de consultas
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#688084]">
          Pregunta sobre inteligencia artificial, su uso responsable para aprender, cómo verificar
          información o tecnologías de accesibilidad. Busco en internet y te muestro las fuentes
          para que puedas comprobarlas.
        </p>

        <form onSubmit={onSubmit} className="mt-8 rounded-2xl bg-white p-5 shadow-soft">
          <label htmlFor="consulta" className="text-sm font-bold text-[#26356b]">
            Tu pregunta
          </label>
          <textarea
            id="consulta"
            name="consulta"
            value={question}
            onChange={event => setQuestion(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit(question);
              }
            }}
            rows={3}
            maxLength={600}
            placeholder="Ejemplo: ¿Cómo sé si una imagen fue creada con IA?"
            className="focus-ring mt-2 w-full rounded-xl border border-[#dce9e7] px-4 py-3 text-[#26356b] outline-none"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#789093]">
              También puedes decirle al asistente: “busca en consultas…”.
            </p>
            <button
              type="submit"
              disabled={ask.isPending || question.trim().length < 3}
              className="inline-flex items-center gap-2 rounded-xl bg-[#26356b] px-5 py-3 font-bold text-white disabled:opacity-50"
            >
              {ask.isPending ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
              {ask.isPending ? "Buscando…" : "Buscar"}
            </button>
          </div>
        </form>

        {entries.length === 0 && !ask.isPending && (
          <section aria-labelledby="ejemplos" className="mt-8">
            <h2 id="ejemplos" className="text-lg font-bold text-[#26356b]">
              Preguntas de ejemplo
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {EXAMPLES.map(example => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setQuestion(example);
                    void submit(example);
                  }}
                  className="rounded-xl border border-[#dce9e7] bg-white px-4 py-3 text-left text-sm text-[#547074] hover:bg-[#f0f8f7]"
                >
                  {example}
                </button>
              ))}
            </div>
          </section>
        )}

        {ask.isPending && (
          <p role="status" className="mt-8 flex items-center gap-2 text-[#5b4bdb]">
            <Loader2 size={18} className="animate-spin" /> Buscando en internet…
          </p>
        )}
        {error && (
          <p role="alert" className="mt-8 rounded-xl border border-[#f0d5c4] bg-[#fff7ed] px-4 py-3 text-sm text-[#8a5a2c]">
            {error}
          </p>
        )}

        <div className="mt-8 space-y-5">
          {entries.map((entry, index) => (
            <article key={`${entry.question}-${index}`} className="rounded-2xl bg-white p-6 shadow-soft">
              <h2 className="text-xl font-bold text-[#26356b]">{entry.question}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-[#4b686c]">
                {entry.answer.split(/\n{2,}/).map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex}>{paragraph}</p>
                ))}
              </div>
              {entry.sources.length > 0 && (
                <div className="mt-5 border-t border-[#eef2f1] pt-4">
                  <h3 className="text-sm font-bold text-[#26356b]">Fuentes</h3>
                  <ul className="mt-2 space-y-1.5">
                    {entry.sources.map(source => (
                      <li key={source.url}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-start gap-1.5 text-sm text-[#5b4bdb] underline-offset-2 hover:underline"
                        >
                          <ExternalLink size={14} className="mt-0.5 shrink-0" />
                          {source.title}
                          <span className="sr-only"> (se abre en otra pestaña)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                onClick={() => speakRef.current(entry.answer)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#dce9e7] px-3 py-2 text-sm font-bold text-[#26356b]"
              >
                <Volume2 size={15} /> Escuchar respuesta
              </button>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
