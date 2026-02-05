'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Shield, Search, Loader2, ArrowUpCircle, ArrowDownCircle, Crown } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

export default function TeamPage() {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState('customer')

  // Carrega tudo
  async function loadData() {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (myProfile) setCurrentUserRole(myProfile.role)
    }

    const { data } = await supabase.from('profiles').select('*').order('full_name')
    if (data) setProfiles(data)
    
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleRole = async (id: string, currentRole: string) => {
    // Regra de segurança extra no front: Não deixar rebaixar outro admin
    if (currentRole === 'admin') {
        toast.error("Você não pode rebaixar um Superadmin.")
        return
    }

    const newRole = currentRole === 'customer' ? 'barber' : 'customer'
    const actionName = newRole === 'barber' ? 'Promovido' : 'Rebaixado'

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id)

    if (error) {
        toast.error("Acesso Negado. Apenas Admins podem gerenciar a equipe.")
    } else {
        toast.success(`Usuário ${actionName} com sucesso!`)
        loadData()
    }
  }

  const staff = profiles.filter(p => p.role === 'barber' || p.role === 'admin')
  const candidates = profiles.filter(p => p.role === 'customer')

  if (loading) return <div className="p-8"><Loader2 className="animate-spin text-amber-500"/></div>

  return (
    <div className="space-y-12 pb-20">
      
      {/* SEÇÃO 1: A EQUIPE */}
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-500" />
            Gestão de Equipe
            </h1>
            <p className="text-zinc-400 mt-2">
            Quem faz a barbearia acontecer.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map(profile => (
                <div key={profile.id} className={`border p-6 rounded-xl flex items-center justify-between group transition-all
                    ${profile.role === 'admin' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-900 border-zinc-800'}
                `}>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-amber-500/50 flex items-center justify-center overflow-hidden relative">
                            {profile.avatar_url ? (
                                <Image src={profile.avatar_url} alt={profile.full_name} fill className="object-cover" />
                            ) : (
                                <span className="text-xl font-bold text-zinc-500">
                                    {profile.full_name?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                                {profile.full_name || 'Sem Nome'}
                                {profile.role === 'admin' && <Crown size={14} className="text-amber-500" />}
                            </h3>
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border 
                                ${profile.role === 'admin' 
                                    ? 'bg-amber-500 text-zinc-950 border-amber-500' 
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'}
                            `}>
                                {profile.role === 'admin' ? 'Superadmin' : 'Barbeiro'}
                            </span>
                        </div>
                    </div>

                    {/* Botão de Rebaixar (SÓ APARECE SE EU FOR ADMIN E O ALVO NÃO FOR ADMIN) */}
                    {currentUserRole === 'admin' && profile.role !== 'admin' && (
                        <button 
                            onClick={() => toggleRole(profile.id, profile.role)}
                            title="Remover da Equipe"
                            className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ArrowDownCircle size={20} />
                        </button>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* SEÇÃO 2: ÁREA ADMINISTRATIVA (SÓ VISÍVEL PARA ADMIN) */}
      {currentUserRole === 'admin' && (
          <div className="border-t border-zinc-800 pt-10 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-zinc-200 flex items-center gap-2">
                        <Search className="w-5 h-5 text-zinc-500" />
                        Candidatos (Clientes)
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Promova clientes para a equipe de barbeiros.
                    </p>
                </div>
            </div>

            {candidates.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                    <p className="text-zinc-500">Nenhum cliente novo encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {candidates.map(candidate => (
                        <div key={candidate.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex items-center justify-between hover:border-zinc-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 font-bold text-xs">
                                    {candidate.full_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-zinc-300">{candidate.full_name || 'Usuário sem nome'}</p>
                                    <p className="text-xs text-zinc-600">Cliente</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => toggleRole(candidate.id, candidate.role)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-green-500/10 text-zinc-400 hover:text-green-500 border border-zinc-800 hover:border-green-500/50 rounded text-xs font-bold transition-all"
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