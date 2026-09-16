"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Users,
  Plus,
  Loader2,
  CheckCircle2,
  Pencil,
  Trash2,
  Activity,
  ArrowLeft,
} from "lucide-react";
import CreateWorkoutModal from "@/components/CreateWorkoutModal";
import EditWorkoutModal from "@/components/EditWorkoutModal";
import AddMetricsModal from "@/components/AddMetricsModal";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "personal" | "aluno" | "student";
}

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

export default function FichasDeTreinoPage() {
  const router = useRouter();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadInitialData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Busca alunos para o selector
      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .neq("email", "xiton@personal.com");

      if (usersData && usersData.length > 0) {
        const mappedStudents: UserProfile[] = usersData.map((u) => ({
          id: u.id,
          name: u.name || u.full_name || "Jogador",
          email: u.email || "",
          role: u.role || "aluno",
        }));
        setStudents(mappedStudents);
        setSelectedStudentId(mappedStudents[0].id);
        fetchWorkouts(mappedStudents[0].id);
      } else {
        const fallbackStudent: UserProfile = {
          id: "b99db051-cb24-4e38-a257-1947d3fad63a",
          name: "Jogador",
          email: "jogadorteste2020@gmail.com",
          role: "aluno",
        };
        setStudents([fallbackStudent]);
        setSelectedStudentId(fallbackStudent.id);
        fetchWorkouts(fallbackStudent.id);
      }

      setLoading(false);
    }

    loadInitialData();
  }, [router]);

  async function fetchWorkouts(studentId: string) {
    setLoadingWorkouts(true);
    const { data, error } = await supabase
      .from("workouts")
      .select("*, exercises(*)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setWorkouts(data as Workout[]);
      if (data.length > 0) {
        setSelectedWorkout(data[0] as Workout);
      } else {
        setSelectedWorkout(null);
      }
    }
    setLoadingWorkouts(false);
  }

  function handleStudentChange(studentId: string) {
    setSelectedStudentId(studentId);
    fetchWorkouts(studentId);
  }

  async function handleDeleteWorkout(workoutId: string) {
    const confirmDelete = confirm("Tem certeza que deseja excluir esta ficha de treino?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("workouts").delete().eq("id", workoutId);

    if (error) {
      alert("Erro ao excluir ficha de treino.");
    } else {
      alert("Ficha excluída com sucesso!");
      fetchWorkouts(selectedStudentId);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </main>
    );
  }

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
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
              <Dumbbell className="w-5 h-5 text-emerald-500" /> Fichas de Treino
            </h1>
            <p className="text-xs text-zinc-400">
              Gerencie a montagem do programa de treinos e avaliações dos alunos.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Painel Esquerdo: Criar Ficha e Selecionar Aluno */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" /> Selecionar Aluno
            </h3>

            <select
              value={selectedStudentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-medium text-xs text-white transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nova Ficha de Treino
              </button>

              <button
                onClick={() => setIsMetricsModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-medium text-xs text-emerald-400 transition-colors flex items-center justify-center gap-2"
              >
                <Activity className="w-4 h-4" /> Nova Avaliação Física
              </button>
            </div>
          </div>

          {/* Lista de Fichas do Aluno Selecionado */}
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Fichas do Aluno ({workouts.length})
            </h3>

            {loadingWorkouts ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
              </div>
            ) : workouts.length === 0 ? (
              <p className="text-xs text-zinc-500 py-2">Nenhuma ficha cadastrada.</p>
            ) : (
              <div className="space-y-2">
                {workouts.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWorkout(w)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedWorkout?.id === w.id
                        ? "bg-emerald-950/20 border-emerald-500/50 text-white"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{w.title}</h4>
                      <p className="text-[10px] text-zinc-500">
                        {w.exercises?.length || 0} exercícios
                      </p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Painel Direito: Detalhes da Ficha Selecionada */}
        <div className="md:col-span-2">
          {selectedWorkout ? (
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    {selectedWorkout.title}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Aluno: {currentStudent?.name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingWorkout(selectedWorkout)}
                    className="p-2 text-zinc-400 hover:text-emerald-400 transition-colors bg-zinc-950 border border-zinc-800 rounded-lg"
                    title="Editar ficha"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteWorkout(selectedWorkout.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 transition-colors bg-zinc-950 border border-zinc-800 rounded-lg"
                    title="Excluir ficha"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lista de Exercicios */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Exercícios do Treino
                </h3>

                <div className="space-y-2">
                  {selectedWorkout.exercises.map((ex, idx) => (
                    <div
                      key={ex.id}
                      className="p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-emerald-400 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {ex.name}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 font-medium">
                        {ex.sets} séries × {ex.reps} reps •{" "}
                        <strong className="text-emerald-400">{ex.weight} kg</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl">
              <p className="text-xs text-zinc-500">
                Selecione uma ficha de treino na lista para visualizar os exercícios.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      {isCreateModalOpen && currentStudent && (
        <CreateWorkoutModal
          studentId={currentStudent.id}
          studentName={currentStudent.name}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => fetchWorkouts(currentStudent.id)}
        />
      )}

      {isMetricsModalOpen && currentStudent && (
        <AddMetricsModal
          studentId={currentStudent.id}
          studentName={currentStudent.name}
          onClose={() => setIsMetricsModalOpen(false)}
          onSuccess={() => fetchWorkouts(currentStudent.id)}
        />
      )}

      {editingWorkout && currentStudent && (
        <EditWorkoutModal
          workout={editingWorkout}
          onClose={() => setEditingWorkout(null)}
          onSuccess={() => fetchWorkouts(currentStudent.id)}
        />
      )}
    </main>
  );
}