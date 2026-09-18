"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
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
  FileText,
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
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [isPersonal, setIsPersonal] = useState(false);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [workoutLogsCount, setWorkoutLogsCount] = useState<number>(0);
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

  const validMetric =
    metrics.find(
      (m) =>
        (m.weight && Number(m.weight) > 0) ||
        (m.body_fat && Number(m.body_fat) > 0) ||
        (m.muscle_mass && Number(m.muscle_mass) > 0) ||
        (m.height && Number(m.height) > 0)
    ) || metrics[0];

  async function handleGenerateNativePDF() {
    setGeneratingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");

      // Cabeçalho
      doc.setFillColor(16, 185, 129); // Verde Emerald
      doc.rect(0, 0, 210, 25, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("RELATÓRIO DE AVALIAÇÃO FÍSICA", 14, 16);

      // Informações do Aluno
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Aluno: ${selectedStudentName}`, 14, 38);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const dataFormatada = validMetric
        ? new Date(validMetric.created_at).toLocaleDateString("pt-BR")
        : new Date().toLocaleDateString("pt-BR");
      doc.text(`Data da Avaliação: ${dataFormatada}`, 14, 45);

      // Linha Divisória
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 49, 196, 49);

      // Resumo de Treinos
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, 55, 182, 20, 3, 3, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129);
      doc.text("TREINOS CONCLUÍDOS:", 20, 68);
      doc.setTextColor(30, 30, 30);
      doc.text(`${workoutLogsCount} treinos realizados`, 75, 68);

      // Cards de Métricas
      const metricsY = 85;

      // Card 1 - Peso
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, metricsY, 88, 25, 3, 3, "F");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("PESO", 20, metricsY + 8);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(validMetric?.weight ? `${validMetric.weight} kg` : "-", 20, metricsY + 18);

      // Card 2 - Gordura
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(108, metricsY, 88, 25, 3, 3, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("GORDURA (BF)", 114, metricsY + 8);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(validMetric?.body_fat ? `${validMetric.body_fat}%` : "-", 114, metricsY + 18);

      // Card 3 - Massa Magra
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, metricsY + 30, 88, 25, 3, 3, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("MASSA MAGRA", 20, metricsY + 38);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(validMetric?.muscle_mass ? `${validMetric.muscle_mass} kg` : "-", 20, metricsY + 48);

      // Card 4 - Altura
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(108, metricsY + 30, 88, 25, 3, 3, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("ALTURA", 114, metricsY + 38);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(validMetric?.height ? `${validMetric.height} cm` : "-", 114, metricsY + 48);

      // Rodapé
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("Documento oficial gerado por Xiton Personal Trainer App", 14, 280);

      // Converte para Base64
      const pdfBase64 = doc.output("datauristring").split(",")[1];
      const fileName = `Relatorio_${selectedStudentName.replace(/\s+/g, "_")}.pdf`;

      // Grava no armazenamento do Android
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Cache,
      });

      // Abre a janela nativa para salvar / enviar
      await Share.share({
        title: `Relatório de Avaliação - ${selectedStudentName}`,
        url: savedFile.uri,
      });
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </main>
    );
  }

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
            <button
              onClick={handleGenerateNativePDF}
              disabled={generatingPdf}
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 cursor-pointer disabled:opacity-50"
            >
              {generatingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {generatingPdf ? "A criar PDF..." : "Salvar PDF / Imprimir"}
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

        <div id="report-container" className="space-y-6 p-2 rounded-2xl bg-zinc-950">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white">{workoutLogsCount}</span>
                <p className="text-xs text-zinc-400">Treinos Concluídos</p>
              </div>
            </div>

            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shrink-0">
                <Activity className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">
                  {metrics.length > 0 ? `${metrics.length} Avaliações` : "Sem avaliações"}
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
            </div>
          ) : (
            <section className="space-y-6">
              <div className="p-5 bg-zinc-900 border border-emerald-500/30 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> Relatório de Avaliação Física - {selectedStudentName}
                  </span>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {validMetric ? new Date(validMetric.created_at).toLocaleDateString("pt-BR") : "-"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 text-xs font-medium flex items-center gap-1.5 mb-1">
                      <Scale className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Peso
                    </span>
                    <span className="text-lg font-bold text-white">
                      {validMetric && Number(validMetric.weight) > 0 ? `${validMetric.weight} kg` : "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 text-xs font-medium flex items-center gap-1.5 mb-1">
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Gordura (BF)
                    </span>
                    <span className="text-lg font-bold text-white">
                      {validMetric && Number(validMetric.body_fat) > 0 ? `${validMetric.body_fat}%` : "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 text-xs font-medium flex items-center gap-1.5 mb-1">
                      <Dumbbell className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Massa Magra
                    </span>
                    <span className="text-lg font-bold text-white">
                      {validMetric && Number(validMetric.muscle_mass) > 0 ? `${validMetric.muscle_mass} kg` : "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 text-xs font-medium flex items-center gap-1.5 mb-1">
                      <Ruler className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Altura
                    </span>
                    <span className="text-lg font-bold text-white">
                      {validMetric && Number(validMetric.height) > 0 ? `${validMetric.height} cm` : "-"}
                    </span>
                  </div>
                </div>

                {validMetric && validMetric.photos && validMetric.photos.length > 0 && (
                  <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-400" /> Fotos de Evolução
                    </span>
                    <div className="grid grid-cols-4 gap-3">
                      {validMetric.photos.map((photoUrl, i) => (
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400" /> Evolução de Peso (kg)
                  </h3>
                  <div className="h-56 w-full">
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

                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-emerald-400" /> Evolução de Gordura (%)
                  </h3>
                  <div className="h-56 w-full">
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
    </>
  );
}