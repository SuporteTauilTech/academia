"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  Users,
  Loader2,
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
  LineChart,
  LogOut,
  DollarSign,
  Search,
  Copy,
  MessageCircle,
  Bell,
  Send,
  Calendar,
  UserCheck,
  UserX,
} from "lucide-react";
import CreateWorkoutModal from "@/components/CreateWorkoutModal";
import EditWorkoutModal from "@/components/EditWorkoutModal";
import AddMetricsModal from "@/components/AddMetricsModal";
import WorkoutFeedbackModal from "@/components/WorkoutFeedbackModal";
import StudentAttendanceModal from "@/components/StudentAttendanceModal";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "personal" | "aluno" | "student";
  status?: "ativo" | "inativo";
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

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

interface WorkoutLog {
  id: string;
  workout_id: string;
  workout_title: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("ativo");
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [selectedStudentWorkouts, setSelectedStudentWorkouts] = useState<Workout[]>([]);
  const [selectedStudentLogs, setSelectedStudentLogs] = useState<WorkoutLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Treinos e Feedback
  const [studentWorkouts, setStudentWorkouts] = useState<Workout[]>([]);
  const [savingExerciseId, setSavingExerciseId] = useState<string | null>(null);
  const [completedToday, setCompletedToday] = useState<string[]>([]);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [activeFeedbackWorkout, setActiveFeedbackWorkout] = useState<{ id: string; title: string } | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Notificações
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeMsg, setNewNoticeMsg] = useState("");
  const [sendingNotice, setSendingNotice] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchAnnouncements = useCallback(async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      setAnnouncements(data);
    }
  }, [supabase]);

  const fetchTodayLogs = useCallback(async (studentId: string) => {
    const todayKey = new Date().toISOString().split("T")[0];
    const storageKey = `xiton_completed_${studentId}_${todayKey}`;

    const cached = localStorage.getItem(storageKey);
    let cachedIds: string[] = cached ? JSON.parse(cached) : [];

    const { data: logs } = await supabase
      .from("workout_logs")
      .select("workout_id, created_at")
      .eq("student_id", studentId);

    if (logs && logs.length > 0) {
      const dbWorkoutIds = logs.map((log) => log.workout_id);
      const unified = Array.from(new Set([...cachedIds, ...dbWorkoutIds]));
      setCompletedToday(unified);
      localStorage.setItem(storageKey, JSON.stringify(unified));
    } else {
      setCompletedToday(cachedIds);
    }
  }, [supabase]);

  useEffect(() => {
    async function loadDashboardData() {
      await fetchAnnouncements();

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

      const isPersonal = userData?.role === "personal" || user.email?.toLowerCase() === "xiton@personal.com";
      const determinedRole = isPersonal ? "personal" : (userData?.role || "aluno");

      const currentUserProfile: UserProfile = {
        id: user.id,
        name: userData?.full_name || (isPersonal ? "Tauil Fit" : user.email?.split("@")[0] || "Aluno"),
        email: user.email || "",
        role: determinedRole as "personal" | "aluno" | "student",
        status: userData?.status || "ativo",
      };

      setProfile(currentUserProfile);

      if (currentUserProfile.role === "personal") {
        let { data: usersData } = await supabase.from("users").select("*");

        if (!usersData || usersData.length === 0) {
          const { data: profilesData } = await supabase.from("profiles").select("*");
          usersData = profilesData;
        }

        const filteredUsers = (usersData || []).filter(
          (u) => u.email?.toLowerCase() !== "xiton@personal.com"
        );

        if (filteredUsers.length > 0) {
          const mappedStudents: UserProfile[] = filteredUsers.map((u) => {
            const rawName = u.name || u.full_name;
            const fallbackName = u.email ? u.email.split("@")[0] : "Aluno";
            const displayName = rawName && rawName !== "Usuário" ? rawName : fallbackName;

            return {
              id: u.id,
              name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
              email: u.email || "",
              role: u.role || "aluno",
              status: u.status === "inativo" ? "inativo" : "ativo",
            };
          });

          setStudents(mappedStudents);
          const firstActive = mappedStudents.find((s) => s.status === "ativo") || mappedStudents[0];
          setSelectedStudent(firstActive);
          fetchSelectedStudentData(firstActive.id);
        }
      } else {
        await fetchStudentWorkouts(user.id);
        await fetchTodayLogs(user.id);
      }

      setLoading(false);
    }

    loadDashboardData();
  }, [router, fetchTodayLogs, fetchAnnouncements, supabase]);

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

    const { data: logsData } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (logsData) {
      setSelectedStudentLogs(logsData as WorkoutLog[]);
    }

    setLoadingWorkouts(false);
  }

  function handleSelectStudentById(studentId: string) {
    const student = students.find((s) => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
      fetchSelectedStudentData(student.id);
    }
  }

  async function handleToggleStudentStatus(student: UserProfile) {
    const currentStatus = student.status || "ativo";
    const newStatus: "ativo" | "inativo" = currentStatus === "ativo" ? "inativo" : "ativo";
    const confirmMsg = `Deseja alterar o status de ${student.name} para ${newStatus.toUpperCase()}?`;
    if (!confirm(confirmMsg)) return;

    await supabase.from("profiles").update({ status: newStatus }).eq("id", student.id);
    await supabase.from("users").update({ status: newStatus }).eq("id", student.id);

    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, status: newStatus } : s))
    );

    if (selectedStudent?.id === student.id) {
      setSelectedStudent({ ...selectedStudent, status: newStatus });
    }

    alert(`Status do aluno atualizado para ${newStatus}!`);
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

  function handleCopyInviteLink() {
    const link = `${window.location.origin}/cadastro`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  function handleSendWhatsAppInvite() {
    const link = `${window.location.origin}/cadastro`;
    const text = encodeURIComponent(
      `Olá! Aqui está o seu link para se cadastrar no app Tauil Fit e acessar seus treinos: ${link}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  async function handleSendNotice() {
    if (!newNoticeTitle.trim() || !newNoticeMsg.trim()) return;
    setSendingNotice(true);

    const { error } = await supabase.from("announcements").insert([
      { title: newNoticeTitle.trim(), message: newNoticeMsg.trim() },
    ]);

    if (!error) {
      setNewNoticeTitle("");
      setNewNoticeMsg("");
      await fetchAnnouncements();
      alert("Aviso publicado com sucesso!");
    } else {
      alert(`Erro no Supabase: ${error.message}`);
    }

    setSendingNotice(false);
  }

  async function handleDeleteNotice(id: string) {
    if (!confirm("Tem certeza que deseja apagar este aviso?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (!error) {
      await fetchAnnouncements();
      alert("Aviso removido com sucesso!");
    } else {
      alert("Erro ao remover aviso.");
    }
  }

  async function handleSaveWorkoutFeedback(intensity: string) {
    if (!activeFeedbackWorkout || !profile) return;
    setSubmittingFeedback(true);

    const workoutId = activeFeedbackWorkout.id;
    const workoutTitle = activeFeedbackWorkout.title;

    const updated = Array.from(new Set([...completedToday, workoutId]));
    setCompletedToday(updated);

    const todayKey = new Date().toISOString().split("T")[0];
    const storageKey = `xiton_completed_${profile.id}_${todayKey}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));

    try {
      await supabase.from("workout_logs").insert([
        {
          student_id: profile.id,
          workout_id: workoutId,
          workout_title: `${workoutTitle} (${intensity})`,
        },
      ]);
    } catch (err) {
      console.error("Erro ao sincronizar log:", err);
    }

    setSubmittingFeedback(false);
    setActiveFeedbackWorkout(null);
    alert("Parabéns! Treino concluído e feedback registrado.");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleDeleteWorkout(workoutId: string) {
    const confirmDelete = confirm("Tem certeza que deseja excluir esta ficha de treino?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("workouts").delete().eq("id", workoutId);

    if (!error && selectedStudent) {
      alert("Ficha excluída com sucesso!");
      fetchSelectedStudentData(selectedStudent.id);
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

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const studentStatus = s.status || "ativo";
    const matchesStatus = statusFilter === "todos" || studentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-20">
      <header className="space-y-4 pb-4 border-b border-zinc-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold">{profile?.name || "Tauil Fit"}</h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                {profile?.role === "personal" ? "Personal Trainer" : "Aluno"}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
            title="Sair"
          >
            <span>Sair</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
          {profile?.role === "personal" ? (
            <>
              <button
                onClick={() => router.push("/")}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 transition-all hover:bg-emerald-500 cursor-pointer"
              >
                <Dumbbell className="w-3.5 h-3.5" /> Treinos
              </button>
              <button
                onClick={() => router.push("/fichas-de-treino")}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 transition-all hover:bg-emerald-500 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> Fichas
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/")}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 transition-all hover:bg-emerald-500 cursor-pointer"
              >
                <Dumbbell className="w-3.5 h-3.5" /> Meu Treino
              </button>
              <button
                onClick={() => setIsAttendanceModalOpen(true)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 transition-all hover:bg-emerald-500 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" /> Frequência
              </button>
            </>
          )}

          <button
            onClick={() => router.push("/progresso")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 transition-all hover:bg-emerald-500 cursor-pointer"
          >
            <LineChart className="w-3.5 h-3.5" /> Progresso
          </button>

          <button
            onClick={() => router.push("/financeiro")}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 transition-all hover:bg-emerald-500 cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" /> Financeiro
          </button>
        </div>
      </header>

      {/* QUADRO DE AVISOS */}
      {announcements.length > 0 && (
        <section className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-3 shadow-lg shadow-emerald-950/20">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400 animate-pulse" /> Quadro de Avisos do Personal
          </h3>
          <div className="space-y-2">
            {announcements.map((item) => (
              <div key={item.id} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    {item.title}
                  </p>
                  <p className="text-xs text-zinc-300 mt-1 pl-3.5 leading-relaxed">{item.message}</p>
                </div>

                {profile?.role === "personal" && (
                  <button
                    onClick={() => handleDeleteNotice(item.id)}
                    className="p-1 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                    title="Apagar Aviso"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {profile?.role === "personal" && (
        <section className="space-y-4">
          {/* Criar Notificação / Aviso */}
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4" /> Disparar Notificação / Lembrete
            </h2>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Título (Ex: Lembrete de Hidratação)"
                value={newNoticeTitle}
                onChange={(e) => setNewNoticeTitle(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <textarea
                placeholder="Mensagem (Ex: Lembre-se de beber ao menos 2L de água hoje!)"
                value={newNoticeMsg}
                onChange={(e) => setNewNoticeMsg(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 h-16 resize-none"
              />
              <button
                onClick={handleSendNotice}
                disabled={sendingNotice}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sendingNotice ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Enviar para os Alunos</>}
              </button>
            </div>
          </div>

          {/* Selecionar Aluno e Filtros de Status */}
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> SELECIONAR ALUNO ({filteredStudents.length}/{students.length})
              </h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyInviteLink}
                  className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                >
                  {copiedLink ? <><Check className="w-3.5 h-3.5" /> Copiado!</> : <><Copy className="w-3.5 h-3.5" /> Link</>}
                </button>

                <button
                  onClick={handleSendWhatsAppInvite}
                  className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </button>
              </div>
            </div>

            {/* Filtros de Ativos/Inativos e Busca */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar aluno por nome ou e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[11px] font-bold">
                <button
                  onClick={() => setStatusFilter("ativo")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === "ativo" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"}`}
                >
                  Ativos
                </button>
                <button
                  onClick={() => setStatusFilter("inativo")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === "inativo" ? "bg-zinc-800 text-red-400" : "text-zinc-400 hover:text-white"}`}
                >
                  Inativos
                </button>
                <button
                  onClick={() => setStatusFilter("todos")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === "todos" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}
                >
                  Todos
                </button>
              </div>
            </div>

            <select
              value={selectedStudent?.id || ""}
              onChange={(e) => handleSelectStudentById(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white font-bold focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              {filteredStudents.length === 0 ? (
                <option value="" disabled>Nenhum aluno encontrado</option>
              ) : (
                filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email}) - [{(s.status || "ativo").toUpperCase()}]
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedStudent && (
            <div className="space-y-6 pt-2 border-t border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    Gerenciando: {selectedStudent.name}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${(selectedStudent.status || "ativo") === "ativo" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                      {selectedStudent.status || "ativo"}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">Monte treinos e acompanhe métricas corporais</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStudentStatus(selectedStudent)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${(selectedStudent.status || "ativo") === "ativo" ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"}`}
                    title="Alterar Status"
                  >
                    {(selectedStudent.status || "ativo") === "ativo" ? <><UserX className="w-4 h-4" /> Inativar</> : <><UserCheck className="w-4 h-4" /> Ativar</>}
                  </button>
                  <button
                    onClick={() => setIsMetricsModalOpen(true)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-emerald-950/50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Avaliação
                  </button>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-emerald-950/50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Nova Ficha
                  </button>
                </div>
              </div>

              {/* Seção de Frequência e Esforço Recente do Aluno */}
              {selectedStudentLogs.length > 0 && (
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Histórico de Frequência & Percepção de Esforço
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedStudentLogs.map((log) => (
                      <div key={log.id} className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">{log.workout_title}</p>
                          <p className="text-[10px] text-zinc-500">
                            {new Date(log.created_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          Concluído
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loadingWorkouts ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" /> Fichas de Treino ({selectedStudentWorkouts.length})
                  </h4>

                  {selectedStudentWorkouts.length === 0 ? (
                    <div className="p-6 text-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-1">
                      <p className="text-xs text-zinc-400 font-medium">Este aluno ainda não possui fichas cadastradas.</p>
                    </div>
                  ) : (
                    selectedStudentWorkouts.map((workout) => (
                      <div key={workout.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                          <h5 className="font-bold text-white text-sm">{workout.title}</h5>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingWorkout(workout)}
                              className="p-1.5 text-zinc-400 hover:text-emerald-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteWorkout(workout.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {workout.exercises && workout.exercises.length > 0 ? (
                            workout.exercises.map((ex) => (
                              <div key={ex.id} className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/60 flex items-center justify-between text-xs">
                                <span className="font-semibold text-zinc-200">{ex.name}</span>
                                <span className="text-zinc-400">
                                  {ex.sets}x {ex.reps} - <strong className="text-emerald-400">{ex.weight} kg</strong>
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-zinc-500">Nenhum exercício cadastrado nesta ficha.</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {(profile?.role === "aluno" || profile?.role === "student") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Fichas de Treino Cadastradas ({studentWorkouts.length})
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
              const isExpanded = expandedWorkoutId === workout.id;

              return (
                <div key={workout.id} className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden transition-all">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFeedbackWorkout({ id: workout.id, title: workout.title });
                        }}
                        disabled={isCompleted}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isCompleted
                            ? "bg-zinc-800 text-emerald-400 border border-emerald-500/30 cursor-not-allowed opacity-90"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 active:scale-95 cursor-pointer"
                        }`}
                      >
                        {isCompleted ? (
                          <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span>Concluído</span></>
                        ) : (
                          <><Check className="w-3.5 h-3.5" /><span>Concluir</span></>
                        )}
                      </button>

                      {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-zinc-800/80 space-y-3 bg-zinc-950/50">
                      <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider pt-3">
                        Exercícios da Ficha:
                      </h4>

                      {workout.exercises && workout.exercises.length > 0 ? (
                        workout.exercises.map((exercise, eIdx) => (
                          <div key={exercise.id} className="p-3 bg-zinc-900 border border-zinc-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h5 className="text-sm font-semibold text-white">{exercise.name}</h5>
                              <p className="text-xs text-zinc-400">{exercise.sets} Séries × {exercise.reps} Repetições</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                                <span className="text-xs text-zinc-500">Carga:</span>
                                <input
                                  type="number"
                                  value={exercise.weight}
                                  onChange={(e) => handleWeightChange(wIdx, eIdx, Number(e.target.value))}
                                  className="w-14 bg-transparent text-sm font-bold text-emerald-400 text-center focus:outline-none"
                                  min="0"
                                />
                                <span className="text-xs text-zinc-400">kg</span>
                              </div>

                              <button
                                onClick={() => handleSaveWeight(exercise)}
                                disabled={savingExerciseId === exercise.id}
                                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                              >
                                {savingExerciseId === exercise.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-500 py-2">Nenhum exercício cadastrado nesta ficha ainda.</p>
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
      {activeFeedbackWorkout && (
        <WorkoutFeedbackModal
          workoutTitle={activeFeedbackWorkout.title}
          onConfirm={handleSaveWorkoutFeedback}
          onClose={() => setActiveFeedbackWorkout(null)}
          loading={submittingFeedback}
        />
      )}

      {isAttendanceModalOpen && profile && (
        <StudentAttendanceModal
          studentId={profile.id}
          onClose={() => setIsAttendanceModalOpen(false)}
        />
      )}

      {isModalOpen && selectedStudent && (
        <CreateWorkoutModal
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => fetchSelectedStudentData(selectedStudent.id)}
        />
      )}

      {isMetricsModalOpen && selectedStudent && (
        <AddMetricsModal
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          onClose={() => setIsMetricsModalOpen(false)}
          onSuccess={() => fetchSelectedStudentData(selectedStudent.id)}
        />
      )}

      {editingWorkout && selectedStudent && (
        <EditWorkoutModal
          workout={editingWorkout}
          onClose={() => setEditingWorkout(null)}
          onSuccess={() => fetchSelectedStudentData(selectedStudent.id)}
        />
      )}
    </main>
  );
}