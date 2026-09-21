"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Save,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

interface StudentSub {
  id: string;
  name: string;
  email: string;
  sub_id?: string;
  amount: number;
  due_day: number;
  status: "pago" | "pendente" | "atrasado";
  pix_key?: string;
}

export default function FinancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isPersonal, setIsPersonal] = useState(false);
  const [studentsSubs, setStudentsSubs] = useState<StudentSub[]>([]);
  const [mySub, setMySub] = useState<StudentSub | null>(null);
  const [editingSub, setEditingSub] = useState<StudentSub | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const personalCheck = user.email === "xiton@personal.com";
      setIsPersonal(personalCheck);

      if (personalCheck) {
        // Carregar todos os alunos e suas assinaturas
        const { data: usersData } = await supabase
          .from("users")
          .select("id, name, email")
          .neq("email", "xiton@personal.com");

        const { data: subsData } = await supabase
          .from("subscriptions")
          .select("*");

        if (usersData) {
          const combined: StudentSub[] = usersData.map((u) => {
            const sub = subsData?.find((s) => s.student_id === u.id);
            return {
              id: u.id,
              name: u.name || u.email?.split("@")[0] || "Aluno",
              email: u.email || "",
              sub_id: sub?.id,
              amount: sub?.amount || 0,
              due_day: sub?.due_day || 10,
              status: sub?.status || "pendente",
              pix_key: sub?.pix_key || "",
            };
          });

          setStudentsSubs(combined);
        }
      } else {
        // Carregar assinatura do aluno conectado
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("student_id", user.id)
          .single();

        setMySub({
          id: user.id,
          name: user.user_metadata?.full_name || "Aluno",
          email: user.email || "",
          amount: subData?.amount || 0,
          due_day: subData?.due_day || 10,
          status: subData?.status || "pendente",
          pix_key: subData?.pix_key || "Consulte seu personal",
        });
      }

      setLoading(false);
    }

    loadData();
  }, [router, supabase]);

  async function handleSaveSub() {
    if (!editingSub) return;
    setSaving(true);

    const payload = {
      student_id: editingSub.id,
      amount: editingSub.amount,
      due_day: editingSub.due_day,
      status: editingSub.status,
      pix_key: editingSub.pix_key,
      updated_at: new Date().toISOString(),
    };

    if (editingSub.sub_id) {
      await supabase
        .from("subscriptions")
        .update(payload)
        .eq("id", editingSub.sub_id);
    } else {
      await supabase.from("subscriptions").insert([payload]);
    }

    setEditingSub(null);
    setSaving(false);

    // Recarregar lista
    window.location.reload();
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 max-w-4xl mx-auto space-y-6 pb-20">
      <header className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              {isPersonal ? "Gestão Financeira" : "Minha Assinatura"}
            </h1>
            <p className="text-xs text-zinc-400">
              {isPersonal
                ? "Controle de mensalidades dos alunos"
                : "Informações de pagamento do seu plano"}
            </p>
          </div>
        </div>
      </header>

      {/* Visão do Personal */}
      {isPersonal && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {studentsSubs.map((student) => {
              const statusColors = {
                pago: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                pendente: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                atrasado: "bg-red-500/10 text-red-400 border-red-500/20",
              };

              return (
                <div
                  key={student.id}
                  className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {student.name}
                      </h3>
                      <p className="text-[10px] text-zinc-400">
                        {student.email}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border font-bold capitalize flex items-center gap-1 ${
                        statusColors[student.status]
                      }`}
                    >
                      {student.status === "pago" && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {student.status === "pendente" && <Clock className="w-3.5 h-3.5" />}
                      {student.status === "atrasado" && <AlertCircle className="w-3.5 h-3.5" />}
                      {student.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Valor:</span>
                      <span className="font-bold text-white">
                        R$ {student.amount.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Vencimento:</span>
                      <span className="font-bold text-white">
                        Todo dia {student.due_day}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingSub(student)}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-400" /> Editar Cobrança
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Visão do Aluno */}
      {!isPersonal && mySub && (
        <section className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <span className="text-xs text-zinc-400">Status Atual</span>
              <h2 className="text-lg font-bold text-white capitalize flex items-center gap-2 mt-1">
                {mySub.status === "pago" && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-5 h-5" /> Em Dia
                  </span>
                )}
                {mySub.status === "pendente" && (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Clock className="w-5 h-5" /> Aguardando Pagamento
                  </span>
                )}
                {mySub.status === "atrasado" && (
                  <span className="text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-5 h-5" /> Mensalidade Atrasada
                  </span>
                )}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-zinc-400">Valor Mensal</span>
              <p className="text-xl font-bold text-white mt-1">
                R$ {mySub.amount.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
            <span className="text-xs text-zinc-400 font-medium block">
              Pagamento via Pix para o Personal:
            </span>
            <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
              <code className="text-xs text-emerald-400 font-mono truncate mr-2">
                {mySub.pix_key || "Não informada"}
              </code>
              {mySub.pix_key && (
                <button
                  onClick={() => copyToClipboard(mySub.pix_key!)}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                >
                  {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedPix ? "Copiado!" : "Copiar"}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Modal de Edição para o Personal */}
      {editingSub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-zinc-800">
              Editar Cobrança - {editingSub.name}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400">Status do Pagamento</label>
                <select
                  value={editingSub.status}
                  onChange={(e) =>
                    setEditingSub({
                      ...editingSub,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 mt-1"
                >
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                  <option value="atrasado">Atrasado</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400">Valor da Consultoria (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingSub.amount}
                  onChange={(e) =>
                    setEditingSub({
                      ...editingSub,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400">Dia de Vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={editingSub.due_day}
                  onChange={(e) =>
                    setEditingSub({
                      ...editingSub,
                      due_day: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400">Sua Chave Pix (para o aluno pagar)</label>
                <input
                  type="text"
                  placeholder="Ex: CPF, E-mail ou Telefone"
                  value={editingSub.pix_key}
                  onChange={(e) =>
                    setEditingSub({
                      ...editingSub,
                      pix_key: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingSub(null)}
                className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSub}
                disabled={saving}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl flex items-center gap-1.5"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}