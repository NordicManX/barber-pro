import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  // 1. Busca configurações da loja para exibir a logo correta
  const { data: settings } = await supabase
    .from('barbershop_settings')
    .select('logo_url')
    .single()

  const isValidUrl = settings?.logo_url && settings.logo_url.startsWith('http');
  const logoUrl = isValidUrl 
    ? settings.logo_url 
    : "https://ui-avatars.com/api/?name=Hartmann+Barbearia&background=f59e0b&color=000&size=256";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl text-center space-y-8">
        <div className="flex justify-center">
          <div className="relative w-40 h-40 rounded-full border-4 border-amber-500 overflow-hidden shadow-2xl shadow-amber-500/20 bg-zinc-900 flex items-center justify-center">
            <Image 
              src={logoUrl}
              alt="Hartmann Barbearia Logo"
              fill
              style={{ objectFit: 'contain' }}
              className="p-1"
              priority 
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tighter uppercase">
            Estilo e Precisão para o <span className="text-amber-500 block mt-2">Homem Moderno.</span>
          </h1>
          
          <p className="text-zinc-400 text-lg max-w-lg mx-auto">
            Agende seu horário com os melhores profissionais da Barbearia Hartmann em poucos cliques.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/agendamentos/novo" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-4 px-8 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 uppercase tracking-wide">
            <Calendar size={20} strokeWidth={2.5} />
            Agendar Agora
          </Link>
          <Link href="/clientes" className="border-2 border-zinc-800 hover:bg-zinc-900/50 hover:border-zinc-700 text-zinc-300 font-bold py-4 px-8 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
            <User size={20} strokeWidth={2.5} />
            Área do Cliente
          </Link>
        </div>
      </div>
    </main>
  );
}