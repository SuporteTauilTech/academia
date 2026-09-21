"use client";

import { useState } from "react";
import { Award, Loader2, X } from "lucide-react";

interface WorkoutFeedbackModalProps {
  workoutTitle: string;
  onConfirm: (intensity: string) => void;
  onClose: () => void;
  loading: boolean;
}

const INTENSITY_OPTIONS = [
  "Muito Leve",
  "Leve",
  "Moderada",
  "Pouco Intensa",
  "Intensa",
  "Muito Intensa",
  "Exaustão Máxima",
];

export default function WorkoutFeedbackModal({
  workoutTitle,
  onConfirm,
  onClose,
  loading,
}: WorkoutFeedbackModalProps) {
  const [selectedIntensity, setSelectedIntensity] = useState(INTENSITY_OPTIONS[2]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Tudo Certo!</h3>
          <p className="text-xs text-zinc-400">
            Treino <strong className="text-emerald-400">{workoutTitle}</strong> finalizado com sucesso!
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 block">
            Selecione a intensidade do treino:
          </label>
          <select
            value={selectedIntensity}
            onChange={(e) => setSelectedIntensity(e.target.value)}
            className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
          >
            {INTENSITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onConfirm(selectedIntensity)}
          disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Confirmar e Salvar"
          )}
        </button>
      </div>
    </div>
  );
}