"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Plus, Trash2, Loader2, Save } from "lucide-react";

interface Exercise {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  weight: number;
}

interface Workout {
  id: string;
  title: string;
  exercises: Exercise[];
}

interface EditWorkoutModalProps {
  workout: Workout;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditWorkoutModal({
  workout,
  onClose,
  onSuccess,
}: EditWorkoutModalProps) {
  const [title, setTitle] = useState(workout.title);
  const [exercises, setExercises] = useState<Exercise[]>(workout.exercises);
  const [loading, setLoading] = useState(false);

  function handleAddExercise() {
    setExercises([
      ...exercises,
      { name: "", sets: 3, reps: "10-12", weight: 0 },
    ]);
  }

  function handleRemoveExercise(index: number) {
    if (exercises.length === 1) {
      alert("A ficha precisa ter pelo menos 1 exercício.");
      return;
    }
    const updated = exercises.filter((_, idx) => idx !== index);
    setExercises(updated);
  }

  function handleExerciseChange(
    index: number,
    field: keyof Exercise,
    value: string | number
  ) {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  }

  async function handleSaveWorkout(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      alert("Por favor, preencha o título da ficha.");
      return;
    }

    const hasEmptyExercise = exercises.some((ex) => !ex.name.trim());
    if (hasEmptyExercise) {
      alert("Preencha o nome de todos os exercícios.");
      return;
    }

    setLoading(true);

    try {
      // 1. Atualizar o título do treino
      const { error: workoutError } = await supabase
        .from("workouts")
        .update({ title })
        .eq("id", workout.id);

      if (workoutError) throw workoutError;

      // 2. Remover exercícios antigos associados e re-inserir a lista atualizada
      const { error: deleteError } = await supabase
        .from("exercises")
        .delete()
        .eq("workout_id", workout.id);

      if (deleteError) throw deleteError;

      const exercisesToInsert = exercises.map((ex) => ({
        workout_id: workout.id,
        name: ex.name,
        sets: Number(ex.sets),
        reps: String(ex.reps),
        weight: Number(ex.weight),
      }));

      const { error: insertError } = await supabase
        .from("exercises")
        .insert(exercisesToInsert);

      if (insertError) throw insertError;

      alert("Ficha de treino atualizada com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar ficha:", error);
      alert("Erro ao atualizar a ficha de treino.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-base font-bold text-white">Editar Ficha de Treino</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="Ex: Treino A - Peito e Tríceps"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400">
                Exercícios ({exercises.length})
              </label>
              <button
                type="button"
                onClick={handleAddExercise}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {exercises.map((ex, index) => (
              <div
                key={index}
                className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={ex.name}
                    onChange={(e) =>
                      handleExerciseChange(index, "name", e.target.value)
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Nome do exercício"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(index)}
                    className="text-zinc-500 hover:text-red-400 p-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Séries</label>
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) =>
                        handleExerciseChange(index, "sets", Number(e.target.value))
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white text-center focus:outline-none focus:border-emerald-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Reps</label>
                    <input
                      type="text"
                      value={ex.reps}
                      onChange={(e) =>
                        handleExerciseChange(index, "reps", e.target.value)
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white text-center focus:outline-none focus:border-emerald-500"
                      placeholder="Ex: 10-12"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Carga (kg)</label>
                    <input
                      type="number"
                      value={ex.weight}
                      onChange={(e) =>
                        handleExerciseChange(index, "weight", Number(e.target.value))
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white text-center focus:outline-none focus:border-emerald-500"
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
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" /> Salvar Alterações
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}