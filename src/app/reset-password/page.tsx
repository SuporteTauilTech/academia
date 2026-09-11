"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Escuta o evento de autenticação vindo do token do link de e-mail
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY" || session) {
          setHasSession(true);
        }
        setVerifying(false);
      }
    );

    // Checa se já existe uma sessão ativa
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
      }
      setVerifying(false);
    }

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } else {
      alert("Erro ao atualizar senha: " + error.message);
    }
    setLoading(false);
  }

  if (verifying) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 bg-zinc-950 text-white">
        <p className="text-sm text-zinc-500 animate-pulse">Validando token de acesso...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-950 text-white">
      <div className="w-full max-w-sm p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <Lock className="w-6 h-6 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold">Criar Nova Senha</h1>
          <p className="text-xs text-zinc-400">Digite a sua nova senha abaixo para atualizar sua conta.</p>
        </div>

        {success ? (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs text-emerald-400 font-medium">Senha alterada com sucesso!</p>
            <p className="text-[11px] text-zinc-500">Redirecionando para o login...</p>
          </div>
        ) : !hasSession ? (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
            <p className="text-xs text-red-400">Link expirado ou inválido.</p>
            <p className="text-[11px] text-zinc-500">
              Solicite um novo link de redefinição de senha na página de login.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline pt-2 block mx-auto"
            >
              Ir para o Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <input
              type="password"
              placeholder="Digite a nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Atualizando..." : "Salvar Nova Senha"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}