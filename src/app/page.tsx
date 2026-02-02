import { Scissors, Calendar, User } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-amber-500 p-4 rounded-full shadow-lg shadow-amber-500/20">
            <Scissors size={48} className="text-zinc-950" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold tracking-tight">
          Estilo e Precisão para o <span className="text-amber-500">Homem Moderno</span>.
        </h1>
        
        <p className="text-zinc-400 text-lg">
          Agende seu horário com os melhores profissionais da região em poucos cliques.
        </p>

        <div className="flex gap-4 justify-center pt-4">
          <button className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 px-8 rounded-lg transition-all flex items-center gap-2">
            <Calendar size={20} />
            Agendar Agora
          </button>
          <button className="border border-zinc-800 hover:bg-zinc-900 py-3 px-8 rounded-lg transition-all flex items-center gap-2">
            <User size={20} />
            Área do Cliente
          </button>
        </div>
      </div>
    </main>
  );
}