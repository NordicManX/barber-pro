'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Scissors, 
  LogOut, 
  Settings,
  Menu,
  Shield // <--- ADICIONEI O ÍCONE DA EQUIPE AQUI
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Itens do Menu
  const navItems = [
    { href: '/', label: 'Início', icon: LayoutDashboard },
    { href: '/agendamentos', label: 'Agenda', icon: CalendarDays },
    { href: '/clientes', label: 'Clientes', icon: Users },
    
    // 👇 NOVO ITEM: EQUIPE 👇
    { href: '/equipe', label: 'Equipe', icon: Shield }, 
    
    { href: '/servicos', label: 'Serviços', icon: Scissors },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      
      {/* ==========================================================
          SIDEBAR (APENAS DESKTOP - Hidden no Mobile)
          md:flex = Só aparece de tablet pra cima
         ========================================================== */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 h-screen sticky top-0 bg-zinc-950">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-2">
           <div className="bg-amber-500 p-1.5 rounded-lg">
             <Scissors className="w-5 h-5 text-zinc-950" />
           </div>
           <span className="font-bold text-lg tracking-tight uppercase">Hartmann</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* ==========================================================
          CONTEÚDO PRINCIPAL
         ========================================================== */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto h-screen">
        {/* Header Mobile (Só aparece no celular) */}
        <header className="md:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
             <div className="bg-amber-500 p-1.5 rounded-lg">
               <Scissors className="w-4 h-4 text-zinc-950" />
             </div>
             <span className="font-bold text-lg tracking-tight uppercase">Hartmann</span>
          </div>
          <button onClick={handleSignOut} className="text-zinc-400">
            <LogOut size={20} />
          </button>
        </header>

        {children}
      </main>

      {/* ==========================================================
          BOTTOM NAVIGATION (APENAS MOBILE - Hidden no Desktop)
          md:hidden = Só aparece em celular
         ========================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-800 flex justify-around p-2 pb-4 z-50 overflow-x-auto">
        {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition-all min-w-[60px] ${
                  isActive 
                    ? 'text-amber-500' 
                    : 'text-zinc-500'
                }`}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                {item.label}
              </Link>
            )
          })}
      </nav>
    </div>
  )
}