"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileDown,
  Activity,
  Dumbbell,
  CheckCircle2,
  Users,
  ChevronDown,
  Loader2,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import jsPDF from "jspdf";

interface BodyMetric {
  id: string;
  student_id: string;
  weight: number | null;
  height: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export default function ProgressoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isPersonal, setIsPersonal] = useState(false);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudentName, setSelectedStudentName] = useState<string>("Aluno");
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [completedWorkoutsCount, setCompletedWorkoutsCount] = useState(0);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchStudentData = useCallback(
    async (studentId: string) => {
      setLoading(true);

      const { data: metricsData } = await supabase
        .from("body_metrics")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: true });

      setMetrics(metricsData || []);

      const { data: logsData } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("student_id", studentId);

      setCompletedWorkoutsCount(logsData ? logsData.length : 0);
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const personalCheck = user.email?.toLowerCase() === "xiton@personal.com";
        setIsPersonal(personalCheck);

        if (personalCheck) {
          let { data: usersData } = await supabase.from("users").select("*");

          if (!usersData || usersData.length === 0) {
            const { data: profilesData } = await supabase.from("profiles").select("*");
            usersData = profilesData;
          }

          const filteredUsers = (usersData || []).filter(
            (u) => u.email?.toLowerCase() !== "xiton@personal.com"
          );

          if (filteredUsers.length > 0) {
            const mapped: UserProfile[] = filteredUsers.map((u) => {
              const rawName = u.name || u.full_name;
              const fallbackName = u.email ? u.email.split("@")[0] : "Aluno";
              const displayName = rawName && rawName !== "Usuário" ? rawName : fallbackName;

              return {
                id: u.id,
                name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
                email: u.email || "",
              };
            });

            setStudents(mapped);
            setSelectedStudentId(mapped[0].id);
            setSelectedStudentName(mapped[0].name);
            fetchStudentData(mapped[0].id);
          } else {
            setLoading(false);
          }
        } else {
          const studentName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Aluno";
          setSelectedStudentId(user.id);
          setSelectedStudentName(studentName);
          fetchStudentData(user.id);
        }
      } catch (err) {
        console.error("Erro ao carregar progresso:", err);
        setLoading(false);
      }
    }

    loadData();
  }, [router, fetchStudentData, supabase]);

  function handleStudentChange(studentId: string) {
    const student = students.find((s) => s.id === studentId);
    setSelectedStudentId(studentId);
    if (student) setSelectedStudentName(student.name);
    fetchStudentData(studentId);
  }

  // PDF Nativo Vetorial (Com Gráficos e 100% à prova de falhas)
  function handleExportPDF() {
    setGeneratingPdf(true);

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

      // 1. Cabeçalho Verde
      doc.setFillColor(16, 185, 129); // Emerald 500
      doc.rect(0, 0, 210, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("TAUIL FIT - RELATÓRIO DE PROGRESSO", 15, 18);

      // 2. Informações do Aluno
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Aluno: ${selectedStudentName.toUpperCase()}`, 15, 38);

      const dateText = latestMetric
        ? new Date(latestMetric.created_at).toLocaleDateString("pt-BR")
        : "N/A";
      doc.setFont("helvetica", "normal");
      doc.text(`Data da Avaliação: ${dateText}`, 150, 38);

      // 3. Quadro Resumo de Atividades
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(15, 45, 180, 20, 3, 3, "F");

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(`Treinos Concluídos: ${completedWorkoutsCount}`, 25, 57);
      doc.text(`Avaliações Registradas: ${metrics.length}`, 115, 57);

      // 4. Última Avaliação Física
      if (latestMetric) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(16, 185, 129);
        doc.text("MÉTRICAS DA ÚLTIMA AVALIAÇÃO", 15, 75);

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, 80, 180, 22, 3, 3, "F");

        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        
        doc.text("PESO", 25, 87);
        doc.setFontSize(11);
        doc.setTextColor(16, 185, 129);
        doc.text(`${latestMetric.weight ? `${latestMetric.weight} kg` : "-"}`, 25, 95);

        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text("GORDURA (BF)", 68, 87);
        doc.setFontSize(11);
        doc.setTextColor(16, 185, 129);
        doc.text(`${latestMetric.body_fat ? `${latestMetric.body_fat}%` : "-"}`, 68, 95);

        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text("MASSA MAGRA", 118, 87);
        doc.setFontSize(11);
        doc.setTextColor(16, 185, 129);
        doc.text(`${latestMetric.muscle_mass ? `${latestMetric.muscle_mass} kg` : "-"}`, 118, 95);

        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text("ALTURA", 165, 87);
        doc.setFontSize(11);
        doc.setTextColor(16, 185, 129);
        doc.text(`${latestMetric.height ? `${latestMetric.height} cm` : "-"}`, 165, 95);
      }

      // 5. Desenhar Gráficos Vetoriais de Evolução
      if (metrics.length > 0) {
        let currentY = 115;

        const drawPdfGraph = (dataKey: "weight" | "body_fat", title: string, unit: string) => {
          const validMetrics = metrics.filter((m) => m[dataKey] !== null && m[dataKey] !== undefined);
          if (validMetrics.length === 0) return;

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 41, 59);
          doc.text(title, 15, currentY);

          const graphX = 25;
          const graphY = currentY + 5;
          const graphWidth = 165;
          const graphHeight = 40;

          // Moldura do Gráfico
          doc.setFillColor(250, 250, 250);
          doc.rect(graphX, graphY, graphWidth, graphHeight, "F");
          doc.setDrawColor(226, 232, 240);
          doc.rect(graphX, graphY, graphWidth, graphHeight, "S");

          const values = validMetrics.map((m) => Number(m[dataKey]));
          const minVal = Math.min(...values, 4);
          const maxVal = Math.max(...values, 12);

          const points = validMetrics.map((m, idx) => {
            const x = graphX + (idx / Math.max(validMetrics.length - 1, 1)) * (graphWidth - 20) + 10;
            const val = Number(m[dataKey]);
            const y = graphY + graphHeight - ((val - minVal) / (maxVal - minVal || 1)) * (graphHeight - 12) - 6;
            return {
              x,
              y,
              val,
              date: new Date(m.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            };
          });

          // Desenhar Linhas Tracejadas da Grelha
          doc.setLineWidth(0.2);
          doc.setDrawColor(203, 213, 225);

          // Linha da Curva Verde
          doc.setLineWidth(1);
          doc.setDrawColor(16, 185, 129);

          for (let i = 0; i < points.length - 1; i++) {
            doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
          }

          // Desenhar Pontos e Rótulos
          points.forEach((p) => {
            doc.setFillColor(16, 185, 129);
            doc.circle(p.x, p.y, 1.5, "F");

            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(16, 185, 129);
            doc.text(`${p.val}${unit}`, p.x, p.y - 3, { align: "center" });

            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139);
            doc.text(p.date, p.x, graphY + graphHeight + 4, { align: "center" });
          });

          currentY += 60;
        };

        drawPdfGraph("weight", "EVOLUÇÃO DE PESO (KG)", "kg");
        drawPdfGraph("body_fat", "EVOLUÇÃO DE GORDURA (%)", "%");
      }

      // Rodapé
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.text("Gerado por Tauil Fit - Sistema Oficial de Acompanhamento", 15, 285);

      doc.save(`Relatorio_${selectedStudentName.replace(/\s+/g, "_")}_TauilFit.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Ocorreu um erro ao gerar o PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  // Renderização exata na tela web com curva e eixos
  function renderExactChart(dataKey: "weight" | "body_fat", title: string) {
    const validMetrics = metrics.filter((m) => m[dataKey] !== null && m[dataKey] !== undefined);
    if (validMetrics.length === 0) return null;

    const rawValues = validMetrics.map((m) => Number(m[dataKey]));
    const maxDataVal = Math.max(...rawValues, 12);
    const minDataVal = Math.min(...rawValues, 4);

    const minScale = Math.floor(minDataVal / 2) * 2;
    const maxScale = Math.ceil(maxDataVal / 2) * 2;
    const scaleSteps = [12, 10, 8, 6, 4].filter((v) => v >= minScale && v <= maxScale);
    if (scaleSteps.length === 0) scaleSteps.push(12, 10, 8, 6, 4);

    const chartHeight = 160;
    const chartWidth = 320;
    const paddingLeft = 35;
    const paddingBottom = 25;
    const paddingTop = 15;
    const paddingRight = 15;

    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;

    const topVal = Math.max(...scaleSteps);
    const bottomVal = Math.min(...scaleSteps);

    const points = validMetrics.map((m, idx) => {
      const x = paddingLeft + (idx / Math.max(validMetrics.length - 1, 1)) * plotWidth;
      const val = Number(m[dataKey]);
      const y = paddingTop + plotHeight - ((val - bottomVal) / (topVal - bottomVal || 1)) * plotHeight;
      return {
        x,
        y,
        val,
        date: new Date(m.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    return (
      <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          {dataKey === "weight" ? (
            <Scale className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          )}
          {title}
        </h3>

        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
            {scaleSteps.map((v) => {
              const y = paddingTop + plotHeight - ((v - bottomVal) / (topVal - bottomVal || 1)) * plotHeight;
              return (
                <g key={v}>
                  <text x={paddingLeft - 8} y={y + 3} fill="#71717a" fontSize="10" textAnchor="end" fontFamily="sans-serif">
                    {v}
                  </text>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke="#27272a"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                </g>
              );
            })}

            {points.map((p, idx) => (
              <line
                key={idx}
                x1={p.x}
                y1={paddingTop}
                x2={p.x}
                y2={chartHeight - paddingBottom}
                stroke="#27272a"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
            ))}

            <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={chartHeight - paddingBottom} stroke="#3f3f46" strokeWidth="1.5" />
            <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke="#3f3f46" strokeWidth="1.5" />

            <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

            {points.map((p, idx) => (
              <circle key={idx} cx={p.x} cy={p.y} r="4" fill="#10b981" />
            ))}

            {points.map((p, idx) => (
              <text
                key={idx}
                x={p.x}
                y={chartHeight - paddingBottom + 14}
                fill="#71717a"
                fontSize="9"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {p.date}
              </text>
            ))}
          </svg>
        </div>
      </div>
    );
  }

  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-20">
      <header className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" /> Relatório de Progresso
            </h1>
            <p className="text-xs text-zinc-400">Tauil Fit - Avaliação e Métricas</p>
          </div>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={generatingPdf}
          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50 cursor-pointer"
        >
          {generatingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          <span>Salvar PDF</span>
        </button>
      </header>

      {/* Seletor de Aluno para o Personal */}
      {isPersonal && students.length > 0 && (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3">
          <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase">
            <Users className="w-4 h-4 text-emerald-400" /> Selecionar Aluno:
          </label>
          <div className="relative flex-1 max-w-xs">
            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dashboard Resumo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-bold text-emerald-400 block">
                  {completedWorkoutsCount}
                </span>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                  Treinos Concluídos
                </span>
              </div>
            </div>

            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-bold text-emerald-400 block">
                  {metrics.length}
                </span>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                  Avaliações Registradas
                </span>
              </div>
            </div>
          </div>

          {/* Cartões de Métricas Recentes */}
          {latestMetric ? (
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  RELATÓRIO DE AVALIAÇÃO FÍSICA - {selectedStudentName.toUpperCase()}
                </h3>
                <span className="text-[10px] text-zinc-500">
                  {new Date(latestMetric.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl">
                  <span className="text-[10px] text-zinc-500 block">Peso</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">
                    {latestMetric.weight ? `${latestMetric.weight} kg` : "-"}
                  </p>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl">
                  <span className="text-[10px] text-zinc-500 block">Gordura (BF)</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">
                    {latestMetric.body_fat ? `${latestMetric.body_fat}%` : "-"}
                  </p>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl">
                  <span className="text-[10px] text-zinc-500 block">Massa Magra</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">
                    {latestMetric.muscle_mass ? `${latestMetric.muscle_mass} kg` : "-"}
                  </p>
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl">
                  <span className="text-[10px] text-zinc-500 block">Altura</span>
                  <p className="text-base font-bold text-emerald-400 mt-1">
                    {latestMetric.height ? `${latestMetric.height} cm` : "-"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl">
              <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 font-medium">
                Nenhuma avaliação corporal cadastrada para este aluno.
              </p>
            </div>
          )}

          {/* Gráficos em Onda Identicamente Formatados na Tela */}
          {metrics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderExactChart("weight", "EVOLUÇÃO DE PESO (KG)")}
              {renderExactChart("body_fat", "EVOLUÇÃO DE GORDURA (%)")}
            </div>
          )}

          {/* Lista do Histórico */}
          {metrics.length > 0 && (
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> HISTÓRICO DE AVALIAÇÕES ({metrics.length})
              </h3>

              <div className="space-y-2">
                {metrics.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-zinc-400">
                      {new Date(m.created_at).toLocaleDateString("pt-BR")}
                    </span>

                    <div className="flex items-center gap-4 text-emerald-400 font-semibold">
                      <span>Peso: {m.weight ? `${m.weight}kg` : "-"}</span>
                      <span>BF: {m.body_fat ? `${m.body_fat}%` : "-"}</span>
                      <span>M. Magra: {m.muscle_mass ? `${m.muscle_mass}kg` : "-"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}