"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Dumbbell, Mail, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"personal" | "student">("student");

  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (isForgot) {
      // Força a URL de redirecionamento para o app local
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (!error) {
        setResetSent(true);
      } else {
        alert("Erro ao enviar e-mail: " + error.message);
      }
      setLoading(false);
      return;
    }

    if (isRegister) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert("Erro no cadastro: " + error.message);
      } else if (data.user) {
        await supabase.from("users").insert([
          { id: data.user.id, email, name, role }
        ]);
        alert("Conta criada com sucesso! Faça login.");
        setIsRegister(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert("Erro ao entrar: " + error.message);
      } else {
        router.push("/");
      }
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-950 text-white">
      <div className="w-full max-w-sm p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5">
        
        {/* Cabeçalho */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <Dumbbell className="w-6 h-6 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold">Xiton Personal</h1>
          <p className="text-xs text-zinc-400">
            {isForgot
              ? "Recuperação de conta"
              : isRegister
              ? "Crie sua conta para começar"
              : "Acesse sua conta para continuar"}
          </p>
        </div>

        {/* Formulário de Recuperação de Senha */}
        {isForgot ? (
          resetSent ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-3">
              <Mail className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs text-emerald-400 font-medium">Link enviado para o seu e-mail!</p>
              <p className="text-[11px] text-zinc-500">
                Acesse sua caixa de entrada e clique no link para definir sua nova senha.
              </p>
              <button
                onClick={() => { setIsForgot(false); setResetSent(false); }}
                className="text-xs text-zinc-400 hover:text-white underline pt-2 block mx-auto"
              >
                Voltar para o Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              <input
                type="email"
                placeholder="Seu e-mail cadastrado"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar Link de Recuperação"}
              </button>

              <button
                type="button"
                onClick={() => setIsForgot(false)}
                className="w-full text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1 pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o Login
              </button>
            </form>
          )
        ) : (
          /* Formulário de Login / Cadastro */
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "personal" | "student")}
                  className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="student">Sou Aluno</option>
                  <option value="personal">Sou Personal Trainer</option>
                </select>
              </>
            )}

            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />

            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />

            {!isRegister && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setIsForgot(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Aguarde..." : isRegister ? "Criar Conta" : "Entrar"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                {isRegister ? "Já possui conta? Faça Login" : "Não tem conta? Cadastre-se"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}