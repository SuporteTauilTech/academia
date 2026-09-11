"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Dumbbell, ClipboardList, LogOut, LogIn, User, TrendingUp } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
      }
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUserEmail(null);
    router.push("/login");
  }

  return (
    <header className="w-full bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Dumbbell className="w-7 h-7 text-emerald-500" />
        <span className="font-bold text-xl text-white tracking-tight">Xiton Personal</span>
      </Link>

      {/* Menu Links */}
      <nav className="flex items-center gap-1 sm:gap-4">
        <Link
          href="/"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            pathname === "/" 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Exercícios</span>
        </Link>

        <Link
          href="/treinos"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            pathname === "/treinos" 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Fichas de Treino</span>
        </Link>

        <Link
          href="/aluno"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            pathname === "/aluno" 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Meu Treino</span>
        </Link>

        <Link
          href="/progresso"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            pathname === "/progresso" 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Progresso</span>
        </Link>
      </nav>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        {userEmail ? (
          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400">
              <User className="w-3.5 h-3.5 text-emerald-500" />
              {userEmail}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-red-950 hover:text-red-400 text-zinc-300 transition-colors border border-zinc-700 hover:border-red-800"
              title="Sair da conta"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar</span>
          </Link>
        )}
      </div>
    </header>
  );
}