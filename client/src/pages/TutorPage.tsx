import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getStudent } from "@/lib/student";
import { useAssistantScreen } from "@/contexts/AssistantContext";

export default function TutorPage() {
  const student = getStudent();
  const [question, setQuestion] = useState(
    "Explica con tus propias palabras por qué ocurre el efecto invernadero."
  );
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState<{
    result: string;
    score: number;
    feedback: string;
    nextQuestion: string;
  } | null>(null);
  const tutor = trpc.student.tutor.useMutation();
  useAssistantScreen(
    {
      mode: "learning",
      route: "/tutor",
      currentContent: feedback
        ? `Retroalimentación: ${feedback.feedback}. Pregunta de seguimiento: ${feedback.nextQuestion}`
        : "Tutor IA. Escribe tu propio intento para recibir retroalimentación guiada.",
    },
    {
      onStartActivity: () =>
        document
          .querySelector<HTMLTextAreaElement>("textarea:last-of-type")
          ?.focus(),
    }
  );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!student) {
      toast.error("Identifícate antes de usar el tutor.");
      return;
    }
    if (response.trim().length < 10) {
      toast.error(
        "Escribe una respuesta más desarrollada para recibir retroalimentación."
      );
      return;
    }
    try {
      const result = await tutor.mutateAsync({
        code: student.code,
        moduleId: "m6",
        activity: "Explicación científica guiada",
        question,
        response: response.trim(),
      });
      setFeedback(result);
    } catch {
      setFeedback({
        result: "parcial",
        score: 0,
        feedback:
          "No pudimos conectar con el tutor en este momento. Revisa tu idea: define el fenómeno, explica cómo ocurre y agrega un ejemplo que puedas verificar.",
        nextQuestion: "¿Qué evidencia usarías para apoyar tu explicación?",
      });
    }
  };
  return (
    <div className="min-h-screen bg-[#f5faf9]">
      <header className="border-b border-[#dce9e7] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 lg:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-bold text-[#547074]"
          >
            <ArrowLeft size={17} /> Volver a mi ruta
          </Link>
          <div className="flex items-center gap-2 text-sm font-bold text-[#26356b]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#26356b] text-white">
              <Sparkles size={17} />
            </span>
            Aula IA
          </div>
          <span className="text-xs font-bold uppercase tracking-[.14em] text-[#8a9a9b]">
            Tutor IA
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 pb-20 pt-10 lg:px-8">
        <div className="max-w-2xl">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7ddff] text-[#6954a8]">
            <BrainCircuit size={28} />
          </div>
          <p className="text-sm font-bold uppercase tracking-[.15em] text-[#6954a8]">
            Aprende conversando
          </p>
          <h1 className="mt-2 text-4xl font-bold text-[#26356b] sm:text-5xl">
            Tu tutor no responde por ti.
          </h1>
          <p className="mt-4 leading-relaxed text-[#688084]">
            Escribe tu propio intento. El tutor IA analizará tu respuesta, te
            dirá qué puedes revisar y hará una pregunta de seguimiento.
          </p>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.8fr]">
          <form
            onSubmit={submit}
            className="rounded-[2rem] bg-white p-6 shadow-soft sm:p-8"
          >
            <div className="flex items-start gap-3 rounded-2xl bg-[#f5f1ff] p-4 text-sm text-[#6954a8]">
              <HelpCircle size={19} className="mt-0.5 shrink-0" />
              <p>
                <strong>Recuerda:</strong> el tutor ayuda a mejorar una idea; no
                escribe la tarea completa.
              </p>
            </div>
            <label className="mt-7 block">
              <span className="mb-2 block text-sm font-bold text-[#36575b]">
                Pregunta guía
              </span>
              <textarea
                value={question}
                onChange={event => setQuestion(event.target.value)}
                rows={3}
                className="focus-ring w-full resize-none rounded-xl border border-[#cfe0df] bg-[#fbfdfd] px-4 py-3 text-[#26356b] outline-none focus:border-[#6954a8]"
              />
            </label>
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-bold text-[#36575b]">
                Tu respuesta
              </span>
              <textarea
                value={response}
                onChange={event => setResponse(event.target.value)}
                rows={7}
                placeholder="Escribe primero lo que tú piensas…"
                className="focus-ring w-full resize-y rounded-xl border border-[#cfe0df] bg-[#fbfdfd] px-4 py-3 text-[#26356b] outline-none focus:border-[#6954a8]"
              />
            </label>
            <button
              type="submit"
              disabled={tutor.isPending}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#26356b] px-5 py-3.5 font-bold text-white transition hover:bg-[#4036a5] disabled:opacity-60"
            >
              {tutor.isPending
                ? "Analizando tu idea..."
                : "Pedir retroalimentación"}{" "}
              <Send size={17} />
            </button>
          </form>
          <div className="rounded-[2rem] bg-[#26356b] p-6 text-white shadow-lift sm:p-8">
            <div className="flex items-center gap-2 text-[#c8c9ff]">
              <MessageCircle size={19} />
              <span className="text-sm font-bold uppercase tracking-[.13em]">
                Retroalimentación
              </span>
            </div>
            {feedback ? (
              <div className="mt-7">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#4b55a5] px-3 py-1 text-xs font-bold uppercase tracking-[.12em]">
                    {feedback.result}
                  </span>
                  <span className="text-2xl font-bold text-[#f4a67d]">
                    {feedback.score}/100
                  </span>
                </div>
                <p className="mt-6 leading-relaxed text-[#e6f5f2]">
                  {feedback.feedback}
                </p>
                <div className="mt-7 rounded-2xl bg-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-[#c8c9ff]">
                    Pregunta para seguir pensando
                  </p>
                  <p className="mt-2 font-bold text-white">
                    {feedback.nextQuestion}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm text-[#d7d9f5]">
                  <CheckCircle2 size={17} /> Esta interacción queda registrada
                  para tu seguimiento.
                </div>
              </div>
            ) : (
              <div className="mt-8">
                <p className="text-2xl font-bold leading-tight">
                  Primero escribe.
                  <br />
                  <span className="text-[#f4a67d]">Después, mejora.</span>
                </p>
                <p className="mt-4 leading-relaxed text-[#d7d9f5]">
                  Aquí no encontrarás una respuesta lista para copiar.
                  Encontrarás preguntas para comprender mejor.
                </p>
                <div className="mt-9 space-y-3 text-sm text-[#d7d9f5]">
                  <p>01 · Analiza tu respuesta</p>
                  <p>02 · Recibe una pista</p>
                  <p>03 · Reescribe con tu criterio</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
