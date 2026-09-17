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
  Users,
  CheckCircle2,
  Camera,
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
  const [loading, setLoading] = useState(true);
  const [isPersonal, setIsPersonal] = useState(false);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

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
          fetchStudentProgress(fallback.id);
        }
      } else {
        fetchStudentProgress(user.id);
      }

      setLoading(false);
    }

    loadInitialData();
  }, [router]);

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
    fetchStudentProgress(studentId);
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
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
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
      </header>

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
                <Activity className="w-4 h-4" /> Última Avaliação Corporal
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

            {/* Galeria da Ultima Avaliacao */}
            {latestMetric.photos && latestMetric.photos.length > 0 && (
              <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-400" /> Fotos Recentes de Evolução
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {latestMetric.photos.map((photoUrl, i) => (
                    <a
                      key={i}
                      href={photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-square rounded-xl overflow-hidden border border-zinc-800 hover:border-emerald-500 transition-colors block bg-zinc-950"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt={`Evolução ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
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

          {/* Gráficos de Evolução */}
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
    </main>
  );
}