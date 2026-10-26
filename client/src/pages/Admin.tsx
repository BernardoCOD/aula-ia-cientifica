import {
  BarChart3,
  BrainCircuit,
  Download,
  Filter,
  LockKeyhole,
  LogIn,
  RefreshCw,
  School,
  ShieldCheck,
  Sparkles,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function Admin() {
  const { user, loading } = useAuth();
  const teacherSession = trpc.admin.session.useQuery();
  const isAdmin =
    user?.role === "admin" || teacherSession.data?.authenticated === true;
  const research = trpc.admin.research.useQuery(undefined, {
    enabled: isAdmin,
  });
  const enablePostest = trpc.admin.enablePostest.useMutation({
    onSuccess: () => research.refetch(),
  });
  const deleteStudent = trpc.admin.deleteStudent.useMutation({
    onSuccess: () => research.refetch(),
  });
  const [school, setSchool] = useState("Todas");
  const [grade, setGrade] = useState("Todos");
  const [responseFilter, setResponseFilter] = useState("Todas");
  const [selectedResponse, setSelectedResponse] = useState<number | null>(null);
  const analysis = trpc.admin.analyzeResponse.useMutation();

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc] text-[#64748b]">
        Cargando acceso...
      </div>
    );
  if (!isAdmin)
    return <AccessGate onLoggedIn={() => teacherSession.refetch()} />;

  const data = research.data;
  const summary = data?.summary ?? {
    total: 0,
    withPretest: 0,
    inTraining: 0,
    withPostest: 0,
    pretestAvg: 0,
    postestAvg: 0,
    difference: 0,
    aiInteractions: 0,
  };
  const students = data?.students ?? [];
  const schools = Array.from(new Set(students.map(student => student.school)));
  const grades = Array.from(new Set(students.map(student => student.grade)));
  const rows = students.filter(
    student =>
      (school === "Todas" || student.school === school) &&
      (grade === "Todos" || student.grade === grade)
  );
  const responses = (data?.aiResponses ?? []).filter(
    item => responseFilter === "Todas" || item.result === responseFilter
  );
  const selected = responses.find(item => item.id === selectedResponse) ?? null;

  const exportCsv = () => {
    const values = [
      [
        "Código",
        "Institución",
        "Grado",
        "Sección",
        "Pretest",
        "Postest",
        "Diferencia",
      ],
      ...rows.map(student => [
        student.code,
        student.school,
        student.grade,
        student.section,
        student.pretest ?? "",
        student.postest ?? "",
        student.difference ?? "",
      ]),
    ];
    const blob = new Blob(
      [
        values
          .map(row =>
            row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")
          )
          .join("\n"),
      ],
      { type: "text/csv;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "resultados-aula-ia.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const runAnalysis = async (item: typeof selected) => {
    if (!item) return;
    setSelectedResponse(item.id);
    await analysis.mutateAsync({
      question: item.question,
      response: item.response,
      result: item.result,
      score: item.score,
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#172554]">
      <header className="border-b border-[#e2e8f0] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172554] text-white">
              <Sparkles size={19} />
            </span>
            <div>
              <p className="font-bold">Aula IA Científica</p>
              <p className="text-xs text-[#64748b]">
                Vista del docente · Resultados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => research.refetch()}
              aria-label="Actualizar"
              className="rounded-xl border border-[#dbe3ef] p-2 text-[#475569] hover:bg-[#f1f5f9]"
            >
              <RefreshCw size={17} />
            </button>
            <Link href="/" className="text-sm font-bold text-[#475569]">
              Salir
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-9 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.15em] text-[#d66a4c]">
              Panel de acompañamiento
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Pretest <span className="text-[#d66a4c]">→</span> Capacitación{" "}
              <span className="text-[#d66a4c]">→</span> Postest
            </h1>
            <p className="mt-3 max-w-2xl text-[#64748b]">
              Observa el progreso, revisa respuestas y usa la IA como apoyo para
              tomar decisiones pedagógicas.
            </p>
          </div>
          <button
            onClick={exportCsv}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm font-bold text-[#334155] hover:bg-[#f8fafc]"
          >
            <Download size={17} /> Exportar resultados
          </button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={UsersRound}
            label="Estudiantes registrados"
            value={summary.total}
            tone="blue"
          />
          <Stat
            icon={ShieldCheck}
            label="Con PRETEST"
            value={`${summary.withPretest}/${summary.total}`}
            tone="peach"
          />
          <Stat
            icon={BarChart3}
            label="Promedio PRETEST"
            value={`${summary.pretestAvg}%`}
            tone="violet"
          />
          <Stat
            icon={School}
            label="Con POSTEST"
            value={`${summary.withPostest}/${summary.total}`}
            tone="yellow"
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Mini label="En capacitación" value={summary.inTraining} />
          <Mini label="Promedio POSTEST" value={`${summary.postestAvg}%`} />
          <Mini
            label="Cambio promedio"
            value={`${summary.difference >= 0 ? "+" : ""}${summary.difference} puntos`}
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-3xl bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Evolución del grupo</h2>
                <p className="mt-1 text-sm text-[#64748b]">
                  Comparación de los resultados promedio.
                </p>
              </div>
              <BarChart3 className="text-[#4338ca]" />
            </div>
            <div className="mt-8 space-y-5">
              <ChartBar
                label="PRETEST · punto de partida"
                value={summary.pretestAvg}
                color="bg-[#94a3b8]"
              />
              <ChartBar
                label="POSTEST · después de la ruta"
                value={summary.postestAvg}
                color="bg-[#d66a4c]"
              />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#eef2ff] p-4">
                <p className="text-xs uppercase tracking-[.12em] text-[#64748b]">
                  Interacciones IA
                </p>
                <p className="mt-1 text-2xl font-bold text-[#312e81]">
                  {summary.aiInteractions}
                </p>
              </div>
              <div className="rounded-2xl bg-[#fff4ed] p-4">
                <p className="text-xs uppercase tracking-[.12em] text-[#64748b]">
                  Lectura sugerida
                </p>
                <p className="mt-1 text-sm font-bold text-[#9a3412]">
                  Identifica brechas y acompaña
                </p>
              </div>
            </div>
          </section>
          <section className="rounded-3xl bg-[#172554] p-6 text-white shadow-lift">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-3 text-[#c4b5fd]">
                <BrainCircuit size={21} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Lectura pedagógica</h2>
                <p className="mt-1 text-sm text-[#cbd5e1]">
                  El dato abre una conversación.
                </p>
              </div>
            </div>
            <div className="mt-7 space-y-4 text-sm leading-relaxed text-[#dbeafe]">
              <p>
                <strong className="text-white">Pretest:</strong> muestra ideas
                iniciales, dudas y conceptos por reforzar.
              </p>
              <p>
                <strong className="text-white">Capacitación:</strong> observa el
                avance por módulos y las evidencias construidas.
              </p>
              <p>
                <strong className="text-white">Postest:</strong> compara el
                aprendizaje, no etiqueta al estudiante.
              </p>
            </div>
            <div className="mt-7 rounded-2xl bg-white/10 p-4 text-sm text-[#e9d5ff]">
              Usa el análisis IA como una segunda mirada. La decisión docente
              siempre conserva el contexto del aula.
            </div>
          </section>
        </div>
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold">Seguimiento individual</h2>
              <p className="mt-1 text-sm text-[#64748b]">
                Filtra por institución o grado para acompañar mejor.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm">
                <Filter size={15} className="text-[#64748b]" />
                <select
                  value={school}
                  onChange={event => setSchool(event.target.value)}
                  className="bg-transparent text-[#172554] outline-none"
                >
                  <option>Todas</option>
                  {schools.map(item => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <select
                value={grade}
                onChange={event => setGrade(event.target.value)}
                className="rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm text-[#172554] outline-none"
              >
                <option>Todos</option>
                {grades.map(item => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-xs uppercase tracking-[.12em] text-[#94a3b8]">
                  <th className="pb-3">Código</th>
                  <th className="pb-3">Institución</th>
                  <th className="pb-3">Grado</th>
                  <th className="pb-3">Pretest</th>
                  <th className="pb-3">Capacitación</th>
                  <th className="pb-3">Postest</th>
                  <th className="pb-3">Cambio</th>
                  <th className="pb-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map(student => (
                    <tr
                      key={student.code}
                      className="border-b border-[#f1f5f9] text-[#475569]"
                    >
                      <td className="py-4 font-bold text-[#172554]">
                        {student.code}
                      </td>
                      <td className="py-4">{student.school}</td>
                      <td className="py-4">
                        {student.grade} · {student.section}
                      </td>
                      <td className="py-4">
                        {student.pretest === null ? "—" : `${student.pretest}%`}
                      </td>
                      <td className="py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${student.postestEnabled ? "bg-[#dcfce7] text-[#166534]" : "bg-[#f1f5f9] text-[#64748b]"}`}
                        >
                          {student.postestEnabled
                            ? "Listo para postest"
                            : "En curso"}
                        </span>
                      </td>
                      <td className="py-4">
                        {student.postest === null ? "—" : `${student.postest}%`}
                      </td>
                      <td
                        className={`py-4 font-bold ${student.difference !== null && student.difference >= 0 ? "text-[#15803d]" : "text-[#b45309]"}`}
                      >
                        {student.difference === null
                          ? "—"
                          : `${student.difference >= 0 ? "+" : ""}${student.difference} pp`}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {student.postest === null &&
                            student.pretest !== null &&
                            !student.postestEnabled && (
                              <button
                                onClick={() =>
                                  enablePostest.mutate({ code: student.code })
                                }
                                disabled={enablePostest.isPending}
                                className="rounded-lg bg-[#172554] px-3 py-2 text-xs font-bold text-white hover:bg-[#312e81] disabled:opacity-50"
                              >
                                Activar postest
                              </button>
                            )}
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Esta acción eliminará al alumno ${student.code} y todos sus resultados, respuestas y progreso. ¿Deseas continuar?`
                                )
                              )
                                deleteStudent.mutate({
                                  code: student.code,
                                  confirmation: "ELIMINAR",
                                });
                            }}
                            disabled={deleteStudent.isPending}
                            aria-label={`Eliminar alumno ${student.code}`}
                            className="rounded-lg border border-[#fecaca] p-2 text-[#b91c1c] hover:bg-[#fef2f2] disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-[#64748b]"
                    >
                      Aún no hay resultados registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <BrainCircuit className="text-[#4338ca]" size={21} />
                <h2 className="text-xl font-bold">
                  Respuestas de estudiantes + apoyo IA
                </h2>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-[#64748b]">
                Revisa la evidencia escrita y solicita una lectura formativa
                para orientar tu retroalimentación.
              </p>
            </div>
            <select
              value={responseFilter}
              onChange={event => setResponseFilter(event.target.value)}
              className="rounded-xl border border-[#dbe3ef] px-3 py-2 text-sm text-[#172554] outline-none"
            >
              <option>Todas</option>
              <option>correcta</option>
              <option>parcial</option>
              <option>incorrecta</option>
            </select>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
            {" "}
            <div className="space-y-3">
              {responses.length ? (
                responses.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedResponse(item.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${selectedResponse === item.id ? "border-[#818cf8] bg-[#eef2ff]" : "border-[#e2e8f0] bg-[#f8fafc]"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-[#172554]">
                        {item.code} · {item.activity}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#4338ca]">
                        {item.score}/100
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-[#475569]">
                      {item.response}
                    </p>
                    <p className="mt-2 text-xs text-[#94a3b8]">
                      {item.moduleId.toUpperCase()} · {item.result}
                    </p>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#cbd5e1] p-8 text-center text-sm text-[#64748b]">
                  Todavía no hay respuestas analizadas por IA.
                </div>
              )}
            </div>
            <div className="rounded-2xl bg-[#172554] p-5 text-white">
              {selected ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-[.13em] text-[#c4b5fd]">
                    Respuesta seleccionada · {selected.code}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-[#e2e8f0]">
                    <strong className="text-white">Pregunta:</strong>{" "}
                    {selected.question}
                  </p>
                  <div className="mt-4 rounded-xl bg-white/10 p-4 text-sm leading-relaxed text-[#f8fafc]">
                    {selected.response}
                  </div>
                  <button
                    onClick={() => runAnalysis(selected)}
                    disabled={analysis.isPending}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d66a4c] px-4 py-3 text-sm font-bold text-white hover:bg-[#c45b40] disabled:opacity-60"
                  >
                    <Sparkles size={16} />
                    {analysis.isPending ? "Analizando..." : "Analizar con IA"}
                  </button>
                  {analysis.data && selectedResponse === selected.id && (
                    <div className="mt-5 space-y-3 rounded-2xl bg-white p-4 text-[#172554]">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-[.12em] text-[#4338ca]">
                          Lectura IA
                        </p>
                        <span className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-xs font-bold text-[#4338ca]">
                          {analysis.data.nivel}
                        </span>
                      </div>
                      <p className="text-sm">
                        <strong>Hallazgo:</strong> {analysis.data.hallazgo}
                      </p>
                      <p className="text-sm">
                        <strong>Recomendación:</strong>{" "}
                        {analysis.data.recomendacion}
                      </p>
                      <p className="text-sm">
                        <strong>Pregunta:</strong> {analysis.data.pregunta}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                  <BrainCircuit size={34} className="text-[#c4b5fd]" />
                  <p className="mt-4 font-bold">Selecciona una respuesta</p>
                  <p className="mt-2 max-w-xs text-sm text-[#cbd5e1]">
                    La IA te ayudará a convertirla en una oportunidad de
                    acompañamiento.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function AccessGate({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = trpc.admin.login.useMutation({ onSuccess: onLoggedIn });
  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold text-[#172554]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#172554] text-white">
            <Sparkles size={17} />
          </span>
          Aula IA Científica
        </Link>
        <Link href="/" className="text-sm font-bold text-[#475569]">
          Volver al inicio
        </Link>
      </header>
      <main className="mx-auto flex max-w-xl items-center justify-center px-5 pb-20 pt-16">
        <form
          onSubmit={event => {
            event.preventDefault();
            login.mutate({ username, password });
          }}
          className="w-full rounded-[2rem] bg-white p-8 shadow-lift"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff4ed] text-[#c2410c]">
            <LockKeyhole size={28} />
          </div>
          <div className="text-center">
            <h1 className="mt-6 text-3xl font-bold text-[#172554]">
              Panel del docente
            </h1>
            <p className="mt-3 leading-relaxed text-[#64748b]">
              Ingresa con tus credenciales para consultar resultados, respuestas
              y comparaciones PRETEST/POSTEST.
            </p>
          </div>
          <label className="mt-7 block text-left">
            <span className="mb-2 block text-sm font-bold text-[#334155]">
              Usuario
            </span>
            <input
              value={username}
              onChange={event => setUsername(event.target.value)}
              autoComplete="username"
              className="focus-ring w-full rounded-xl border border-[#cbd5e1] px-4 py-3 outline-none"
              placeholder="Escribe tu usuario"
            />
          </label>
          <label className="mt-4 block text-left">
            <span className="mb-2 block text-sm font-bold text-[#334155]">
              Contraseña
            </span>
            <input
              value={password}
              onChange={event => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              className="focus-ring w-full rounded-xl border border-[#cbd5e1] px-4 py-3 outline-none"
              placeholder="Escribe tu contraseña"
            />
          </label>
          {login.error && (
            <p className="mt-4 rounded-xl bg-[#fff4ed] p-3 text-sm font-bold text-[#9a3412]">
              Usuario o contraseña incorrectos.
            </p>
          )}
          <button
            type="submit"
            disabled={login.isPending || !username || !password}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#172554] px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            <LogIn size={17} />
            {login.isPending ? "Verificando..." : "Ingresar al panel"}
          </button>
        </form>
      </main>
    </div>
  );
}
function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string | number;
  tone: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-[#e0e7ff] text-[#4338ca]",
    peach: "bg-[#ffe7d6] text-[#c2410c]",
    violet: "bg-[#ede9fe] text-[#6d28d9]",
    yellow: "bg-[#fef3c7] text-[#92400e]",
  };
  return (
    <div className="rounded-2xl bg-white p-5 shadow-soft">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[tone]}`}
      >
        <Icon size={19} />
      </div>
      <p className="mt-5 text-sm text-[#64748b]">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#172554]">{value}</p>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4">
      <p className="text-xs uppercase tracking-[.12em] text-[#64748b]">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-[#172554]">{value}</p>
    </div>
  );
}
function ChartBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm font-bold text-[#475569]">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-5 overflow-hidden rounded-full bg-[#e2e8f0]">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
