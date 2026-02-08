import { createClient } from '@/utils/supabase/server'
import { CalendarDays, Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarView } from '@/components/CalendarView'

// Garante que a página sempre busque dados novos (sem cache)
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Tipagem para os dados que vêm do banco
type AppointmentRaw = {
  id: string
  date: string
  status: string
  user_id: string
  barber_id: string
  services: {
    name: string
    price: number
    duration_minutes: number
  } | null
  barber: { full_name: string } | null
  client: { full_name: string } | null
}

// Função Auxiliar: Define o nome que aparecerá no card baseado no cargo
function getDisplayName(app: AppointmentRaw, role: string): string {
  const barberName = app.barber?.full_name?.split(' ')[0] || 'Desconhecido'
  const clientName = app.client?.full_name?.split(' ')[0] || 'Desconhecido'

  switch (role) {
    case 'admin':
      return `${barberName} ✂️ ${clientName}`
    case 'barber':
      return app.client?.full_name || 'Cliente'
    default: // customer
      return app.barber?.full_name || 'Barbeiro'
  }
}

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

  // 3. Monta a Query Base
  let query = supabase
    .from('appointments')
    .select(`
      id,
      date,
      status,
      user_id,
      barber_id,
      services ( name, price, duration_minutes ),
      barber:profiles!barber_id ( full_name ),
      client:profiles!user_id ( full_name )
    `)
    // 🔴 CRUCIAL: Filtra para NÃO trazer os cancelados do banco
    .neq('status', 'canceled') 
  
  // 4. Aplica o Filtro baseado no Cargo
  if (userRole === 'customer') {
    query = query.eq('user_id', user.id)
  } 
  else if (userRole === 'barber') {
    query = query.eq('barber_id', user.id)
  }
  // Admin vê tudo (exceto os cancelados, graças ao filtro acima)

  // 5. Executa a busca ordenando por data
  const { data: appointmentsRaw, error } = await query.order('date', { ascending: true })

  if (error) {
    console.error("Erro ao buscar agenda:", error)
  }

  // 6. Formatação dos dados para o componente visual
  const appointments = (appointmentsRaw as unknown as AppointmentRaw[])?.map((app) => {
    return {
        ...app,
        // Injetamos o nome formatado num objeto "profiles" fake
        profiles: { 
            full_name: getDisplayName(app, userRole) 
        } 
    }
  }) || []

  return (
    <div className="space-y-6 h-full flex flex-col pb-20 md:pb-0">
      
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-amber-500" />
            Agenda {userRole === 'admin' ? 'Geral' : (userRole === 'barber' ? 'Profissional' : 'Pessoal')}
          </h1>
          <p className="text-zinc-400 mt-1">
            {userRole === 'barber' 
                ? 'Gerencie seus próximos atendimentos.' 
                : userRole === 'admin' 
                    ? 'Visão completa de todos os agendamentos da loja.'
                    : 'Confira e gerencie seus horários marcados.'}
          </p>
        </div>
        
        {/* Botão de Novo Agendamento */}
        <Link 
            href="/agendamentos/novo"
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 group"
        >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            Novo Agendamento
        </Link>
      </div>

      {/* CALENDÁRIO INTELIGENTE */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl min-h-[600px]">
          <CalendarView appointments={appointments} userRole={userRole} />
      </div>
      
    </div>
  )
}