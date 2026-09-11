"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Dumbbell, CheckCircle2, Circle, Clock, Repeat, Flame, History, Save } from "lucide-react";

interface Exercise {
  name: string;
  description: string;
}

interface WorkoutItem {
  id: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  exercises: Exercise | null;
}

interface Division {
  id: string;
  name: string;
  workout_items: WorkoutItem[];
}

interface Plan {
  id: string;
  title: string;
  workout_divisions: Division[];
}

interface LogHistory {
  weight_kg: number;
  completed_at: string;
}

export default function AlunoPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [activeDivision, setActiveDivision] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<Record<string, LogHistory[]>>({});
  const [openHistoryId, setOpenHistoryId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudentWorkout() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const { data: planData } = await supabase
          .from("workout_plans")
          .select(`
            id,
            title,
            workout_divisions (
              id,
              name,
              workout_items (
                id,
                sets,
                reps,
                rest_seconds,
                exercises ( name, description )
              )
            )
          `)
          .eq("student_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (planData) {
          const formattedPlan = planData as unknown as Plan;
          setPlan(formattedPlan);
          if (formattedPlan.workout_divisions?.length > 0) {
            setActiveDivision(formattedPlan.workout_divisions[0].id);
          }
        }
      }
      setLoading(false);
    }

    loadStudentWorkout();
  }, []);

  async function handleSaveWeight(itemId: string) {
    const weightVal = parseFloat(weights[itemId]);
    if (isNaN(weightVal) || weightVal <= 0 || !userId) return;

    const { error } = await supabase.from("workout_logs").insert([
      {
        user_id: userId,
        workout_item_id: itemId,
        weight_kg: weightVal,
      },
    ]);

    if (!error) {
      setCompletedItems((prev) => ({ ...prev, [itemId]: true }));
      loadItemHistory(itemId);
    } else {
      alert("Erro ao salvar carga: " + error.message);
    }
  }

  async function loadItemHistory(itemId: string) {
    if (openHistoryId === itemId) {
      setOpenHistoryId(null);
      return;
    }

    const { data } = await supabase
      .from("workout_logs")
      .select("weight_kg, completed_at")
      .eq("workout_item_id", itemId)
      .order("completed_at", { ascending: false })
      .limit(5);

    if (data) {
      setHistory((prev) => ({ ...prev, [itemId]: data as LogHistory[] }));
      setOpenHistoryId(itemId);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 bg-zinc-950 text-white">
        <p className="text-sm text-zinc-500 animate-pulse">Carregando seu treino...</p>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-950 text-white text-center">
        <Dumbbell className="w-12 h-12 text-zinc-700 mb-3" />
        <h2 className="text-lg font-bold">Nenhum treino encontrado</h2>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs">
          Solicite ao seu personal trainer para cadastrar uma ficha de treino para a sua conta.
        </p>
      </main>
    );
  }

  const selectedDiv = plan.workout_divisions.find((d) => d.id === activeDivision);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 bg-zinc-950 text-white pb-12">
      <div className="w-full max-w-md space-y-5">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-zinc-900 border border-emerald-500/30">
          <span className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">Ficha Ativa</span>
          <h1 className="text-xl font-bold text-white mt-0.5">{plan.title}</h1>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {plan.workout_divisions.map((div) => (
            <button
              key={div.id}
              onClick={() => setActiveDivision(div.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeDivision === div.id
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800"
              }`}
            >
              {div.name}
            </button>
          ))}
        </div>

        {selectedDiv && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{selectedDiv.name}</h2>
              <span className="text-[11px] text-zinc-500">
                {Object.keys(completedItems).filter((k) => completedItems[k]).length} / {selectedDiv.workout_items.length} concluídos
              </span>
            </div>

            {selectedDiv.workout_items.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-8">Nenhum exercício nesta divisão.</p>
            ) : (
              selectedDiv.workout_items.map((item) => {
                const isDone = !!completedItems[item.id];
                const itemHistory = history[item.id] || [];
                const isHistoryOpen = openHistoryId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      isDone
                        ? "bg-zinc-900/40 border-emerald-900/40"
                        : "bg-zinc-900 border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Flame className={`w-4 h-4 ${isDone ? "text-emerald-500" : "text-emerald-500"}`} />
                          <h3 className={`font-semibold text-sm ${isDone ? "line-through text-zinc-500" : "text-white"}`}>
                            {item.exercises?.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-400 pl-6">
                          <span className="flex items-center gap-1">
                            <Repeat className="w-3 h-3 text-zinc-500" />
                            {item.sets} x {item.reps}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {item.rest_seconds}s
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setCompletedItems((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                        className="text-zinc-500"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-zinc-700 hover:text-zinc-500" />
                        )}
                      </button>
                    </div>

                    {/* Registro de Carga */}
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                      <div className="flex-1 flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                        <input
                          type="number"
                          placeholder="Carga (kg)"
                          value={weights[item.id] || ""}
                          onChange={(e) => setWeights({ ...weights, [item.id]: e.target.value })}
                          className="w-full bg-transparent text-xs text-white focus:outline-none"
                        />
                        <span className="text-[10px] text-zinc-500 font-medium">kg</span>
                      </div>

                      <button
                        onClick={() => handleSaveWeight(item.id)}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar</span>
                      </button>

                      <button
                        onClick={() => loadItemHistory(item.id)}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors"
                        title="Ver histórico"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Painel do Histórico de Cargas */}
                    {isHistoryOpen && (
                      <div className="mt-2 p-2.5 bg-zinc-950 rounded-lg border border-zinc-800/60 space-y-1.5 text-xs">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Histórico de Cargas</span>
                        {itemHistory.length === 0 ? (
                          <p className="text-zinc-600 text-[11px]">Nenhum registro anterior.</p>
                        ) : (
                          itemHistory.map((h, idx) => (
                            <div key={idx} className="flex justify-between items-center text-zinc-400 text-[11px]">
                              <span>{new Date(h.completed_at).toLocaleDateString("pt-BR")}</span>
                              <span className="font-semibold text-emerald-400">{h.weight_kg} kg</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </main>
  );
}