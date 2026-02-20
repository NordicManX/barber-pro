import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image' // Importar Image
import { 
  Calendar, Scissors, User, 
  History, CalendarDays, Plus, ArrowRight 
} from 'lucide-react'
import { format, isAfter, isBefore, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function ClientDashboardPage() {
  const supabase = await createClient()

  // 1. Quem é o usuário?
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Busca Perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 3. NOVO: Busca Configurações da Barbearia (Logo)
  const { data: settings } = await supabase
    .from('barbershop_settings')
    .select('logo_url')
    .eq('id', 1)
    .single()

  const logoUrl = settings?.logo_url

  // 4. Busca Agendamentos
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id, date, status,
      services ( name, price, duration_minutes ),
      barber:profiles!barber_id ( full_name, avatar_url )
    `)
    .eq('user_id', user.id)
    .neq('status', 'canceled') 
    .order('date', { ascending: true })

  const now = new Date()
  const nextAppointment = appointments?.find(app => isAfter(parseISO(app.date), now))
  const pastAppointments = appointments
    ?.filter(app => isBefore(parseISO(app.date), now))
    .reverse()
    .slice(0, 5) || []

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-24">
      
      {/* HEADER DE BOAS VINDAS */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">
            Olá, <span className="text-amber-500">{profile?.full_name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-zinc-400">Bem-vindo à sua área exclusiva.</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden relative">
            {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="object-cover w-full h-full"/>
            ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 font-bold">
                    {profile?.full_name?.charAt(0)}
                </div>
            )}
        </div>
      </div>

      {/* --- SEÇÃO 1: HERO / PRÓXIMO AGENDAMENTO --- */}
      <section>
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CalendarDays size={16}/> Status Atual
        </h2>

        {nextAppointment ? (
            // CARD DE AGENDAMENTO CONFIRMADO
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-6 md:p-8 relative overflow-hidden group shadow-2xl shadow-amber-900/10">
                <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-5xl md:text-6xl font-black text-zinc-100 tracking-tighter">
                            {format(parseISO(nextAppointment.date), 'HH:mm')}
                        </span>
                        <span className="text-lg md:text-xl text-amber-500 font-bold capitalize">
                            {format(parseISO(nextAppointment.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </span>
                    </div>
                    {/* ... (Detalhes do serviço mantidos iguais) ... */}
                    <div className="flex-1 space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                <Scissors size={18} className="text-zinc-400"/>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500 font-bold uppercase">Serviço</p>
                                <p className="text-zinc-200 font-medium">{nextAppointment.services?.name}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 md:w-48">
                        <Link href={`/agendamentos/editar/${nextAppointment.id}`} className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                            Gerenciar <ArrowRight size={18}/>
                        </Link>
                    </div>
                </div>
            </div>
        ) : (
            // CARD DE "NENHUM AGENDAMENTO" - AGORA COM LOGO DINÂMICA
            <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center gap-6 hover:border-zinc-700 transition-all relative overflow-hidden">
                
                {/* LOGO DINÂMICA NO CENTRO */}
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-zinc-950 border-4 border-zinc-800 flex items-center justify-center shadow-2xl overflow-hidden group">
                    {logoUrl ? (
                        <Image 
                            src={logoUrl} 
                            alt="Logo da Barbearia" 
                            fill 
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="160px"
                        />
                    ) : (
                        <div className="bg-amber-500/10 w-full h-full flex items-center justify-center">
                            <Scissors size={48} className="text-amber-500"/>
                        </div>
                    )}
                </div>

                <div className="z-10 max-w-lg">
                    <h3 className="text-2xl md:text-3xl font-black text-zinc-100 uppercase italic tracking-tight">
                        Estilo e Precisão para o <span className="text-amber-500">Homem Moderno</span>.
                    </h3>
                    <p className="text-zinc-500 mt-2">
                        Agende seu horário com os melhores profissionais em poucos cliques.
                    </p>
                </div>

                <Link 
                    href="/agendamentos/novo"
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black py-4 px-10 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 hover:scale-105 transform"
                >
                    <Plus size={24} strokeWidth={3}/> AGENDAR AGORA
                </Link>
            </div>
        )}
      </section>

      {/* --- SEÇÃO 2: HISTÓRICO --- */}
      <section>
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <History size={16}/> Histórico Recente
        </h2>
        {pastAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastAppointments.map(app => (
                    <div key={app.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-4 hover:border-zinc-700 transition-all opacity-75 hover:opacity-100">
                        <div className="bg-zinc-950 p-3 rounded-lg text-center min-w-[60px] border border-zinc-900">
                            <span className="block text-xs font-bold text-zinc-500 uppercase">
                                {format(parseISO(app.date), 'MMM', { locale: ptBR })}
                            </span>
                            <span className="block text-xl font-bold text-zinc-300">
                                {format(parseISO(app.date), 'dd')}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-zinc-200 font-bold text-sm">{app.services?.name}</h4>
                            <p className="text-zinc-500 text-xs flex items-center gap-1 mt-1">
                                <User size={10}/> {app.barber?.full_name?.split(' ')[0]}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-zinc-500 text-sm">Seu histórico de cortes aparecerá aqui.</p>
        )}
      </section>

    </div>
  )
}