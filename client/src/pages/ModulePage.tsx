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

const content: Record<
  string,
  {
    eyebrow: string;
    intro: string;
    points: { title: string; text: string }[];
    exercise: string;
    options: string[];
    correct: number;
  }
> = {
  m1: {
    eyebrow: "Comprender con apoyo",
    intro:
      "La inteligencia artificial puede ayudarte a entender contenidos de clase, proponer ejemplos y ofrecer otra explicación. Sus respuestas no garantizan verdad ni comprensión: tú decides qué te sirve y debes revisar lo que produce.",
    points: [
      {
        title: "Para aprender",
        text: "Pide explicaciones graduales, ejemplos, comparaciones y preguntas para comprobar tu comprensión.",
      },
      {
        title: "Tu criterio",
        text: "La herramienta genera resultados a partir de patrones; no reemplaza tu lectura, análisis ni decisión.",
      },
    ],
    exercise:
      "Una respuesta de IA explica un tema de ciencias. ¿Qué demuestra aprendizaje?",
    options: [
      "Copiarla sin leer.",
      "Comprenderla, comprobarla y explicarla con tus palabras.",
      "Elegir la más larga.",
    ],
    correct: 1,
  },
  m2: {
    eyebrow: "Preguntar para aprender",
    intro:
      "Una instrucción clara orienta a la IA hacia una ayuda concreta. Incluye el tema, el propósito, el contexto y el formato que necesitas; así la respuesta puede convertirse en una oportunidad de aprendizaje.",
    points: [
      {
        title: "Da contexto",
        text: "Indica el grado, el tema, lo que ya intentaste y la parte que no comprendes.",
      },
      {
        title: "Pide una acción",
        text: "Solicita explicar, comparar, dar una pista, formular preguntas o revisar un procedimiento.",
      },
    ],
    exercise: "¿Cuál pedido ayuda mejor a estudiar un concepto?",
    options: [
      "Explícame esto.",
      "Haz mi tarea.",
      "Explica el concepto para mi grado, con un ejemplo y una pregunta para comprobarlo.",
    ],
    correct: 2,
  },
  m3: {
    eyebrow: "Pensar antes de delegar",
    intro:
      "La IA puede acompañar la resolución de problemas, pero tu razonamiento debe estar presente. Empieza con un intento propio y pide pistas o retroalimentación para revisar tus pasos, no una solución para copiar.",
    points: [
      {
        title: "Primero intenta",
        text: "Anota qué sabes, qué estrategia elegiste y dónde aparece tu duda.",
      },
      {
        title: "Después consulta",
        text: "Pide que señale un posible error, un contraejemplo o una pista sin resolver todo.",
      },
    ],
    exercise: "¿Qué solicitud mantiene activo tu razonamiento?",
    options: [
      "Dame solo la respuesta.",
      "Revisa mi procedimiento y dame una pista sobre el paso que debo reconsiderar.",
      "Resuelve todo con palabras difíciles.",
    ],
    correct: 1,
  },
  m4: {
    eyebrow: "Antes de creer",
    intro:
      "Una respuesta de IA puede ser correcta, incompleta o inventada. Verificar implica identificar afirmaciones, revisar autores y fechas, buscar la fuente original y contrastar la evidencia antes de usarla en clase.",
    points: [
      {
        title: "Contrasta",
        text: "Compara la afirmación con libros, artículos, instituciones u otras fuentes confiables.",
      },
      {
        title: "Detecta alertas",
        text: "Desconfía de citas inexistentes, datos sin origen, contradicciones y seguridad sin evidencias.",
      },
    ],
    exercise: "La IA menciona un estudio que no encuentras. ¿Qué haces?",
    options: [
      "Lo citas porque suena académico.",
      "Buscas la fuente y no lo usas hasta confirmar que existe.",
      "Le pides a la misma IA que lo confirme.",
    ],
    correct: 1,
  },
  m5: {
    eyebrow: "Investigar y organizar",
    intro:
      "La IA puede ayudarte a ordenar preguntas, subtemas y posibles relaciones para iniciar una investigación. No debe reemplazar la lectura de fuentes ni decidir por ti qué evidencia es válida.",
    points: [
      {
        title: "Organiza",
        text: "Pide categorías, preguntas de investigación o un esquema que después revisarás.",
      },
      {
        title: "Investiga",
        text: "Consulta fuentes reales, registra sus datos y decide con argumentos qué información utilizar.",
      },
    ],
    exercise: "¿Qué tarea puede apoyar la IA sin reemplazar tu investigación?",
    options: [
      "Elegir la conclusión definitiva.",
      "Proponer subtemas y preguntas para luego investigar en fuentes confiables.",
      "Inventar referencias.",
    ],
    correct: 1,
  },
  m6: {
    eyebrow: "Comunicar con criterio",
    intro:
      "Aprender con IA termina cuando puedes explicar, argumentar y comunicar una elaboración propia. Usa la herramienta como una segunda mirada, protege tus datos, reconoce la ayuda y conserva la responsabilidad sobre tu trabajo.",
    points: [
      {
        title: "Elabora",
        text: "Relaciona ideas, evidencias y conclusiones; no entregues un texto que no puedes explicar.",
      },
      {
        title: "Actúa con ética",
        text: "Protege información personal, evita inventar fuentes y transparenta cuándo recibiste apoyo.",
      },
    ],
    exercise: "¿Qué hace responsable una entrega apoyada por IA?",
    options: [
      "Presentar todo como propio.",
      "Revisar, comprender, citar o reconocer la ayuda y escribir una versión propia.",
      "Compartir contraseñas para dar contexto.",
    ],
    correct: 1,
  },
};

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
