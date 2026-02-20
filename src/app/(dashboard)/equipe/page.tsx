'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Shield, Search, Loader2, ArrowUpCircle, ArrowDownCircle, Crown, User, Scissors } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

// 1. Definindo o tipo dos dados para evitar erros
interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'barber' | 'customer'
  email?: string
}

export default function TeamPage() {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<string>('customer')

  // Carrega tudo
  async function loadData() {
    setLoading(true)
    
    // Pega o usuário atual
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
        const { data: myProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        
        if (myProfile) setCurrentUserRole(myProfile.role)
    }

    // Pega todos os perfis
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name') // Ordena alfabeticamente
    
    if (data) {
        // Força a tipagem para garantir que o TS entenda
        setProfiles(data as Profile[])
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleRole = async (id: string, currentRole: string) => {
    // Regra de segurança: Não mexer em outros admins
    if (currentRole === 'admin') {
        toast.error("Você não pode alterar o cargo de um Superadmin.")
        return
    }

    // Lógica: Se é Cliente vira Barbeiro. Se é Barbeiro vira Cliente.
    const newRole = currentRole === 'customer' ? 'barber' : 'customer'
    const actionName = newRole === 'barber' ? 'promovido a Barbeiro' : 'rebaixado a Cliente'

    // Loading otimista (opcional) ou apenas toast de loading
    const loadingToast = toast.loading("Atualizando permissões...")

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id)

    toast.dismiss(loadingToast)

    if (error) {
        console.error(error)
        toast.error("Erro ao atualizar. Verifique suas permissões.")
    } else {
        toast.success(`Usuário ${actionName} com sucesso!`)
        loadData() // Recarrega a lista
    }
  }

  // Separação das Listas
  const staff = profiles.filter(p => p.role === 'barber' || p.role === 'admin')
  
  // Candidatos são todos que NÃO são staff
  const candidates = profiles.filter(p => p.role !== 'barber' && p.role !== 'admin')

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500"/>
            <p className="text-sm">Carregando equipe...</p>
        </div>
    )
  }

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-500">
      
      {/* CABEÇALHO */}
      <div className="px-4">
        <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
          <Shield className="w-8 h-8 text-amber-500" />
          Gestão de Equipe
        </h1>
        <p className="text-zinc-400 mt-2">
          Gerencie quem tem acesso ao sistema da barbearia.
        </p>
      </div>

      {/* SEÇÃO 1: A EQUIPE ATIVA */}
      {/* Adicionado padding horizontal (px-4) para criar o espaço nas laterais */}
      <div className="space-y-6 px-4">
        <h2 className="text-xl font-semibold text-zinc-300 border-l-4 border-amber-500 pl-4">
            Membros Ativos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map(profile => (
                <div 
                    key={profile.id} 
                    className={`
                        relative border p-6 rounded-xl flex items-center justify-between group transition-all duration-300 hover:shadow-lg hover:shadow-black/20
                        ${profile.role === 'admin' 
                            ? 'bg-gradient-to-br from-zinc-900 to-amber-950/20 border-amber-500/30' 
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}
                    `}
                >
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden relative border-2 ${profile.role === 'admin' ? 'border-amber-500' : 'border-zinc-700'}`}>
                            {profile.avatar_url ? (
                                <Image src={profile.avatar_url} alt={profile.full_name || 'User'} fill className="object-cover" />
                            ) : (
                                <span className="text-xl font-bold text-zinc-500">
                                    {(profile.full_name || '?').charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>

                        {/* Infos */}
                        <div>
                            <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                                {profile.full_name || 'Sem Nome'}
                                {profile.role === 'admin' && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                            </h3>
                            
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border 
                                    ${profile.role === 'admin' 
                                        ? 'bg-amber-500 text-zinc-950 border-amber-500' 
                                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'}
                                `}>
                                    {profile.role === 'admin' ? 'Superadmin' : 'Barbeiro'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Botão de Rebaixar (Admin não pode ser rebaixado por aqui) */}
                    {currentUserRole === 'admin' && profile.role !== 'admin' && (
                        <button 
                            onClick={() => toggleRole(profile.id, profile.role)}
                            title="Remover da Equipe (Tornar Cliente)"
                            className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                            <ArrowDownCircle size={22} />
                        </button>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* SEÇÃO 2: ÁREA DE RECRUTAMENTO (SÓ ADMIN VÊ) */}
      {currentUserRole === 'admin' && (
          <div className="border-t border-zinc-800 pt-10 space-y-6 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-zinc-200 flex items-center gap-2">
                        <Search className="w-5 h-5 text-zinc-500" />
                        Candidatos (Clientes)
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Promova clientes para a equipe de barbeiros.
                    </p>
                </div>
                <div className="bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 text-xs text-zinc-500">
                    Total: {candidates.length} clientes
                </div>
            </div>

            {candidates.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                    <User className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 font-medium">Nenhum cliente disponível para promoção.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {candidates.map(candidate => (
                        <div key={candidate.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex items-center justify-between hover:border-zinc-700 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 font-bold border border-zinc-800 group-hover:border-zinc-600 transition-colors">
                                    {(candidate.full_name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                                        {candidate.full_name || 'Usuário sem nome'}
                                    </p>
                                    <p className="text-xs text-zinc-600">Cliente</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => toggleRole(candidate.id, candidate.role)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-500 border border-zinc-800 hover:border-emerald-500/50 rounded text-xs font-bold transition-all"
                            >
                                Promover
                                <ArrowUpCircle size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>
      )}

    </div>
  )
}