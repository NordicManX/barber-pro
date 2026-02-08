import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Scissors, 
  CalendarDays, 
  Users, 
  Settings, 
  LayoutGrid, 
  Shield, 
  LogOut
} from 'lucide-react'

// Força atualização dos dados (Avatar, Cargo) sempre que carregar
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

  // 3. Define o Menu
  const menuItems = [
    { name: 'Início', href: '/', icon: LayoutGrid, roles: ['admin', 'barber', 'customer'] },
    { name: 'Agenda', href: '/agendamentos', icon: CalendarDays, roles: ['admin', 'barber', 'customer'] },
    { name: 'Clientes', href: '/clientes', icon: Users, roles: ['admin', 'barber'] },
    { name: 'Equipe', href: '/equipe', icon: Shield, roles: ['admin'] },
    { name: 'Serviços', href: '/servicos', icon: Scissors, roles: ['admin'] },
    { name: 'Config', href: '/configuracoes', icon: Settings, roles: ['admin'] },
  ]

  const renderAvatar = () => (
    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-amber-500 font-bold border border-zinc-700 overflow-hidden relative">
        {profile?.avatar_url ? (
            <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                key={profile.avatar_url} 
            />
        ) : (
            <span>{(profile?.full_name || user.email)?.charAt(0).toUpperCase()}</span>
        )}
    </div>
  )

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 flex items-center gap-3 border-b border-zinc-800">
          <div className="bg-amber-500 p-2 rounded-lg">
            <Scissors className="w-6 h-6 text-zinc-950" />
          </div>
          <span className="font-black text-xl tracking-tight uppercase">Hartmann</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            if (!item.roles.includes(userRole)) return null;
            return (
              <Link 
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all font-medium"
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900">
            <Link href="/perfil" className="flex items-center gap-3 px-4 py-3 mb-2 hover:bg-zinc-800 rounded-lg transition-colors group cursor-pointer">
                {renderAvatar()}
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold truncate text-zinc-200 group-hover:text-amber-500 transition-colors">
                        {profile?.full_name?.split(' ')[0] || 'Minha Conta'}
                    </span>
                    <span className="text-xs text-zinc-500 truncate uppercase">
                        {userRole === 'admin' ? 'Admin' : userRole === 'barber' ? 'Barbeiro' : 'Cliente'}
                    </span>
                </div>
            </Link>

            <form action="/auth/signout" method="post">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all font-bold text-sm">
                    <LogOut size={18} />
                    Sair
                </button>
            </form>
        </div>
      </aside>

      {/* MENU MOBILE */}
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
        {/* MUDANÇA CRÍTICA AQUI: 
            Removi o 'p-4' do mobile. Agora é apenas 'md:p-8'.
            Isso permite que as páginas controlem suas próprias bordas no celular.
        */}
        <div className="w-full max-w-7xl mx-auto pb-24 md:pb-8 md:p-8">
            {children}
        </div>
      </main>

    </div>
  )
}