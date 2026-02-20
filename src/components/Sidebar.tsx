'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutGrid, CalendarDays, Users, Shield, 
  Scissors, Settings, LogOut, Loader2, Camera 
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import Image from "next/image"

export function Sidebar({ profile }: { profile: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const userRole = profile?.role || 'customer'
  const isAdmin = userRole === 'admin'

  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // 1. NOVO: Busca a logo salva no Banco de Dados ao carregar
  useEffect(() => {
    async function loadSettings() {
        const { data, error } = await supabase
            .from('barbershop_settings')
            .select('logo_url')
            .eq('id', 1) // Pega sempre a configuração principal (ID 1)
            .single()
        
        if (data?.logo_url) {
            setLogoUrl(data.logo_url)
        }
    }
    loadSettings()
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    if (!isAdmin) return toast.error("Apenas administradores podem alterar a logo.")

    setUploading(true)
    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    // Dica: Usar sempre o mesmo nome ou timestamp ajuda
    const fileName = `logo-${Date.now()}.${fileExt}`

    try {
        // A. Sobe a imagem para o Storage
        const { error: uploadError } = await supabase.storage
            .from('branding')
            .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('branding')
            .getPublicUrl(fileName)

        // B. Atualiza o estado visual na hora
        setLogoUrl(publicUrl)

        // C. NOVO: Salva a URL no Banco de Dados (Isso faz ficar permanente!)
        const { error: dbError } = await supabase
            .from('barbershop_settings')
            .update({ logo_url: publicUrl })
            .eq('id', 1)

        if (dbError) throw dbError

        toast.success("Logo salva com sucesso!")
        
    } catch (error) {
        console.error(error)
        toast.error("Erro ao salvar logo.")
    } finally {
        setUploading(false)
    }
  }

  const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push('/login')
  }

  const menuItems = [
    { name: 'Início', href: '/area-cliente', icon: LayoutGrid, roles: ['admin', 'barber', 'customer'] },
    { name: 'Agenda', href: '/agendamentos', icon: CalendarDays, roles: ['admin', 'barber', 'customer'] },
    { name: 'Clientes', href: '/clientes', icon: Users, roles: ['admin', 'barber'] },
    { name: 'Equipe', href: '/equipe', icon: Shield, roles: ['admin'] },
    { name: 'Serviços', href: '/servicos', icon: Scissors, roles: ['admin'] },
    { name: 'Config', href: '/configuracoes', icon: Settings, roles: ['admin'] },
  ]

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900 hidden md:flex flex-col fixed h-full z-10">
        
        {/* ÁREA DA LOGO */}
        <div className="h-28 flex items-center justify-center border-b border-zinc-800 relative group overflow-hidden">
            <label 
                htmlFor="logo-upload" 
                className={`cursor-pointer flex items-center justify-center w-full h-full relative p-4 ${!isAdmin && 'pointer-events-none'}`}
            >
                <input 
                    type="file" 
                    id="logo-upload" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                    className="hidden" 
                    disabled={uploading}
                />

                {uploading ? (
                    <Loader2 className="animate-spin text-amber-500"/>
                ) : logoUrl ? (
                    <div className="relative w-full h-full">
                        <Image 
                            src={logoUrl} 
                            alt="Logo Barbearia" 
                            fill 
                            className="object-contain" 
                            sizes="(max-width: 768px) 100vw, 250px"
                            priority
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-500 p-2 rounded-lg text-zinc-950">
                            <Scissors className="w-6 h-6" />
                        </div>
                        <span className="font-black text-xl tracking-tight uppercase text-zinc-100">Hartmann</span>
                    </div>
                )}

                {isAdmin && !uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <span className="text-xs text-white flex items-center gap-1 font-bold">
                            <Camera size={14}/> Alterar
                        </span>
                    </div>
                )}
            </label>
        </div>

        {/* NAVEGAÇÃO */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
                if (!item.roles.includes(userRole)) return null;
                const isActive = pathname === item.href
                return (
                    <Link 
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium
                            ${isActive ? 'bg-zinc-800 text-zinc-100 border-l-4 border-amber-500' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}
                        `}
                    >
                        <item.icon size={20} />
                        {item.name}
                    </Link>
                )
            })}
        </nav>

        {/* FOOTER USER */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900">
            <Link href="/perfil" className="flex items-center gap-3 px-4 py-3 mb-2 hover:bg-zinc-800 rounded-lg transition-colors group cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-amber-500 font-bold border border-zinc-700 overflow-hidden relative">
                    {profile?.avatar_url ? (
                        <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" sizes="32px" />
                    ) : (
                        <span>{profile?.full_name?.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold truncate text-zinc-200 group-hover:text-amber-500 transition-colors">
                        {profile?.full_name?.split(' ')[0] || 'Conta'}
                    </span>
                    <span className="text-xs text-zinc-500 truncate uppercase">
                        {userRole === 'admin' ? 'Admin' : 'Cliente'}
                    </span>
                </div>
            </Link>

            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all font-bold text-sm">
                <LogOut size={18} /> Sair
            </button>
        </div>
    </aside>
  )
}