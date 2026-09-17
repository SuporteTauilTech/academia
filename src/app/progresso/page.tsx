"use client";

import { useEffect, useState, useRef } from "react";
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
  Users,
  CheckCircle2,
  Camera,
  X,
  Maximize2,
  Download,
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
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arm_left: number | null;
  arm_right: number | null;
  thigh_left: number | null;
  thigh_right: number | null;
  calf_left: number | null;
  calf_right: number | null;
  notes: string | null;
  photos?: string[];
  created_at: string;
}

interface WorkoutLog {
  id: string;
  workout_title: string;
  created_at: string;
}

export default function ProgressoPage() {
  const router = useRouter();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isPersonal, setIsPersonal] = useState(false);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
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
        } else {
          const fallback = {
            id: "b99db051-cb24-4e38-a257-1947d3fad63a",
            name: "Jogador",
            email: "jogadorteste2020@gmail.com",
            role: "aluno",
          };
          setStudents([fallback]);
          setSelectedStudentId(fallback.id);
          setSelectedStudentName(fallback.name);
          fetchStudentProgress(fallback.id);
        }
      } else {
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
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (metricsData) {
      setMetrics(metricsData as BodyMetric[]);
    } else {
      setMetrics([]);
    }

    const { data: logsData } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (logsData) {
      setWorkoutLogs(logsData as WorkoutLog[]);
    } else {
      setWorkoutLogs([]);
    }

    setLoading(false);
  }

  function handleSelectStudent(studentId: string) {
    setSelectedStudentId(studentId);
    const student = students.find((s) => s.id === studentId);
    if (student) setSelectedStudentName(student.name);
    fetchStudentProgress(studentId);
  }

  async function exportPDF() {
    if (!pdfRef.current) return;
    setDownloadingPdf(true);

    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#09090b",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Avaliacao_${selectedStudentName.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao exportar o relatório em PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </main>
    );
  }

  const latestMetric = metrics[0];

  const chartData = [...metrics]
    .reverse()
    .map((m) => ({
      date: new Date(m.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      weight: m.weight,
      body_fat: m.body_fat,
      muscle_mass: m.muscle_mass,
    }));

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
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
          {metrics.length > 0 && (
            <button
              onClick={exportPDF}
              disabled={downloadingPdf}
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
            >
              {downloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Exportar PDF
            </button>
          )}

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

      {/* Conteúdo Exportável em PDF */}
      <div ref={pdfRef} className="space-y-6 p-2 bg-zinc-950 rounded-2xl">
        {/* Resumo de Frequência */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white">{workoutLogs.length}</span>
              <p className="text-xs text-zinc-400">Treinos Concluídos</p>
            </div>
          </div>

          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-bold text-white">
                {metrics.length > 0 ? `${metrics.length} Avaliação(ões)` : "Sem avaliações"}
              </span>
              <p className="text-xs text-zinc-400">Status de Progresso Físico</p>
            </div>
          </div>
        </div>

        {metrics.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
            <Activity className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-300">
              Nenhuma avaliação física registrada para este aluno
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Cadastre uma nova avaliação física no painel para que os gráficos e galeria de fotos apareçam aqui.
            </p>
          </div>
        ) : (
          <section className="space-y-6">
            {/* Destaque da Última Avaliação */}
            <div className="p-5 bg-zinc-900 border border-emerald-500/30 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> Relatório de Avaliação Física - {selectedStudentName}
                </span>
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  {new Date(latestMetric.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 text-xs block flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-emerald-500" /> Peso
                  </span>
                  <span className="text-lg font-bold text-white">
                    {latestMetric.weight ? `${latestMetric.weight} kg` : "-"}
                  </span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 text-xs block flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-500" /> Gordura (BF)
                  </span>
                  <span className="text-lg font-bold text-emerald-400">
                    {latestMetric.body_fat ? `${latestMetric.body_fat}%` : "-"}
                  </span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 text-xs block flex items-center gap-1">
                    <Dumbbell className="w-3.5 h-3.5 text-emerald-500" /> Massa Magra
                  </span>
                  <span className="text-lg font-bold text-white">
                    {latestMetric.muscle_mass ? `${latestMetric.muscle_mass} kg` : "-"}
                  </span>
                </div>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 text-xs block">Altura</span>
                  <span className="text-lg font-bold text-white">
                    {latestMetric.height ? `${latestMetric.height} cm` : "-"}
                  </span>
                </div>
              </div>

              {/* Fotos */}
              {latestMetric.photos && latestMetric.photos.length > 0 && (
                <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" /> Fotos de Evolução
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {latestMetric.photos.map((photoUrl, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedPhoto(photoUrl)}
                        className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-800 hover:border-emerald-500 transition-all bg-zinc-950 focus:outline-none"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoUrl}
                          alt={`Evolução ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {latestMetric.notes && (
                <div className="pt-2 text-xs text-zinc-400 border-t border-zinc-800/80">
                  <strong className="text-zinc-300">Observações do Personal: </strong>
                  {latestMetric.notes}
                </div>
              )}
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" /> Evolução de Peso (kg)
                </h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
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

              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-400" /> Evolução de Gordura (%)
                </h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
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
                        stroke="#34d399"
                        strokeWidth={2.5}
                        dot={{ fill: "#34d399", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Modal Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
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
  );
}