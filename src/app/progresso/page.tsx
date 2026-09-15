"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, Dumbbell, LineChart, Loader2 } from "lucide-react";

interface WorkoutLog {
  id: string;
  workout_title: string;
  completed_at: string;
}

export default function ProgressoPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("student_id", session.user.id)
        .order("completed_at", { ascending: false });

      if (!error && data) {
        setLogs(data as WorkoutLog[]);
      }

      setLoading(false);
    }

    loadLogs();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Topo / Voltar */}
      <header className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </button>
        <h1 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
          <LineChart className="w-4 h-4" /> Histórico de Frequência
        </h1>
      </header>

      {/* Card de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-white">{logs.length}</span>
            <p className="text-xs text-zinc-400">Treinos Concluídos</p>
          </div>
        </div>

        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">
              {logs.length > 0 ? "Foco Mantido!" : "Nenhum registro"}
            </span>
            <p className="text-xs text-zinc-400">Status de Frequência</p>
          </div>
        </div>
      </div>

      {/* Lista de Registros */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Registros Recentes
        </h2>

        {logs.length === 0 ? (
          <div className="p-6 text-center bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <p className="text-xs text-zinc-500">
              Nenhum treino concluído ainda. Marque um treino como finalizado no painel!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">{log.workout_title}</h3>
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(log.completed_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}