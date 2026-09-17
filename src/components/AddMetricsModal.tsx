"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { X, Loader2, Save, Activity } from "lucide-react";

interface AddMetricsModalProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMetricsModal({
  studentId,
  studentName,
  onClose,
  onSuccess,
}: AddMetricsModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    body_fat: "",
    muscle_mass: "",
    chest: "",
    waist: "",
    hips: "",
    arm_left: "",
    arm_right: "",
    thigh_left: "",
    thigh_right: "",
    calf_left: "",
    calf_right: "",
    notes: "",
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Converte virgula para ponto e faz o parse de forma segura
  function parseNumber(value: string): number | null {
    if (!value || value.trim() === "") return null;
    const cleanValue = value.replace(",", ".");
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      student_id: studentId,
      weight: parseNumber(formData.weight),
      height: parseNumber(formData.height),
      body_fat: parseNumber(formData.body_fat),
      muscle_mass: parseNumber(formData.muscle_mass),
      chest: parseNumber(formData.chest),
      waist: parseNumber(formData.waist),
      hips: parseNumber(formData.hips),
      arm_left: parseNumber(formData.arm_left),
      arm_right: parseNumber(formData.arm_right),
      thigh_left: parseNumber(formData.thigh_left),
      thigh_right: parseNumber(formData.thigh_right),
      calf_left: parseNumber(formData.calf_left),
      calf_right: parseNumber(formData.calf_right),
      notes: formData.notes || null,
    };

    const { error } = await supabase.from("body_metrics").insert([payload]);

    if (error) {
      console.error("Erro ao salvar avaliação:", error);
      alert(`Erro ao salvar avaliação física: ${error.message}`);
    } else {
      alert("Avaliação física cadastrada com sucesso!");
      onSuccess();
      onClose();
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 pt-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Nova Avaliação Física</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Aluno: {studentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Composição Corporal */}
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
              Composição Corporal
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Peso (kg)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="Ex: 75,5"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Altura (cm)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="Ex: 175"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Gordura (%)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="body_fat"
                  value={formData.body_fat}
                  onChange={handleChange}
                  placeholder="Ex: 15,0"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Massa Magra (kg)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="muscle_mass"
                  value={formData.muscle_mass}
                  onChange={handleChange}
                  placeholder="Ex: 62,0"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Perímetros Corporais */}
          <div>
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
              Perímetros Corporal (cm)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Tórax / Peito</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="chest"
                  value={formData.chest}
                  onChange={handleChange}
                  placeholder="Ex: 100"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Cintura</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="waist"
                  value={formData.waist}
                  onChange={handleChange}
                  placeholder="Ex: 80"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Quadril</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="hips"
                  value={formData.hips}
                  onChange={handleChange}
                  placeholder="Ex: 95"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Braço Esquerdo</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="arm_left"
                  value={formData.arm_left}
                  onChange={handleChange}
                  placeholder="Ex: 35"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Braço Direito</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="arm_right"
                  value={formData.arm_right}
                  onChange={handleChange}
                  placeholder="Ex: 35,5"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Coxa Esquerda</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="thigh_left"
                  value={formData.thigh_left}
                  onChange={handleChange}
                  placeholder="Ex: 58"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Coxa Direita</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="thigh_right"
                  value={formData.thigh_right}
                  onChange={handleChange}
                  placeholder="Ex: 58,5"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Panturrilha Esquerda</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="calf_left"
                  value={formData.calf_left}
                  onChange={handleChange}
                  placeholder="Ex: 38"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Panturrilha Direita</label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="calf_right"
                  value={formData.calf_right}
                  onChange={handleChange}
                  placeholder="Ex: 38"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">Observações do Personal</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Ex: Boa evolução no percentual de gordura. Foco em hipertrofia de braços no próximo mês."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-medium text-xs text-zinc-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-xs text-white transition-colors flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Avaliação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}