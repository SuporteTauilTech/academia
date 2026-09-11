"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Dumbbell, ChevronRight, Clock, Repeat, Trash2 } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Exercise {
  id: string;
  name: string;
  primary_muscle: string;
}

interface Plan {
  id: string;
  title: string;
  created_at: string;
  users: { name: string } | null;
}

interface Division {
  id: string;
  name: string;
  order_index: number;
}

interface WorkoutItem {
  id: string;
  workout_division_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  exercises: { name: string } | null;
}

export default function TreinosPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  // Ficha Selecionada
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [items, setItems] = useState<WorkoutItem[]>([]);

  // Forms
  const [title, setTitle] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [divisionName, setDivisionName] = useState("");
  
  // Item Form
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState("10 a 12");
  const [rest, setRest] = useState(60);

  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);

    const { data: studentsData } = await supabase.from("users").select("id, name, email").eq("role", "student");
    if (studentsData) setStudents(studentsData);

    const { data: exercisesData } = await supabase.from("exercises").select("id, name, primary_muscle");
    if (exercisesData) setExercises(exercisesData);

    const { data: plansData } = await supabase
      .from("workout_plans")
      .select("id, title, created_at, users:student_id ( name )")
      .order("created_at", { ascending: false });

    if (plansData) setPlans(plansData as unknown as Plan[]);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadPlanDetails(plan: Plan) {
    setSelectedPlan(plan);

    const { data: divData } = await supabase
      .from("workout_divisions")
      .select("*")
      .eq("workout_plan_id", plan.id)
      .order("order_index", { ascending: true });

    if (divData) {
      setDivisions(divData);
      if (divData.length > 0) setSelectedDivision(divData[0].id);

      const divIds = divData.map((d) => d.id);
      if (divIds.length > 0) {
        const { data: itemsData } = await supabase
          .from("workout_items")
          .select("*, exercises:exercise_id(name)")
          .in("workout_division_id", divIds);

        if (itemsData) setItems(itemsData as unknown as WorkoutItem[]);
      } else {
        setItems([]);
      }
    }
  }

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !selectedStudent) return;

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("workout_plans").insert([
      { title, student_id: selectedStudent, personal_id: user?.id || selectedStudent }
    ]);

    if (!error) {
      setTitle("");
      setSelectedStudent("");
      loadData();
    } else {
      alert("Erro ao criar ficha: " + error.message);
    }
    setSubmitting(false);
  }

  async function handleAddDivision(e: React.FormEvent) {
    e.preventDefault();
    if (!divisionName || !selectedPlan) return;

    const { error } = await supabase.from("workout_divisions").insert([
      { workout_plan_id: selectedPlan.id, name: divisionName, order_index: divisions.length + 1 }
    ]);

    if (!error) {
      setDivisionName("");
      loadPlanDetails(selectedPlan);
    }
  }

  async function handleDeleteDivision(divisionId: string) {
    if (!confirm("Tem certeza que deseja apagar esta divisão?")) return;
    const { error } = await supabase.from("workout_divisions").delete().eq("id", divisionId);
    if (!error && selectedPlan) loadPlanDetails(selectedPlan);
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDivision || !selectedExercise || !selectedPlan) return;

    const { error } = await supabase.from("workout_items").insert([
      {
        workout_division_id: selectedDivision,
        exercise_id: selectedExercise,
        sets,
        reps,
        rest_seconds: rest
      }
    ]);

    if (!error) {
      setSelectedExercise("");
      loadPlanDetails(selectedPlan);
    }
  }

  async function handleDeleteItem(itemId: string) {
    const { error } = await supabase.from("workout_items").delete().eq("id", itemId);
    if (!error && selectedPlan) loadPlanDetails(selectedPlan);
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-zinc-950 text-white">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Cadastro e Lista de Fichas */}
        <div className="md:col-span-1 space-y-6">
          <form onSubmit={handleCreatePlan} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500" /> Nova Ficha
            </h2>
            <input
              type="text"
              placeholder="Título (ex: Hipertrofia A/B)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              required
              className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Selecione o Aluno</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-xs transition-colors disabled:opacity-50"
            >
              Criar Ficha
            </button>
          </form>

          {/* Lista de Fichas */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fichas</h3>
            {loading ? (
              <p className="text-xs text-zinc-500">Carregando...</p>
            ) : plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => loadPlanDetails(plan)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  selectedPlan?.id === plan.id
                    ? "bg-zinc-800 border-emerald-500"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div>
                  <h4 className="font-medium text-sm">{plan.title}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Aluno: {plan.users?.name || "Não informado"}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Detalhamento da Ficha Selecionada */}
        <div className="md:col-span-2 space-y-6">
          {selectedPlan ? (
            <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedPlan.title}</h2>
                <p className="text-xs text-emerald-400 mt-1">Aluno: {selectedPlan.users?.name}</p>
              </div>

              {/* Form Adicionar Divisão */}
              <form onSubmit={handleAddDivision} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome da Divisão (ex: Treino A - Peito/Tríceps)"
                  value={divisionName}
                  onChange={(e) => setDivisionName(e.target.value)}
                  required
                  className="flex-1 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-emerald-400 border border-zinc-700 font-medium"
                >
                  + Divisão
                </button>
              </form>

              {divisions.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">Nenhuma divisão criada nesta ficha.</p>
              ) : (
                <div className="space-y-6">
                  {/* Form Adicionar Exercício */}
                  <form onSubmit={handleAddItem} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-300">Adicionar Exercício à Divisão</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedDivision}
                        onChange={(e) => setSelectedDivision(e.target.value)}
                        className="p-2 rounded bg-zinc-900 border border-zinc-800 text-xs text-white"
                      >
                        {divisions.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>

                      <select
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                        required
                        className="p-2 rounded bg-zinc-900 border border-zinc-800 text-xs text-white"
                      >
                        <option value="">Selecione o Exercício</option>
                        {exercises.map((ex) => (
                          <option key={ex.id} value={ex.id}>{ex.name} ({ex.primary_muscle})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400">Séries</label>
                        <input
                          type="number"
                          value={sets}
                          onChange={(e) => setSets(Number(e.target.value))}
                          className="w-full p-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400">Repetições</label>
                        <input
                          type="text"
                          value={reps}
                          onChange={(e) => setReps(e.target.value)}
                          className="w-full p-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400">Descanso (seg)</label>
                        <input
                          type="number"
                          value={rest}
                          onChange={(e) => setRest(Number(e.target.value))}
                          className="w-full p-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 font-medium text-xs text-white transition-colors"
                    >
                      Adicionar Exercício
                    </button>
                  </form>

                  {/* Exibição das Divisões */}
                  {divisions.map((div) => {
                    const divItems = items.filter((i) => i.workout_division_id === div.id);
                    return (
                      <div key={div.id} className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <h3 className="font-semibold text-sm text-emerald-400">{div.name}</h3>
                          <button
                            onClick={() => handleDeleteDivision(div.id)}
                            className="text-zinc-500 hover:text-red-400 transition-colors"
                            title="Excluir Divisão"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {divItems.length === 0 ? (
                          <p className="text-xs text-zinc-600">Nenhum exercício nesta divisão.</p>
                        ) : (
                          <div className="space-y-2">
                            {divItems.map((item) => (
                              <div key={item.id} className="p-2.5 rounded bg-zinc-900 border border-zinc-800/80 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <Dumbbell className="w-4 h-4 text-emerald-500" />
                                  <span className="font-medium">{item.exercises?.name}</span>
                                </div>
                                <div className="flex items-center gap-4 text-zinc-400">
                                  <span className="flex items-center gap-1">
                                    <Repeat className="w-3 h-3 text-zinc-500" />
                                    {item.sets} x {item.reps}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-zinc-500" />
                                    {item.rest_seconds}s
                                  </span>
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="text-zinc-500 hover:text-red-400 transition-colors ml-2"
                                    title="Excluir Exercício"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-zinc-900/50 border border-dashed border-zinc-800 text-center text-zinc-500 text-xs">
              Selecione uma ficha à esquerda para gerenciar os treinos.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}