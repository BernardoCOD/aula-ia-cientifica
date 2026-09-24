import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Lightbulb,
  MessageSquareText,
  SearchCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  getProgress,
  getStudent,
  moduleById,
  modules,
  setProgress,
} from "@/lib/student";
import { useAssistantScreen } from "@/contexts/AssistantContext";
import { lessons as content } from "@shared/course";

export default function ModulePage() {
  const [, params] = useRoute("/modulo/:id");
  const [, navigate] = useLocation();
  const id = params?.id ?? "m1";
  const module = moduleById(id);
  const lesson = content[id] ?? content.m1;
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState((getProgress()[id] ?? 0) >= 100);
  const student = getStudent();
  const mutation = trpc.student.progress.useMutation();
  const complete = async () => {
    setProgress(id, 100);
    setDone(true);
    if (student) {
      try {
        await mutation.mutateAsync({
          code: student.code,
          moduleId: id,
          percentage: 100,
          status: "completed",
        });
      } catch {}
    }
    toast.success("Módulo completado y guardado.");
  };
  useAssistantScreen(
    {
      mode: "learning",
      route: `/modulo/${id}`,
      moduleId: id,
      moduleTitle: `${module.number}. ${module.title}`,
      currentContent: `${lesson.intro} Actividad de comprobación: ${lesson.exercise}`,
    },
    {
      onStartActivity: () =>
        document
          .getElementById("module-exercise")
          ?.scrollIntoView({ behavior: "smooth" }),
    }
  );
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
            <Sparkles size={17} className="text-[#e27a4f]" /> Aula IA
          </div>
          <span className="hidden text-xs font-bold uppercase tracking-[.13em] text-[#8a9a9b] sm:block">
            Módulo {module.number}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-20 pt-10 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span
              className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${module.color}`}
            >
              {module.icon}
            </span>
            <p className="mt-7 text-sm font-bold uppercase tracking-[.15em] text-[#e27a4f]">
              {lesson.eyebrow}
            </p>
            <h1 className="mt-2 text-4xl font-bold text-[#26356b] sm:text-5xl">
              {module.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#688084]">
              {lesson.intro}
            </p>
          </div>
          {done && (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#e4e8ff] px-4 py-2 text-sm font-bold text-[#5b4bdb]">
              <CheckCircle2 size={17} /> Completado
            </span>
          )}
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {lesson.points.map((point, index) => (
            <div
              key={point.title}
              className="rounded-2xl bg-white p-6 shadow-soft"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef8f6] text-[#5b4bdb]">
                {index === 0 ? (
                  <Lightbulb size={20} />
                ) : (
                  <SearchCheck size={20} />
                )}
              </div>
              <h2 className="mt-5 text-xl font-bold text-[#26356b]">
                {point.title}
              </h2>
              <p className="mt-2 leading-relaxed text-[#688084]">
                {point.text}
              </p>
            </div>
          ))}
        </div>
        <section
          id="module-exercise"
          className="mt-8 rounded-[2rem] bg-[#26356b] p-7 text-white shadow-lift sm:p-9"
        >
          <div className="flex items-center gap-3 text-[#c8c9ff]">
            <MessageSquareText size={21} />
            <p className="text-sm font-bold uppercase tracking-[.14em]">
              Comprueba lo que entendiste
            </p>
          </div>
          <h2 className="mt-5 text-2xl font-bold">{lesson.exercise}</h2>
          <div className="mt-6 space-y-2">
            {lesson.options.map((option, index) => (
              <button
                key={option}
                onClick={() => setSelected(index)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition ${selected === index ? (index === lesson.correct ? "border-[#b9b7ff] bg-[#4b55a5]" : "border-[#f4a67d] bg-[#704c4d]") : "border-[#6972bd] hover:bg-[#3d478e]"}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#8ccbc4] text-xs">
                  {selected === index && (index === lesson.correct ? "✓" : "×")}
                </span>
                {option}
              </button>
            ))}
          </div>
          {selected !== null && (
            <div
              className={`mt-6 flex items-start gap-3 rounded-xl p-4 text-sm ${selected === lesson.correct ? "bg-[#4b55a5] text-[#e6f5f2]" : "bg-[#704c4d] text-[#fff1ed]"}`}
            >
              {selected === lesson.correct ? (
                <CheckCircle2 size={19} />
              ) : (
                <CircleAlert size={19} />
              )}
              <span>
                {selected === lesson.correct
                  ? "¡Bien! Lo importante es poder explicar por qué."
                  : "Aún no. Vuelve al contenido, busca la idea central y prueba otra vez."}
              </span>
            </div>
          )}
        </section>
        <div className="mt-8 flex flex-col justify-between gap-4 border-t border-[#dce9e7] pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-[#789093]">
            {done
              ? "Puedes volver a este módulo cuando quieras."
              : "Marca el módulo cuando logres explicarlo con tus palabras."}
          </p>
          {done ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#26356b] px-5 py-3 font-bold text-white"
            >
              Volver a la ruta <ArrowRight size={17} />
            </button>
          ) : (
            <button
              disabled={selected !== lesson.correct}
              onClick={complete}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e27a4f] px-5 py-3 font-bold text-[#26356b] transition hover:bg-[#f4a67d] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Marcar como completado <Check size={17} />
            </button>
          )}
        </div>
        <div className="mt-8 flex flex-wrap gap-2 text-xs font-bold text-[#789093]">
          <span className="rounded-full bg-white px-3 py-2 shadow-sm">
            Piensa
          </span>
          <ArrowRight size={14} className="mt-2" />
          <span className="rounded-full bg-white px-3 py-2 shadow-sm">
            Consulta
          </span>
          <ArrowRight size={14} className="mt-2" />
          <span className="rounded-full bg-white px-3 py-2 shadow-sm">
            Verifica
          </span>
          <ArrowRight size={14} className="mt-2" />
          <span className="rounded-full bg-[#e4e8ff] px-3 py-2 text-[#5b4bdb] shadow-sm">
            Comunica
          </span>
        </div>
      </main>
    </div>
  );
}
