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
  created_at: string;
}

export default function ProgressoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadProgressData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("body_metrics")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMetrics(data as BodyMetric[]);
      }

      setLoading(false);
    }

    loadProgressData();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </main>
    );
  }

  const latestMetric = metrics[0];

  // Prepara os dados cronológicos para os gráficos (da data mais antiga para a mais recente)
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
      <header className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-xl border border-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-emerald-500" /> Meu Progresso Físico
            </h1>
            <p className="text-xs text-zinc-400">
              Acompanhe seu histórico de evolução corporal e medidas.
            </p>
          </div>
        </div>
      </header>

      {metrics.length === 0 ? (
        <div className="p-8 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
          <Activity className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">
            Nenhuma avaliação física registrada
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Assim que seu Personal Trainer cadastrar uma nova avaliação física, seu histórico de peso, % de gordura e gráficos interativos aparecerão aqui.
          </p>
        </div>
      ) : (
        <section className="space-y-6">
          {/* Destaque da Última Avaliação */}
          <div className="p-5 bg-zinc-900 border border-emerald-500/30 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Última Avaliação
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

            {latestMetric.notes && (
              <div className="pt-2 text-xs text-zinc-400 border-t border-zinc-800/80">
                <strong className="text-zinc-300">Observações do Personal: </strong>
                {latestMetric.notes}
              </div>
            )}
          </div>

          {/* Gráficos de Evolução */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico 1: Peso Corporal */}
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

            {/* Gráfico 2: Gordura Corporal (% BF) */}
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

          {/* Tabela de Histórico Completo */}
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Histórico de Avaliações
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="pb-3 font-medium">Data</th>
                    <th className="pb-3 font-medium">Peso</th>
                    <th className="pb-3 font-medium">% BF</th>
                    <th className="pb-3 font-medium">Tórax</th>
                    <th className="pb-3 font-medium">Cintura</th>
                    <th className="pb-3 font-medium">Braço Dir.</th>
                    <th className="pb-3 font-medium">Coxa Dir.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {metrics.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-950/40">
                      <td className="py-3 font-medium text-white">
                        {new Date(m.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3">{m.weight ? `${m.weight} kg` : "-"}</td>
                      <td className="py-3 text-emerald-400 font-semibold">
                        {m.body_fat ? `${m.body_fat}%` : "-"}
                      </td>
                      <td className="py-3">{m.chest ? `${m.chest} cm` : "-"}</td>
                      <td className="py-3">{m.waist ? `${m.waist} cm` : "-"}</td>
                      <td className="py-3">{m.arm_right ? `${m.arm_right} cm` : "-"}</td>
                      <td className="py-3">{m.thigh_right ? `${m.thigh_right} cm` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}