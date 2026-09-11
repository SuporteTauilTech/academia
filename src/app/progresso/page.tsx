"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Dumbbell, Calendar, LineChart as ChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Log {
  id: string;
  weight_kg: number;
  completed_at: string;
  workout_items: {
    exercise_id: string;
    exercises: {
      name: string;
      primary_muscle: string;
    } | null;
  } | null;
}

interface ChartPoint {
  data: string;
  peso: number;
}

export default function ProgressoPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("workout_logs")
          .select(`
            id,
            weight_kg,
            completed_at,
            workout_items (
              exercise_id,
              exercises ( name, primary_muscle )
            )
          `)
          .eq("user_id", user.id)
          .order("completed_at", { ascending: true });

        if (data && data.length > 0) {
          const formattedLogs = data as unknown as Log[];
          setLogs(formattedLogs);
          
          // Seleciona por padrão o primeiro exercício registrado
          const firstExId = formattedLogs[0]?.workout_items?.exercise_id;
          if (firstExId) setSelectedExerciseId(firstExId);
        }
      }
      setLoading(false);
    }

    loadLogs();
  }, []);

  // Extrai lista de exercícios únicos gravados nos logs
  const exercisesMap = new Map<string, string>();
  logs.forEach((log) => {
    const exId = log.workout_items?.exercise_id;
    const exName = log.workout_items?.exercises?.name;
    if (exId && exName) {
      exercisesMap.set(exId, exName);
    }
  });

  // Prepara dados formatados para o gráfico do exercício selecionado
  const chartData: ChartPoint[] = logs
    .filter((log) => log.workout_items?.exercise_id === selectedExerciseId)
    .map((log) => ({
      data: new Date(log.completed_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      peso: Number(log.weight_kg),
    }));

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-zinc-950 text-white">
      <div className="w-full max-w-3xl space-y-6">
        <header className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <TrendingUp className="w-7 h-7 text-emerald-500" />
          <div>
            <h1 className="text-xl font-bold">Evolução de Cargas</h1>
            <p className="text-xs text-zinc-400">Acompanhe a sua progressão nos treinos</p>
          </div>
        </header>

        {loading ? (
          <p className="text-xs text-zinc-500">Carregando dados...</p>
        ) : logs.length === 0 ? (
          <div className="p-8 rounded-xl bg-zinc-900/50 border border-dashed border-zinc-800 text-center">
            <p className="text-xs text-zinc-500">Nenhum registro de carga salvo ainda.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Seletor de Exercício para o Gráfico */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                <ChartIcon className="w-4 h-4 text-emerald-500" /> Filtrar por Exercício:
              </span>
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 w-full sm:w-64"
              >
                {Array.from(exercisesMap.entries()).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Painel do Gráfico */}
            <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Gráfico de Progresso (kg)
              </h3>
              
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="data" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} unit="kg" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09090b",
                        borderColor: "#27272a",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "#10b981" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      name="Carga"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabela do Histórico do Exercício Selecionado */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Histórico Recente
              </h3>
              <div className="grid gap-2">
                {[...chartData].reverse().map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex justify-between items-center text-xs"
                  >
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" /> {item.data}
                    </span>
                    <span className="font-bold text-emerald-400">{item.peso} kg</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}