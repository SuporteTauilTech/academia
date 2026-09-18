"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  Activity,
  LineChart as LineChartIcon,
  ArrowLeft,
  Loader2,
  Calendar,
  Scale,
  TrendingDown,
  Dumbbell,
  Ruler,
  Users,
  CheckCircle2,
  Camera,
  X,
  Maximize2,
  Printer,
  Share2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface BodyMetric {
  id: string;
  student_id: string;
  weight: number | null;
  height: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  notes: string | null;
  photos?: string[];
  created_at: string;
}

export default function ProgressoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isPersonal, setIsPersonal] = useState(false);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [workoutLogsCount, setWorkoutLogsCount] = useState<number>(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent || navigator.vendor;
      if (/android|iphone|ipad|ipod/i.test(userAgent)) {
        setIsMobile(true);
      }
    }

    async function loadInitialData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const personalCheck = user.email === "xiton@personal.com";
      setIsPersonal(personalCheck);

      if (personalCheck) {
        const { data: usersData } = await supabase
          .from("users")
          .select("*")
          .neq("email", "xiton@personal.com");

        if (usersData && usersData.length > 0) {
          const mapped: UserProfile[] = usersData.map((u) => ({
            id: u.id,
            name: u.name || u.full_name || "Jogador",
            email: u.email || "",
            role: u.role || "aluno",
          }));
          setStudents(mapped);
          setSelectedStudentId(mapped[0].id);
          setSelectedStudentName(mapped[0].name);
          fetchStudentProgress(mapped[0].id);
        }
      } else {
        setSelectedStudentId(user.id);
        setSelectedStudentName(user.email?.split("@")[0] || "Aluno");
        fetchStudentProgress(user.id);
      }

      setLoading(false);
    }

    loadInitialData();
  }, [router, supabase]);

  async function fetchStudentProgress(studentId: string) {
    setLoading(true);

    const { data: metricsData } = await supabase
      .from("body_metrics")
      .select("*")
      .order("created_at", { ascending: false });

    if (metricsData && metricsData.length > 0) {
      setMetrics(metricsData as BodyMetric[]);
    } else {
      setMetrics([]);
    }

    const { data: logsData } = await supabase.from("workout_logs").select("id");

    const todayKey = new Date().toISOString().split("T")[0];
    const storageKey = `xiton_completed_${studentId}_${todayKey}`;
    const localSaved = localStorage.getItem(storageKey);
    const localIds: string[] = localSaved ? JSON.parse(localSaved) : [];

    const totalCount = Math.max(logsData?.length || 0, localIds.length);
    setWorkoutLogsCount(totalCount > 0 ? totalCount : (logsData?.length || 0));

    setLoading(false);
  }

  function handleSelectStudent(studentId: string) {
    setSelectedStudentId(studentId);
    const student = students.find((s) => s.id === studentId);
    if (student) setSelectedStudentName(student.name);
    fetchStudentProgress(studentId);
  }

  async function handlePrintPDF() {
    if (navigator.share && isMobile) {
      try {
        await navigator.share({
          title: `Relatório de Avaliação Física - ${selectedStudentName}`,
          text: `Confira a evolução física do aluno ${selectedStudentName}.`,
          url: window.location.href,
        });
        return;
      } catch (err) {
        console.log("Partilha cancelada ou não suportada:", err);
      }
    }
    window.print();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </main>
    );
  }

  const validMetric =
    metrics.find(
      (m) =>
        (m.weight && Number(m.weight) > 0) ||
        (m.body_fat && Number(m.body_fat) > 0) ||
        (m.muscle_mass && Number(m.muscle_mass) > 0) ||
        (m.height && Number(m.height) > 0)
    ) || metrics[0];

  const chartData = [...metrics]
    .filter(
      (m) =>
        (m.weight && Number(m.weight) > 0) ||
        (m.body_fat && Number(m.body_fat) > 0)
    )
    .reverse()
    .map((m) => ({
      date: new Date(m.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      weight: Number(m.weight) || 0,
      body_fat: Number(m.body_fat) || 0,
      muscle_mass: Number(m.muscle_mass) || 0,
    }));

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          main {
            padding: 0 !important;
            max-width: 100% !important;
            background: transparent !important;
          }
          .print-card {
            background-color: #ffffff !important;
            border: 1px solid #e4e4e7 !important;
            color: #000000 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          .print-text-dark {
            color: #09090b !important;
          }
          .print-text-muted {
            color: #71717a !important;
          }
          .recharts-responsive-container {
            width: 100% !important;
          }
          .recharts-wrapper, .recharts-surface {
            overflow: visible !important;
          }
          .recharts-cartesian-grid-line {
            stroke: #e4e4e7 !important;
          }
          .recharts-text {
            fill: #52525b !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-20 print:bg-white print:text-black print:p-0 print:m-0">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-xl border border-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-emerald-500" /> Histórico & Progresso
              </h1>
              <p className="text-xs text-zinc-400">
                Acompanhe a evolução corporal, fotos e frequência de treinos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPDF}
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
            >
              {isMobile ? <Share2 className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
              {isMobile ? "Partilhar Relatório" : "Salvar PDF / Imprimir"}
            </button>

            {isPersonal && students.length > 0 && (
              <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                <Users className="w-4 h-4 text-emerald-400 ml-1" />
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleSelectStudent(e.target.value)}
                  className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer pr-2"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                      Aluno: {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        <div className="space-y-6 print:space-y-4">
          <div className="grid grid-cols-2 gap-4 print:gap-3">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4 print-card">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 print:bg-emerald-50">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white print-text-dark">{workoutLogsCount}</span>
                <p className="text-xs text-zinc-400 print-text-muted">Treinos Concluídos</p>
              </div>
            </div>

            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4 print-card">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 print:bg-emerald-50">
                <Activity className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <span className="text-sm font-bold text-white print-text-dark">
                  {metrics.length > 0 ? `${metrics.length} Avaliação(ões)` : "Sem avaliações"}
                </span>
                <p className="text-xs text-zinc-400 print-text-muted">Status de Progresso Físico</p>
              </div>
            </div>
          </div>

          {metrics.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3 print-card">
              <Activity className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-semibold text-zinc-300 print-text-dark">
                Nenhuma avaliação física registrada para este aluno
              </h3>
            </div>
          ) : (
            <section className="space-y-6 print:space-y-4">
              <div className="p-5 bg-zinc-900 border border-emerald-500/30 rounded-2xl space-y-4 print-card">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3 print:border-zinc-200">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 print:text-emerald-700">
                    <Activity className="w-4 h-4" /> Relatório de Avaliação Física - {selectedStudentName}
                  </span>
                  <span className="text-xs text-zinc-400 flex items-center gap-1 print-text-muted">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {validMetric ? new Date(validMetric.created_at).toLocaleDateString("pt-BR") : "-"}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3 print:gap-2">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 print-card">
                    <span className="text-zinc-500 text-xs block flex items-center gap-1 print-text-muted">
                      <Scale className="w-3.5 h-3.5 text-emerald-500" /> Peso
                    </span>
                    <span className="text-lg font-bold text-white print-text-dark">
                      {validMetric && Number(validMetric.weight) > 0 ? `${validMetric.weight} kg` : "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 print-card">
                    <span className="text-zinc-500 text-xs block flex items-center gap-1 print-text-muted">
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-500" /> Gordura (BF)
                    </span>
                    <span className="text-lg font-bold text-white print-text-dark">
                      {validMetric && Number(validMetric.body_fat) > 0 ? `${validMetric.body_fat}%` : "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 print-card">
                    <span className="text-zinc-500 text-xs block flex items-center gap-1 print-text-muted">
                      <Dumbbell className="w-3.5 h-3.5 text-emerald-500" /> Massa Magra
                    </span>
                    <span className="text-lg font-bold text-white print-text-dark">
                      {validMetric && Number(validMetric.muscle_mass) > 0 ? `${validMetric.muscle_mass} kg` : "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 print-card">
                    <span className="text-zinc-500 text-xs block flex items-center gap-1 print-text-muted">
                      <Ruler className="w-3.5 h-3.5 text-emerald-500" /> Altura
                    </span>
                    <span className="text-lg font-bold text-white print-text-dark">
                      {validMetric && Number(validMetric.height) > 0 ? `${validMetric.height} cm` : "-"}
                    </span>
                  </div>
                </div>

                {validMetric && validMetric.photos && validMetric.photos.length > 0 && (
                  <div className="pt-3 border-t border-zinc-800/80 space-y-2 print:border-zinc-200">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 print-text-dark">
                      <Camera className="w-4 h-4 text-emerald-400 print:text-emerald-700" /> Fotos de Evolução
                    </span>
                    <div className="grid grid-cols-4 gap-3 print:gap-2">
                      {validMetric.photos.map((photoUrl, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedPhoto(photoUrl)}
                          className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-800 hover:border-emerald-500 transition-all bg-zinc-950 focus:outline-none print-card"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photoUrl}
                            alt={`Evolução ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center print:hidden">
                            <Maximize2 className="w-5 h-5 text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 print:gap-3">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 print-card">
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2 print-text-dark">
                    <Scale className="w-4 h-4 text-emerald-400 print:text-emerald-700" /> Evolução de Peso (kg)
                  </h3>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={10} padding={{ left: 15, right: 15 }} />
                        <YAxis stroke="#71717a" fontSize={10} domain={["auto", "auto"]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            borderColor: "#27272a",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={{ fill: "#10b981", r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 print-card">
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2 print-text-dark">
                    <TrendingDown className="w-4 h-4 text-emerald-400 print:text-emerald-700" /> Evolução de Gordura (%)
                  </h3>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={10} padding={{ left: 15, right: 15 }} />
                        <YAxis stroke="#71717a" fontSize={10} domain={["auto", "auto"]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            borderColor: "#27272a",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="body_fat"
                          stroke="#059669"
                          strokeWidth={2.5}
                          dot={{ fill: "#059669", r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 print:hidden"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <div
              className="relative max-w-3xl max-h-[90vh] w-full flex items-center justify-center overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto}
                alt="Foto de evolução ampliada"
                className="max-w-full max-h-[85vh] object-contain rounded-xl border border-zinc-800 shadow-2xl"
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}