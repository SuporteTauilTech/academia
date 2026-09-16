"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Users,
  LineChart,
  LogOut,
  Loader2,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  Save,
  Trash2,
  Plus,
  Check,
  Pencil,
} from "lucide-react";
import CreateWorkoutModal from "@/components/CreateWorkoutModal";
import EditWorkoutModal from "@/components/EditWorkoutModal";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "personal" | "aluno" | "student";
  status?: string;
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
  exercises: Exercise[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [selectedStudentWorkouts, setSelectedStudentWorkouts] = useState<Workout[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  const [studentWorkouts, setStudentWorkouts] = useState<Workout[]>([]);
  const [savingExerciseId, setSavingExerciseId] = useState<string | null>(null);
  const [completingWorkoutId, setCompletingWorkoutId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadDashboardData() {
      // 1. Obtém o usuário direto da Auth
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 2. Busca o perfil usando maybeSingle() para evitar lançar exceção
      const { data: userData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // Redireciona caso esteja explicitamente pendente
      if (userData?.status === "pendente") {
        router.push("/aguardando-aprovacao");
        return;
      }

      // Se for a conta do Personal Trainer ou o perfil definir 'personal'
      const isPersonal = userData?.role === "personal" || user.email === "xiton@personal.com";
      const determinedRole = isPersonal ? "personal" : (userData?.role || "aluno");

      const currentUserProfile: UserProfile = {
        id: user.id,
        name: userData?.full_name || (isPersonal ? "Xiton Personal" : user.email?.split("@")[0] || "Usuário"),
        email: user.email || "",
        role: determinedRole as "personal" | "aluno" | "student",
        status: userData?.status || "ativo",
      };

      setProfile(currentUserProfile);

      // Carrega dados baseados na role resolvida
      if (currentUserProfile.role === "personal") {
        const { data: studentsData } = await supabase
          .from("profiles")
          .select("*")
          .in("role", ["aluno", "student"])
          .order("full_name", { ascending: true });

        if (studentsData) {
          const mappedStudents: UserProfile[] = studentsData.map((s) => ({
            id: s.id,
            name: s.full_name || "Aluno sem nome",
            email: s.email || "",
            role: s.role,
            status: s.status,
          }));
          setStudents(mappedStudents);
        }
      } else {
        fetchStudentWorkouts(user.id);
      }

      setLoading(false);
    }

    loadDashboardData();
  }, [router]);

  async function fetchSelectedStudentWorkouts(studentId: string) {
    setLoadingWorkouts(true);
    const { data: workoutsData, error } = await supabase
      .from("workouts")
      .select("*, exercises(*)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (!error && workoutsData) {
      setSelectedStudentWorkouts(workoutsData as Workout[]);
    }
    setLoadingWorkouts(false);
  }

  function handleSelectStudent(student: UserProfile) {
    setSelectedStudent(student);
    fetchSelectedStudentWorkouts(student.id);
  }

  async function fetchStudentWorkouts(studentId: string) {
    const { data: workoutsData, error } = await supabase
      .from("workouts")
      .select("*, exercises(*)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (!error && workoutsData) {
      setStudentWorkouts(workoutsData as Workout[]);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleDeleteWorkout(workoutId: string) {
    const confirmDelete = confirm("Tem certeza que deseja excluir esta ficha de treino?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("workouts")
      .delete()
      .eq("id", workoutId);

    if (error) {
      console.error("Erro ao excluir treino:", error);
      alert("Erro ao excluir a ficha de treino.");
    } else {
      alert("Ficha excluída com sucesso!");
      if (selectedStudent) {
        fetchSelectedStudentWorkouts(selectedStudent.id);
      }
    }
  }

  function handleWeightChange(workoutIndex: number, exerciseIndex: number, newWeight: number) {
    const updatedWorkouts = [...studentWorkouts];
    updatedWorkouts[workoutIndex].exercises[exerciseIndex].weight = newWeight;
    setStudentWorkouts(updatedWorkouts);
  }

  async function handleSaveWeight(exercise: Exercise) {
    setSavingExerciseId(exercise.id);

    const { error } = await supabase
      .from("exercises")
      .update({ weight: exercise.weight })
      .eq("id", exercise.id);

    if (error) {
      console.error("Erro ao atualizar peso:", error);
      alert("Erro ao salvar carga.");
    } else {
      alert("Carga atualizada com sucesso!");
    }

    setSavingExerciseId(null);
  }

  async function handleCompleteWorkout(workoutTitle: string, workoutId: string) {
    if (!profile) return;
    setCompletingWorkoutId(workoutId);

    const { error } = await supabase.from("workout_logs").insert([
      {
        student_id: profile.id,
        workout_id: workoutId,
        workout_title: workoutTitle,
      },
    ]);

    if (error) {
      console.error("Erro ao registrar treino:", error);
      alert("Erro ao registrar conclusão do treino.");
    } else {
      alert("Parabéns! Treino registrado com sucesso no seu histórico.");
    }

    setCompletingWorkoutId(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <header className="flex justify-between items-center pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Dumbbell className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-base font-bold">{profile?.name || "Usuário"}</h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-emerald-400 font-medium">
              {profile?.role === "personal" ? "Personal Trainer" : "Aluno"}
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="p-2 text-zinc-400 hover:text-red-400 transition-colors rounded-lg hover:bg-zinc-900"
          title="Sair da conta"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* VISÃO DO PERSONAL TRAINER */}
      {profile?.role === "personal" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" /> Alunos Cadastrados ({students.length})
            </h2>
          </div>

          {students.length === 0 ? (
            <div className="p-6 text-center bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-500">Nenhum aluno cadastrado no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedStudent?.id === student.id
                      ? "bg-emerald-950/20 border-emerald-500/50 text-white"
                      : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-800 rounded-full">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{student.name}</h3>
                      <p className="text-xs text-zinc-400">{student.email}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </div>
              ))}
            </div>
          )}

          {selectedStudent && (
            <div className="mt-6 p-5 rounded-2xl bg-zinc-900 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-emerald-400">
                    Gerenciar Fichas: {selectedStudent.name}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Acompanhe e edite o programa de treinos do aluno.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-xs text-white transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Nova Ficha
                </button>
              </div>

              {loadingWorkouts ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                </div>
              ) : selectedStudentWorkouts.length === 0 ? (
                <p className="text-xs text-zinc-500 py-2">
                  Este aluno ainda não possui fichas cadastradas.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedStudentWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {workout.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingWorkout(workout)}
                            className="p-1.5 text-zinc-400 hover:text-emerald-400 transition-colors rounded-lg hover:bg-zinc-900"
                            title="Editar ficha"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWorkout(workout.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded-lg hover:bg-zinc-900"
                            title="Excluir ficha"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 border-t border-zinc-900">
                        {workout.exercises.map((ex) => (
                          <div
                            key={ex.id}
                            className="flex justify-between items-center text-xs text-zinc-400"
                          >
                            <span>{ex.name}</span>
                            <span className="text-zinc-500">
                              {ex.sets}x{ex.reps} • {ex.weight}kg
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* VISÃO DO ALUNO */}
      {(profile?.role === "aluno" || profile?.role === "student") && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <LineChart className="w-4 h-4 text-emerald-500" /> Minhas Fichas de Treino
            </h2>
            <button
              onClick={() => router.push("/progresso")}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              Ver meu histórico completo →
            </button>
          </div>

          {studentWorkouts.length === 0 ? (
            <div className="p-6 text-center bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <p className="text-xs text-zinc-500">
                Você ainda não possui fichas de treino atribuídas.
              </p>
            </div>
          ) : (
            studentWorkouts.map((workout, wIdx) => (
              <div
                key={workout.id}
                className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    {workout.title}
                  </h3>
                  <button
                    onClick={() => handleCompleteWorkout(workout.title, workout.id)}
                    disabled={completingWorkoutId === workout.id}
                    className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1 transition-colors"
                  >
                    {completingWorkoutId === workout.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Concluir Treino
                  </button>
                </div>

                <div className="space-y-3">
                  {workout.exercises.map((exercise, eIdx) => (
                    <div
                      key={exercise.id}
                      className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {exercise.name}
                        </h4>
                        <p className="text-xs text-zinc-400">
                          {exercise.sets} Séries × {exercise.reps} Repetições
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                          <span className="text-xs text-zinc-500">Carga:</span>
                          <input
                            type="number"
                            value={exercise.weight}
                            onChange={(e) =>
                              handleWeightChange(wIdx, eIdx, Number(e.target.value))
                            }
                            className="w-14 bg-transparent text-sm font-bold text-emerald-400 text-center focus:outline-none"
                            min="0"
                          />
                          <span className="text-xs text-zinc-400">kg</span>
                        </div>

                        <button
                          onClick={() => handleSaveWeight(exercise)}
                          disabled={savingExerciseId === exercise.id}
                          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center justify-center"
                          title="Salvar nova carga"
                        >
                          {savingExerciseId === exercise.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* Modais */}
      {isModalOpen && selectedStudent && (
        <CreateWorkoutModal
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchSelectedStudentWorkouts(selectedStudent.id);
          }}
        />
      )}

      {editingWorkout && selectedStudent && (
        <EditWorkoutModal
          workout={editingWorkout}
          onClose={() => setEditingWorkout(null)}
          onSuccess={() => {
            fetchSelectedStudentWorkouts(selectedStudent.id);
          }}
        />
      )}
    </main>
  );
}