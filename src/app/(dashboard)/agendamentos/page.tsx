import { createClient } from '@/utils/supabase/server'
import { CalendarDays } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarView } from '@/components/CalendarView' // <--- IMPORTAR O COMPONENTE NOVO

export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Busca Agendamentos (Igual antes)
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      date,
      status,
      services ( name, price, duration_minutes ),
      profiles!barber_id ( full_name ) 
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-amber-500" />
            Agenda Mensal
          </h1>
          <p className="text-zinc-400 mt-2">
            Visualize todos os seus compromissos do mês.
          </p>
        </div>
        
        <Link 
            href="/agendamentos/novo"
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
        >
            Novo Agendamento
        </Link>
      </div>

      {/* AQUI ENTRA O CALENDÁRIO */}
      {/* Passamos o array vazio [] se appointments for nulo para não quebrar */}
      <CalendarView appointments={appointments || []} />
      
    </div>
  )
}