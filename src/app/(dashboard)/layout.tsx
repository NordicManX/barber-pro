import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar' // Importa o componente novo
import { LayoutGrid, CalendarDays, Users, Shield, Scissors, Settings } from 'lucide-react'

// Força atualização dos dados
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Verifica autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Busca dados do perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'customer'

  // Menu Items (Para o Mobile)
  const menuItems = [
    { name: 'Início', href: '/area-cliente', icon: LayoutGrid, roles: ['admin', 'barber', 'customer'] },
    { name: 'Agenda', href: '/agendamentos', icon: CalendarDays, roles: ['admin', 'barber', 'customer'] },
    { name: 'Clientes', href: '/clientes', icon: Users, roles: ['admin', 'barber'] },
    { name: 'Equipe', href: '/equipe', icon: Shield, roles: ['admin'] },
    { name: 'Serviços', href: '/servicos', icon: Scissors, roles: ['admin'] },
    { name: 'Config', href: '/configuracoes', icon: Settings, roles: ['admin'] },
  ]

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      
      {/* SIDEBAR DESKTOP (Agora é um componente inteligente) */}
      <Sidebar profile={profile} />

      {/* MENU MOBILE (Mantido aqui para simplicidade) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-900 border-t border-zinc-800 flex items-center justify-around z-50 px-2 pb-safe">
        {menuItems.map((item) => {
            if (!item.roles.includes(userRole)) return null;
            if (item.name === 'Config' || item.name === 'Serviços') return null; 

            return (
              <Link 
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center w-full h-full text-zinc-500 hover:text-amber-500 transition-colors"
              >
                <item.icon size={24} />
                <span className="text-[10px] mt-1 font-medium">{item.name}</span>
              </Link>
            )
        })}
        <Link 
            href="/perfil"
            className="flex flex-col items-center justify-center w-full h-full text-zinc-500 hover:text-amber-500 transition-colors"
        >
            <div className="w-6 h-6 rounded-full overflow-hidden border border-zinc-600">
               {profile?.avatar_url ? (
                   <img src={profile.avatar_url} className="w-full h-full object-cover" />
               ) : (
                   <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                       {(profile?.full_name || 'U').charAt(0)}
                   </div>
               )}
            </div>
            <span className="text-[10px] mt-1 font-medium">Perfil</span>
        </Link>
      </nav>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 md:ml-64 min-h-screen relative w-full">
        <div className="w-full max-w-7xl mx-auto pb-24 md:pb-8 md:p-8">
            {children}
        </div>
      </main>

    </div>
  )
}