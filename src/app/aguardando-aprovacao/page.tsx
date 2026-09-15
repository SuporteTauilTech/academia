export default function AguardandoAprovacao() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-md text-center bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold mb-4 text-emerald-400">Cadastro em Análise</h1>
        <p className="text-slate-300 mb-6">
          Sua conta foi criada com sucesso! O seu Personal Trainer precisa aprovar seu acesso para liberar as fichas de treino.
        </p>
        <p className="text-sm text-slate-400">
          Entre em contato com seu Personal para agilizar a liberação.
        </p>
      </div>
    </div>
  )
}