import { createClient } from '@/utils/supabase/server'
import { CalendarDays } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarView } from '@/components/CalendarView'

export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const supabase = await createClient()

  // 1. Quem está acessando?
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // 2. Qual o cargo dessa pessoa?
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'customer'

  // 3. Monta a Query Inteligente
  let query = supabase
    .from('appointments')
    .select(`
      id,
      date,
      status,
      services ( name, price, duration_minutes ),
      barber:profiles!barber_id ( full_name ),
      client:profiles!user_id ( full_name )
    `)
    .order('date', { ascending: true })

  // 4. Aplica o Filtro baseado no Cargo
  if (userRole === 'customer') {
    // Cliente só vê seus próprios cortes
    query = query.eq('user_id', user.id)
  } else if (userRole === 'barber') {
    // Barbeiro vê os cortes que ELE vai fazer
    query = query.eq('barber_id', user.id)
  }
  // Admin não tem filtro, vê TUDO.

  const { data: appointmentsRaw } = await query

  // 5. TRUQUE DE MESTRE: Formata os dados para o Calendário
  // O Calendário espera um objeto "profiles" com o nome da pessoa.
  // Vamos enganar ele: se sou barbeiro, coloco o nome do cliente ali.
  const appointments = appointmentsRaw?.map((app: any) => {
    let displayName = 'Desconhecido'
    
    if (userRole === 'barber') {
        displayName = app.client?.full_name || 'Cliente Sem Nome'
    } else if (userRole === 'admin') {
        // Admin vê "Barbeiro - Cliente"
        const barberName = app.barber?.full_name?.split(' ')[0] || '?'
        const clientName = app.client?.full_name?.split(' ')[0] || '?'
        displayName = `${barberName} ✂️ ${clientName}`
    } else {
        // Cliente vê o nome do Barbeiro
        displayName = app.barber?.full_name || 'Barbeiro'
    }

    return {
        ...app,
        profiles: { full_name: displayName } // O componente vai mostrar isso
    }
  })

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-amber-500" />
            Agenda {userRole === 'admin' ? 'Geral' : (userRole === 'barber' ? 'de Atendimentos' : 'Pessoal')}
          </h1>
          <p className="text-zinc-400 mt-2">
            {userRole === 'barber' 
                ? 'Veja seus próximos clientes e horários.' 
                : 'Visualize todos os seus compromissos do mês.'}
          </p>
        </div>
        
        {/* Admin e Cliente podem agendar. Barbeiro geralmente só olha, mas pode agendar também se quiser. */}
        <Link 
            href="/agendamentos/novo"
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
        >
            Novo Agendamento
        </Link>
      </div>

      {/* CALENDÁRIO INTELIGENTE */}
      <CalendarView appointments={appointments || []} />
      
    </div>
  )
}