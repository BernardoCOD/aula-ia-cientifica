import {
  Award,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Flame,
  Globe2,
  House,
  LogOut,
  Menu,
  Milestone,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  addChallenge,
  getChallenges,
  getEvaluations,
  getProgress,
  getStudent,
  modules,
  setProgress,
  type StudentSession,
} from "@/lib/student";
import { useAssistantScreen } from "@/contexts/AssistantContext";

const tabs = [
  { id: "inicio", label: "Inicio", icon: House },
  { id: "modulos", label: "Módulos", icon: BookOpen },
  { id: "retos", label: "Retos", icon: Target },
  { id: "tutor", label: "Tutor IA", icon: CircleHelp },
  { id: "consultas", label: "Consultas", icon: Globe2 },
  { id: "postest", label: "Evaluación final", icon: ClipboardCheck },
  { id: "resultados", label: "Resultados", icon: BarChart3 },
  { id: "perfil", label: "Mi ficha", icon: UserRound },
];
type Tab = (typeof tabs)[number]["id"];

function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-[#d8e9e6] ${className}`}
    >
      <div
        className="h-full rounded-full bg-[#e27a4f] transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
function NavButton({
  tab,
  active,
  onClick,
}: {
  tab: (typeof tabs)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${active ? "bg-[#e4e8ff] text-[#26356b]" : "text-[#749093] hover:bg-[#f0f8f7] hover:text-[#26356b]"}`}
    >
      <Icon size={18} />
      {tab.label}
    </button>
  );
}

export default function StudentDashboard() {
  const [, navigate] = useLocation();
  const [student] = useState<StudentSession | null>(() => getStudent());
  const [active, setActive] = useState<Tab>(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    return tabs.some(tab => tab.id === requested)
      ? (requested as Tab)
      : "inicio";
  });
  const search = useSearch();
  useEffect(() => {
    const requested = new URLSearchParams(search).get("tab");
    if (tabs.some(tab => tab.id === requested)) setActive(requested as Tab);
  }, [search]);
  const [mobileNav, setMobileNav] = useState(false);
  const [localProgress, setLocalProgress] = useState(() => getProgress());
  const [localChallenges, setLocalChallenges] = useState(() => getChallenges());
  const [challengeAnswer, setChallengeAnswer] = useState<string | null>(null);
  const code = student?.code ?? "";
  const queryInput = useMemo(() => ({ code }), [code]);
  const dashboard = trpc.student.dashboard.useQuery(queryInput, {
    enabled: Boolean(code),
  });
  const progressMutation = trpc.student.progress.useMutation();
  const challengeMutation = trpc.student.challenge.useMutation();
  useAssistantScreen(
    {
      mode: "learning",
      route: "/dashboard",
      currentContent: `Estás en tu panel de estudiante, pestaña ${tabs.find(tab => tab.id === active)?.label ?? "Inicio"}. Puedes decir: abrir módulo, hacer el pretest, hacer el postest, o ir al tutor.`,
    },
    {
      onNext: () => {
        const index = tabs.findIndex(tab => tab.id === active);
        setActive(tabs[Math.min(index + 1, tabs.length - 1)].id);
      },
      onPrevious: () => {
        const index = tabs.findIndex(tab => tab.id === active);
        setActive(tabs[Math.max(index - 1, 0)].id);
      },
    }
  );
  if (!student)
    return (
      <main
        aria-label="Pantalla principal"
        data-screen="dashboard"
        className="flex min-h-screen items-center justify-center bg-[#f5faf9] p-5"
      >
        <div className="max-w-md rounded-[2rem] bg-white p-8 text-center shadow-lift">
          <Sparkles className="mx-auto text-[#e27a4f]" size={31} />
          <h1 className="mt-5 text-3xl font-bold text-[#26356b]">
            Tu ruta te espera
          </h1>
          <p className="mt-3 text-[#688084]">
            Identifícate para guardar tu progreso y continuar la capacitación.
          </p>
          <Link
            href="/identificacion"
            aria-label="Comenzar identificación"
            data-ai-target="start-button"
            data-ai-action="start-identification"
            className="mt-7 inline-flex rounded-xl bg-[#26356b] px-5 py-3 font-bold text-white"
          >
            Comenzar
          </Link>
        </div>
      </main>
    );
  const values = modules.map(module => localProgress[module.id] ?? 0);
  const overall = Math.round(
    values.reduce((sum, value) => sum + value, 0) / modules.length
  );
  const completed = values.filter(value => value >= 100).length;
  const updateProgress = async (moduleId: string) => {
    setProgress(moduleId, 100);
    setLocalProgress(previous => ({ ...previous, [moduleId]: 100 }));
    try {
      await progressMutation.mutateAsync({
        code,
        moduleId,
        percentage: 100,
        status: "completed",
      });
    } catch {}
    toast.success("Módulo completado. ¡Buen trabajo!");
  };
  const answerChallenge = async (answer: string) => {
    setChallengeAnswer(answer);
    const score = answer === "verificar" ? 100 : 0;
    addChallenge({ name: "Detecta el error de la IA", score });
    setLocalChallenges(getChallenges());
    try {
      await challengeMutation.mutateAsync({
        code,
        challenge: "Detecta el error de la IA",
        score,
      });
    } catch {}
    if (score) toast.success("¡Exacto! Verificar es parte de aprender.");
    else toast.error("Pista: una respuesta de IA no se acepta sin revisar.");
  };
  const evaluations = getEvaluations();
  const content =
    active === "inicio" ? (
      <Overview
        student={student}
        overall={overall}
        completed={completed}
        progress={localProgress}
        onContinue={() => setActive("modulos")}
      />
    ) : active === "modulos" ? (
      <Modules progress={localProgress} onComplete={updateProgress} />
    ) : active === "retos" ? (
      <Challenges
        answer={challengeAnswer}
        challenges={localChallenges}
        onAnswer={answerChallenge}
      />
    ) : active === "tutor" ? (
      <LinkedFeature
        title="Tutor IA"
        description="Escribe tu propio intento y recibe retroalimentación guiada."
        href="/tutor"
        label="Abrir tutor"
      />
    ) : active === "consultas" ? (
      <LinkedFeature
        title="Área de consultas"
        description="Busca en internet temas relacionados con la capacitación, con fuentes que puedes verificar."
        href="/consultas"
        label="Abrir consultas"
      />
    ) : active === "postest" ? (
      <LinkedFeature
        title="Evaluación final"
        description="El postest se habilita automáticamente cuando cumples las condiciones configuradas."
        href="/postest"
        label="Revisar disponibilidad"
      />
    ) : active === "resultados" ? (
      <Results
        overall={overall}
        completed={completed}
        evaluations={evaluations}
        challenges={localChallenges}
      />
    ) : (
      <Profile
        student={student}
        onReset={() => {
          localStorage.clear();
          navigate("/");
        }}
      />
    );
  return (
    <div className="min-h-screen bg-[#f5faf9] text-[#26356b]">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-[#dce9e7] bg-white px-5 py-6 transition-transform lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#26356b] text-white">
              <Sparkles size={19} />
            </span>
            <div>
              <p className="font-bold">Aula IA</p>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#829799]">
                científica
              </p>
            </div>
          </Link>
          <button className="lg:hidden" onClick={() => setMobileNav(false)}>
            <X size={19} />
          </button>
        </div>
        <div className="mt-10 rounded-2xl bg-[#26356b] p-4 text-white">
          <p className="text-xs font-bold uppercase tracking-[.13em] text-[#c8c9ff]">
            Tu avance
          </p>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-3xl font-bold">{overall}%</span>
            <span className="text-xs text-[#c2e6e1]">
              {completed}/6 módulos
            </span>
          </div>
          <ProgressBar value={overall} className="mt-3 bg-[#4e5894]" />
        </div>
        <nav className="mt-8 space-y-1">
          {tabs.map(tab => (
            <NavButton
              key={tab.id}
              tab={tab}
              active={active === tab.id}
              onClick={() => {
                setActive(tab.id);
                setMobileNav(false);
              }}
            />
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-[#e1ecea] bg-[#f7fbfa] p-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Milestone size={17} className="text-[#e27a4f]" /> Ruta activa
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#789093]">
            Piensa → Consulta → Verifica → Comprende → Comunica
          </p>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-[73px] items-center justify-between border-b border-[#dce9e7] bg-[#f5faf9]/90 px-5 backdrop-blur lg:px-10">
          <button
            className="rounded-xl p-2 hover:bg-white lg:hidden"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={21} />
          </button>
          <div className="hidden text-sm text-[#789093] sm:block">
            Capacitación /{" "}
            <strong className="text-[#26356b]">
              {tabs.find(tab => tab.id === active)?.label}
            </strong>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-bold">{student.code}</span>
              <span className="block text-xs text-[#789093]">
                {student.grade} · Sección {student.section}
              </span>
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffe7d6] font-bold text-[#b55e3d]">
              {student.code.slice(0, 2)}
            </div>
          </div>
        </header>
        <main
          aria-label="Panel de estudiante"
          data-screen="dashboard"
          className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-10"
        >
          {content}
        </main>
      </div>
    </div>
  );
}

function LinkedFeature({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <div className="max-w-2xl rounded-[2rem] bg-white p-8 shadow-soft">
      <p className="text-sm font-bold uppercase tracking-[.15em] text-[#e27a4f]">
        Nueva experiencia V2
      </p>
      <h1 className="mt-2 text-4xl font-bold">{title}</h1>
      <p className="mt-4 leading-relaxed text-[#789093]">{description}</p>
      <Link
        href={href}
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#26356b] px-5 py-3 font-bold text-white"
      >
        {label} <ChevronRight size={17} />
      </Link>
    </div>
  );
}

function Overview({
  student,
  overall,
  completed,
  progress,
  onContinue,
}: {
  student: StudentSession;
  overall: number;
  completed: number;
  progress: Record<string, number>;
  onContinue: () => void;
}) {
  const next =
    modules.find(module => (progress[module.id] ?? 0) < 100) ?? modules[5];
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#26356b] p-7 text-white shadow-lift sm:p-10">
        <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full border-[35px] border-[#4b55a5]/50" />
        <div className="relative max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[.15em] text-[#c8c9ff]">
            Hola, {student.code}
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
            Tu curiosidad es
            <br />
            <span className="text-[#f4a67d]">tu superpoder.</span>
          </h1>
          <p className="mt-4 max-w-lg leading-relaxed text-[#d7d9f5]">
            Continúa tu ruta para aprender a usar la IA sin dejar de pensar por
            ti.
          </p>
          <button
            onClick={onContinue}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#e27a4f] px-5 py-3 font-bold text-[#26356b] transition hover:bg-[#f4a67d]"
          >
            Continuar con {next.title} <ChevronRight size={17} />
          </button>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#789093]">Avance general</p>
            <BarChart3 size={18} className="text-[#5b4bdb]" />
          </div>
          <p className="mt-3 text-3xl font-bold">{overall}%</p>
          <ProgressBar value={overall} className="mt-3" />
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#789093]">Módulos listos</p>
            <BookOpen size={18} className="text-[#e27a4f]" />
          </div>
          <p className="mt-3 text-3xl font-bold">
            {completed}
            <span className="text-lg text-[#9aabab"> / 6</span>
          </p>
          <p className="mt-3 text-xs text-[#789093]">
            Sigue construyendo tu criterio
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#789093]">
              Racha de aprendizaje
            </p>
            <Flame size={18} className="text-[#e27a4f]" />
          </div>
          <p className="mt-3 text-3xl font-bold">1 día</p>
          <p className="mt-3 text-xs text-[#789093]">Cada paso cuenta</p>
        </div>
      </div>
      <section>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.15em] text-[#e27a4f]">
              Tu recorrido
            </p>
            <h2 className="mt-1 text-2xl font-bold">Módulos de la ruta</h2>
          </div>
          <button
            onClick={onContinue}
            className="text-sm font-bold text-[#5b4bdb]"
          >
            Ver todos <ChevronRight size={15} className="inline" />
          </button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.slice(0, 3).map(module => (
            <Link
              key={module.id}
              href={`/modulo/${module.id}`}
              className="group rounded-2xl bg-white p-5 shadow-soft transition hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${module.color}`}
                >
                  {module.icon}
                </span>
                <span className="text-xs font-bold text-[#9aabab]">
                  {String(module.number)}
                </span>
              </div>
              <h3 className="mt-5 font-bold">{module.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#789093]">
                {module.short}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <ProgressBar
                  value={progress[module.id] ?? 0}
                  className="flex-1"
                />
                <span className="text-xs font-bold text-[#5b4bdb]">
                  {progress[module.id] ?? 0}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Modules({
  progress,
  onComplete,
}: {
  progress: Record<string, number>;
  onComplete: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[.15em] text-[#e27a4f]">
        Ruta de aprendizaje
      </p>
      <h1 className="mt-2 text-4xl font-bold">
        Seis formas de usar mejor la IA
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-[#789093]">
        Avanza a tu ritmo. Lee, prueba, escribe con tus propias palabras y marca
        cada módulo cuando puedas explicarlo.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {modules.map((module, index) => (
          <Link
            key={module.id}
            href={`/modulo/${module.id}`}
            className="group flex gap-5 rounded-2xl bg-white p-5 shadow-soft transition hover:-translate-y-1"
          >
            <span
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${module.color}`}
            >
              {module.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-[#9aabab]">
                    Módulo {index + 1}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">{module.title}</h2>
                </div>
                {progress[module.id] >= 100 && (
                  <Check size={20} className="text-[#46a48e" />
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#789093]">
                {module.short}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <ProgressBar
                  value={progress[module.id] ?? 0}
                  className="flex-1"
                />
                <span className="text-xs font-bold text-[#5b4bdb]">
                  {progress[module.id] ?? 0}%
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Challenges({
  answer,
  challenges,
  onAnswer,
}: {
  answer: string | null;
  challenges: { name: string; score: number }[];
  onAnswer: (answer: string) => void;
}) {
  const options = [
    { id: "copiar", text: "Copiar porque la IA suele acertar." },
    {
      id: "verificar",
      text: "Leer, analizar y comparar con fuentes confiables.",
    },
    { id: "cambiar", text: "Cambiar algunas palabras y entregar." },
  ];
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold uppercase tracking-[.15em] text-[#e27a4f]">
        Práctica breve
      </p>
      <h1 className="mt-2 text-4xl font-bold">
        Retos para activar tu criterio
      </h1>
      <p className="mt-3 leading-relaxed text-[#789093]">
        No compites contra nadie: cada reto es una oportunidad para hacer
        visible tu razonamiento.
      </p>
      <div className="mt-8 rounded-[2rem] bg-[#26356b] p-7 text-white shadow-lift">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-[#4b55a5] px-3 py-1 text-xs font-bold uppercase tracking-[.14em] text-[#d7d9f5]">
            Reto 01
          </span>
          <Award size={22} className="text-[#f4a67d]" />
        </div>
        <h2 className="mt-7 text-2xl font-bold">Detecta el error de la IA</h2>
        <p className="mt-3 leading-relaxed text-[#d7d9f5]">
          Una IA te da una explicación sobre el efecto invernadero. Antes de
          usarla en tu trabajo, ¿qué comportamiento es más responsable?
        </p>
        <div className="mt-6 space-y-2">
          {options.map(option => (
            <button
              key={option.id}
              onClick={() => onAnswer(option.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${answer === option.id ? (option.id === "verificar" ? "border-[#b9b7ff] bg-[#4b55a5]" : "border-[#f4a67d] bg-[#704c4d]") : "border-[#6972bd] hover:bg-[#3d478e]"}`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#8ccbc4] text-xs">
                {option.id === "verificar" && answer === option.id ? "✓" : ""}
              </span>
              {option.text}
            </button>
          ))}
        </div>
        {answer && (
          <div className="mt-6 rounded-xl bg-white/10 p-4 text-sm text-[#e6f5f2]">
            {answer === "verificar"
              ? "¡Correcto! La verificación te ayuda a comprender antes de comunicar."
              : "Todavía no: una respuesta convincente también necesita evidencia y revisión."}
          </div>
        )}
      </div>
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <Trophy className="text-[#e27a4f]" size={20} />
          <p className="font-bold">Tus retos completados</p>
        </div>
        <p className="mt-2 text-sm text-[#789093]">
          {challenges.filter(challenge => challenge.score > 0).length} reto(s)
          con puntaje registrado.
        </p>
      </div>
    </div>
  );
}

function Results({
  overall,
  completed,
  evaluations,
  challenges,
}: {
  overall: number;
  completed: number;
  evaluations: { type: string; score: number; total: number }[];
  challenges: { name: string; score: number }[];
}) {
  const diagnostic = evaluations.find(item => item.type === "diagnostic");
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-[.15em] text-[#e27a4f]">
        Evidencias de aprendizaje
      </p>
      <h1 className="mt-2 text-4xl font-bold">Tus resultados</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-[1fr_1fr] ">
        <div className="rounded-[2rem] bg-[#26356b] p-7 text-white shadow-lift">
          <p className="text-sm font-bold uppercase tracking-[.14em] text-[#c8c9ff]">
            Avance general
          </p>
          <p className="mt-3 text-6xl font-bold text-[#f4a67d]">{overall}%</p>
          <ProgressBar value={overall} className="mt-5 bg-[#4e5894]" />
          <p className="mt-4 text-sm text-[#d7d9f5]">
            Has completado {completed} de 6 módulos. Sigue conectando ideas con
            tus propias palabras.
          </p>
        </div>
        <div className="rounded-[2rem] bg-white p-7 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[.14em] text-[#789093]">
            Diagnóstico inicial
          </p>
          <div className="mt-5 flex items-end gap-2">
            <p className="text-5xl font-bold text-[#26356b]">
              {diagnostic
                ? `${Math.round((diagnostic.score / diagnostic.total) * 100)}%`
                : "—"}
            </p>
            <p className="mb-2 text-sm text-[#789093]">punto de partida</p>
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm text-[#5b4bdb]">
            <ClipboardCheck size={17} /> Guardado de forma segura
          </div>
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-soft">
        <h2 className="text-lg font-bold">Insignias obtenidas</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-xl bg-[#fff0c7] px-4 py-3 text-sm font-bold text-[#806421]">
            <Sparkles size={17} /> Primer paso
          </span>
          {completed >= 3 && (
            <span className="inline-flex items-center gap-2 rounded-xl bg-[#e4e8ff] px-4 py-3 text-sm font-bold text-[#5b4bdb]">
              <ShieldCheck size={17} /> Verificador
            </span>
          )}
          {challenges.some(item => item.score > 0) && (
            <span className="inline-flex items-center gap-2 rounded-xl bg-[#ffe7d6] px-4 py-3 text-sm font-bold text-[#9b4b34]">
              <Award size={17} /> Criterio activo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Profile({
  student,
  onReset,
}: {
  student: StudentSession;
  onReset: () => void;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-bold uppercase tracking-[.15em] text-[#e27a4f]">
        Tu identificación
      </p>
      <h1 className="mt-2 text-4xl font-bold">Mi ficha</h1>
      <div className="mt-8 rounded-[2rem] bg-white p-7 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e4e8ff] text-xl font-bold text-[#5b4bdb]">
            {student.code.slice(0, 2)}
          </div>
          <div>
            <p className="text-xl font-bold">{student.code}</p>
            <p className="text-sm text-[#789093]">
              Identificador de estudiante
            </p>
          </div>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[
            ["Grado", student.grade],
            ["Sección", student.section],
            ["Colegio", student.schoolName || "No indicado"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[#f5faf9] p-4">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-[#8ca0a0]">
                {label}
              </p>
              <p className="mt-2 text-sm font-bold text-[#26356b]">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-7 flex items-start gap-3 rounded-xl bg-[#f5faf9] p-4 text-sm text-[#688084]">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#5b4bdb]" />
          <p>
            Tu ficha evita datos personales innecesarios. Usa tu código para
            volver a encontrar tu progreso en este dispositivo.
          </p>
        </div>
        <button
          onClick={onReset}
          className="mt-7 inline-flex items-center gap-2 rounded-xl border border-[#f0c9bc] px-4 py-3 text-sm font-bold text-[#9b4b34] transition hover:bg-[#fff6f1]"
        >
          <LogOut size={16} /> Salir de esta ficha
        </button>
      </div>
    </div>
  );
}
