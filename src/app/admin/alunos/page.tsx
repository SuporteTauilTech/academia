'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function GestaoAlunos() {
  const [pendentes, setPendentes] = useState<any[]>([])
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function carregarPendentes() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, status')
      .eq('status', 'pendente')

    setPendentes(data || [])
  }

  async function aprovarAluno(id: string) {
    await supabase
      .from('profiles')
      .update({ status: 'ativo' })
      .eq('id', id)

    carregarPendentes()
  }

  useEffect(() => {
    carregarPendentes()
  }, [])

  return (
    <div className="p-8 text-white min-h-screen bg-slate-900">
      <h1 className="text-2xl font-bold mb-6">Alunos Aguardando Aprovação</h1>
      {pendentes.length === 0 ? (
        <p className="text-slate-400">Nenhuma solicitação pendente no momento.</p>
      ) : (
        <ul className="space-y-4 max-w-xl">
          {pendentes.map((aluno) => (
            <li key={aluno.id} className="flex justify-between items-center bg-slate-800 p-4 rounded-md border border-slate-700">
              <span>{aluno.full_name || 'Aluno sem nome'}</span>
              <button
                onClick={() => aprovarAluno(aluno.id)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md font-semibold transition-colors"
              >
                Aprovar Acesso
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}