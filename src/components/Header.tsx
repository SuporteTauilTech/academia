"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, usePathname } from "next/navigation";
import { Dumbbell, FileText, LineChart, LogOut } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isPersonal, setIsPersonal] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email || "");

        // Identifica no Supabase se o usuário é Personal Trainer
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile) {
          setIsPersonal(profile.role === "personal");
        }
      }
    }

    getUser();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Esconde o Header apenas no Login e no Reset de Senha
  if (pathname === "/login" || pathname === "/reset-password") {
    return null;
  }

  return (
    <header className="w-full bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Links de Navegação */}
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {isPersonal ? (
            <>
              <button
                onClick={() => router.push("/")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  pathname === "/"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Dumbbell className="w-4 h-4" /> Exercícios
              </button>
              <button
                onClick={() => router.push("/fichas-de-treino")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  pathname === "/fichas-de-treino"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <FileText className="w-4 h-4" /> Fichas
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                pathname === "/"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Dumbbell className="w-4 h-4" /> Meu Treino
            </button>
          )}

          <button
            onClick={() => router.push("/progresso")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              pathname === "/progresso"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <LineChart className="w-4 h-4" /> Progresso
          </button>
        </nav>

        {/* Botão de Logout com o texto "Sair" e ícone juntos */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
          >
            <span>Sair</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}