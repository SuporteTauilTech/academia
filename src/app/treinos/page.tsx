"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";

interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number;
}

interface Workout {
  id: string;
  title: string;
  student_id: string;
  exercises: Exercise[];
}

export default function TreinosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [studentId, setStudentId] = useState<string>("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadStudentWorkouts() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setStudentId(user.id);

      const { data, error } = await supabase
        .from("workouts")
        .select("*, exercises(*)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setWorkouts(data as Workout[]);
        if (data.length > 0) {
          setSelectedWorkout(data[0] as Workout);
        }
      }

      setLoading(false);
    }

    loadStudentWorkouts();
  }, [router]);

  async function handleCompleteWorkout() {
    if (!selectedWorkout || !studentId) return;

    setCompleting(true);

    const payload = {
      student_id: studentId,
      workout_id: selectedWorkout.id,
      workout_title: selectedWorkout.title,
    };

    const { error } = await supabase.from("workout_logs").insert([payload]);

    if (error) {
      console.error("Erro ao registrar treino:", error);
      alert(`Erro ao registrar treino concluído: ${error.message}`);
    } else {
      alert(`Parabéns! Treino "${selectedWorkout.title}" concluído com sucesso! 💪`);
    }

    setCompleting(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-20">
      <header className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <button
          onClick={() => router.push("/")}
          className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-xl border border-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-emerald-500" /> Meu Treino
          </h1>
          <p className="text-xs text-zinc-400">
            Acesse suas fichas de treino e registre a conclusão.
          </p>
        </div>
      </header>

      {workouts.length === 0 ? (
        <div className="p-8 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
          <Dumbbell className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">
            Nenhuma ficha de treino disponível
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Assim que seu Personal Trainer cadastrar sua ficha de treino, ela aparecerá aqui para você acompanhar a execução.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Seletor de Fichas */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {workouts.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWorkout(w)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedWorkout?.id === w.id
                    ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {w.title}
              </button>
            ))}
          </div>

          {/* Ficha Selecionada */}
          {selectedWorkout && (
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    {selectedWorkout.title}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {selectedWorkout.exercises.length} exercícios na ficha
                  </p>
                </div>

                <button
                  onClick={handleCompleteWorkout}
                  disabled={completing}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-95"
                >
                  {completing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Concluir Este Treino
                </button>
              </div>

              {/* Lista de Exercicios */}
              <div className="space-y-3">
                {selectedWorkout.exercises.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white">{ex.name}</h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {ex.sets} séries × {ex.reps} reps
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-500/20">
                      {ex.weight} kg
                    </span>
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