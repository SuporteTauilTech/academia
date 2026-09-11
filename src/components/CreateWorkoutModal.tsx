"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Plus, Trash2, Dumbbell, Loader2 } from "lucide-react";

interface ExerciseInput {
  name: string;
  sets: number;
  reps: string;
  weight: number;
}

interface CreateWorkoutModalProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateWorkoutModal({
  studentId,
  studentName,
  onClose,
  onSuccess,
}: CreateWorkoutModalProps) {
  const [workoutTitle, setWorkoutTitle] = useState("Treino A - Peito e Tríceps");
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    { name: "Supino Reto", sets: 4, reps: "10-12", weight: 20 },
  ]);

  function handleAddExercise() {
    setExercises([
      ...exercises,
      { name: "", sets: 3, reps: "10", weight: 0 },
    ]);
  }

  function handleRemoveExercise(index: number) {
    setExercises(exercises.filter((_, i) => i !== index));
  }

  function handleExerciseChange(
    index: number,
    field: keyof ExerciseInput,
    value: string | number
  ) {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  }

  async function handleSaveWorkout(e: React.FormEvent) {
    e.preventDefault();
    if (!workoutTitle.trim() || exercises.length === 0) return;

    setLoading(true);

    try {
      // 1. Criar a ficha na tabela 'workouts'
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .insert([
          {
            title: workoutTitle,
            student_id: studentId,
          },
        ])
        .select()
        .single();

      if (workoutError) throw workoutError;

      // 2. Inserir os exercícios na tabela 'exercises'
      const exercisePayload = exercises.map((ex) => ({
        workout_id: workoutData.id,
        name: ex.name,
        sets: Number(ex.sets),
        reps: ex.reps,
        weight: Number(ex.weight),
      }));

      const { error: exerciseError } = await supabase
        .from("exercises")
        .insert(exercisePayload);

      if (exerciseError) throw exerciseError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro detalhado ao salvar treino:", err);
      alert(`Erro ao salvar a ficha: ${err?.message || "Verifique o console"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <div>
            <h2 className="font-bold text-white text-base">Nova Ficha de Treino</h2>
            <p className="text-xs text-zinc-400">Aluno: {studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveWorkout} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Título da Ficha
            </label>
            <input
              type="text"
              value={workoutTitle}
              onChange={(e) => setWorkoutTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="Ex: Treino A - Peito e Tríceps"
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400">
                Exercícios
              </label>
              <button
                type="button"
                onClick={handleAddExercise}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {exercises.map((ex, index) => (
              <div
                key={index}
                className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 relative group"
              >
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-emerald-500 shrink-0" />
                  <input
                    type="text"
                    value={ex.name}
                    onChange={(e) =>
                      handleExerciseChange(index, "name", e.target.value)
                    }
                    placeholder="Nome do exercício"
                    className="w-full bg-transparent text-sm text-white font-medium focus:outline-none"
                    required
                  />
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(index)}
                      className="text-zinc-600 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-900 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Séries</span>
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) =>
                        handleExerciseChange(index, "sets", e.target.value)
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white text-center mt-0.5"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Reps</span>
                    <input
                      type="text"
                      value={ex.reps}
                      onChange={(e) =>
                        handleExerciseChange(index, "reps", e.target.value)
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white text-center mt-0.5"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Carga (kg)</span>
                    <input
                      type="number"
                      value={ex.weight}
                      onChange={(e) =>
                        handleExerciseChange(index, "weight", e.target.value)
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white text-center mt-0.5"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Salvar e Enviar para o Aluno"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}