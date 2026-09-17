"use client";

import { useEffect, useState, useCallback } from "react";
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
  Activity,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import CreateWorkoutModal from "@/components/CreateWorkoutModal";
import EditWorkoutModal from "@/components/EditWorkoutModal";
import AddMetricsModal from "@/components/AddMetricsModal";

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

interface BodyMetric {
  id: string;
  weight: number | null;
  height: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [selectedStudentWorkouts, setSelectedStudentWorkouts] = useState<Workout[]>([]);
  const [selectedStudentMetrics, setSelectedStudentMetrics] = useState<BodyMetric[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  const [studentWorkouts, setStudentWorkouts] = useState<Workout[]>([]);
  const [savingExerciseId, setSavingExerciseId] = useState<string | null>(null);
  const [completingWorkoutId, setCompletingWorkoutId] = useState<string | null>(null);
  const [completedToday, setCompletedToday] = useState<string[]>([]);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchTodayLogs = useCallback(async (studentId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: logs } = await supabase
      .from("workout_logs")
      .select("workout_id")
      .eq("student_id", studentId)
      .gte("created_at", today.toISOString());

    if (logs) {
      setCompletedToday(logs.map((log) => log.workout_id));
    }
  }, [supabase]);

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: userData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (userData?.status === "pendente") {
        router.push("/aguardando-aprovacao");
        return;
      }

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

      if (currentUserProfile.role === "personal") {
        const { data: usersData } = await supabase
          .from("users")
          .select("*")
          .neq("email", "xiton@personal.com");

        if (usersData && usersData.length > 0) {
          const mappedStudents: UserProfile[] = usersData.map((u) => ({
            id: u.id,
            name: u.name || u.full_name || "Jogador",
            email: u.email || "jogadorteste2020@gmail.com",
            role: u.role || "aluno",
            status: u.status || "ativo",
          }));
          setStudents(mappedStudents);
        }
      } else {
        await fetchStudentWorkouts(user.id);
        await fetchTodayLogs(user.id);
      }

      setLoading(false);
    }

    loadDashboardData();
  }, [router, fetchTodayLogs, supabase]);

  async function fetchSelectedStudentData(studentId: string) {
    setLoadingWorkouts(true);

    const { data: workoutsData } = await supabase
      .from("workouts")
      .select("*, exercises(*)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (workoutsData) {
      setSelectedStudentWorkouts(workoutsData as Workout[]);
    }

    const { data: metricsData } = await supabase
      .from("body_metrics")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (metricsData) {
      setSelectedStudentMetrics(metricsData as BodyMetric[]);
    }

    setLoadingWorkouts(false);
  }

  function handleSelectStudent(student: UserProfile) {
    setSelectedStudent(student);
    fetchSelectedStudentData(student.id);
  }

  async function fetchStudentWorkouts(studentId: string) {
    const { data: workoutsData, error } = await supabase
      .from("workouts")
      .select("*, exercises(*)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (!error && workoutsData) {
      setStudentWorkouts(workoutsData as Workout[]);
      if (workoutsData.length > 0) {
        setExpandedWorkoutId(workoutsData[0].id);
      }
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
      alert("Erro ao excluir a ficha de treino.");
    } else {
      alert("Ficha excluída com sucesso!");
      if (selectedStudent) {
        fetchSelectedStudentData(selectedStudent.id);
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
      alert("Erro ao salvar carga.");
    } else {
      alert("Carga atualizada com sucesso!");
    }

    setSavingExerciseId(null);
  }

  async function handleCompleteWorkout(
    workoutTitle: string,
    workoutId: string,
    e?: React.MouseEvent
  ) {
    if (e) e.stopPropagation();
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
      alert("Erro ao registrar conclusão do treino.");
    } else {
      setCompletedToday((prev) => [...prev, workoutId]);
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
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-20">
      {/* NAVEGAÇÃO SUPERIOR FIXA */}
      <header className="space-y-4 pb-4 border-b border-zinc-800">
        <div className="flex justify-between items-center">
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
        </div>

        {/* ABAS DE NAVEGAÇÃO PRINCIPAL */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => router.push("/")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
          >
            <Dumbbell className="w-4 h-4" /> Minhas Fichas
          </button>
          <button
            onClick={() => router.push("/progresso")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors"
          >
            <LineChart className="w-4 h-4" /> Progresso & Avaliações
          </button>
        </div>
      </header>

      {/* VISÃO DO ALUNO */}
      {(profile?.role === "aluno" || profile?.role === "student") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" /> Fichas de Treino Cadastradas ({studentWorkouts.length})
            </h2>
          </div>

          {studentWorkouts.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-2">
              <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400 font-medium">
                Sua ficha de treino ainda não foi cadastrada pelo seu Personal.
              </p>
            </div>
          ) : (
            studentWorkouts.map((workout, wIdx) => {
              const isCompleted = completedToday.includes(workout.id);
              const isCompleting = completingWorkoutId === workout.id;
              const isExpanded = expandedWorkoutId === workout.id;

              return (
                <div
                  key={workout.id}
                  className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden transition-all"
                >
                  {/* Cabeçalho da Ficha de Treino */}
                  <div
                    onClick={() => setExpandedWorkoutId(isExpanded ? null : workout.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-800 rounded-xl">
                        <Dumbbell className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{workout.title}</h3>
                        <p className="text-xs text-zinc-400">
                          {workout.exercises ? workout.exercises.length : 0} Exercícios cadastrados
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleCompleteWorkout(workout.title, workout.id, e)}
                        disabled={isCompleting || isCompleted}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isCompleted
                            ? "bg-zinc-800 text-emerald-400 border border-emerald-500/30 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 active:scale-95"
                        }`}
                      >
                        {isCompleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Concluído</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Concluir</span>
                          </>
                        )}
                      </button>

                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-zinc-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                  </div>

                  {/* Lista detalhada dos exercícios da ficha */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-zinc-800/80 space-y-3 bg-zinc-950/50">
                      <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pt-3">
                        Exercícios da Ficha:
                      </h4>

                      {workout.exercises && workout.exercises.length > 0 ? (
                        workout.exercises.map((exercise, eIdx) => (
                          <div
                            key={exercise.id}
                            className="p-3 bg-zinc-900 border border-zinc-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <h5 className="text-sm font-semibold text-white">
                                {exercise.name}
                              </h5>
                              <p className="text-xs text-zinc-400">
                                {exercise.sets} Séries × {exercise.reps} Repetições
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
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
                                title="Salvar carga"
                              >
                                {savingExerciseId === exercise.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-500 py-2">
                          Nenhum exercício cadastrado nesta ficha ainda.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
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
            fetchSelectedStudentData(selectedStudent.id);
          }}
        />
      )}

      {isMetricsModalOpen && selectedStudent && (
        <AddMetricsModal
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          onClose={() => setIsMetricsModalOpen(false)}
          onSuccess={() => {
            fetchSelectedStudentData(selectedStudent.id);
          }}
        />
      )}

      {editingWorkout && selectedStudent && (
        <EditWorkoutModal
          workout={editingWorkout}
          onClose={() => setEditingWorkout(null)}
          onSuccess={() => {
            fetchSelectedStudentData(selectedStudent.id);
          }}
        />
      )}
    </main>
  );
}