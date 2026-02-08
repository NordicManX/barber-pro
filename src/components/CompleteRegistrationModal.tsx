'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { AlertTriangle, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter, usePathname } from 'next/navigation'

export function CompleteRegistrationModal() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname() // Para detectar mudança de página
  
  const [isOpen, setIsOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    id: '',
    full_name: '',
    phone: '',
    cpf: '',
    cep: '',
    address: '',
    number: '',
    neighborhood: '',
    city: '',
    state: ''
  })

  // FUNÇÃO DE VERIFICAÇÃO (Reutilizável)
  const checkUserProfile = async () => {
    // Evita rodar em páginas públicas (Login/Cadastro) para não piscar
    if (pathname.startsWith('/login') || pathname.startsWith('/auth')) return

    setChecking(true)
    
    // 1. Pega usuário logado
    const { data: { user } } = await supabase.auth.getUser()
    
    // Se não tem usuário, fecha o modal e tchau
    if (!user) {
        setIsOpen(false)
        setChecking(false)
        return
    }

    // 2. Busca o perfil no banco
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // 3. LÓGICA DE BLOQUEIO
    // Abre se: Perfil não existe (erro) OU Perfil existe mas falta dado essencial
    const missingProfile = !profile || !!error
    const missingData = profile && (!profile.cpf || !profile.phone || !profile.full_name)

    if (missingProfile || missingData) {
        // Preenche com o que tiver
        setFormData({
            id: user.id,
            full_name: profile?.full_name || user.user_metadata?.full_name || '',
            phone: profile?.phone || user.user_metadata?.phone || '',
            cpf: profile?.cpf || '',
            cep: profile?.cep || '',
            address: profile?.address || '',
            number: profile?.number || '',
            neighborhood: profile?.neighborhood || '',
            city: profile?.city || '',
            state: profile?.state || ''
        })
        setIsOpen(true)
    } else {
        // Se estiver tudo certo, garante que fecha
        setIsOpen(false)
    }
    
    setChecking(false)
  }

  // 🔥 O SEGREDO: MONITORAR MUDANÇAS DE AUTH E NAVEGAÇÃO
  useEffect(() => {
    // 1. Monitora Login/Logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            checkUserProfile()
        }
        if (event === 'SIGNED_OUT') {
            setIsOpen(false)
        }
    })

    // 2. Checa também ao montar (F5)
    checkUserProfile()

    return () => subscription.unsubscribe()
  }, [pathname]) // <--- Roda sempre que mudar de página também

  // --- MÁSCARAS ---
  const maskPhone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1')
  const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1')
  const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1')

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')
    if (cep.length !== 8) return
    try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) {
            setFormData(prev => ({
                ...prev,
                address: data.logradouro,
                neighborhood: data.bairro,
                city: data.localidade,
                state: data.uf
            }))
            toast.success('Endereço encontrado!')
        }
    } catch (err) { toast.error('CEP não encontrado.') }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.phone || !formData.cpf || !formData.full_name) {
        toast.warning('Preencha os campos obrigatórios (*)')
        return
    }

    setSaving(true)
    try {
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: formData.id,
                full_name: formData.full_name,
                phone: formData.phone,
                cpf: formData.cpf,
                cep: formData.cep,
                address: formData.address,
                number: formData.number,
                neighborhood: formData.neighborhood,
                city: formData.city,
                state: formData.state,
                role: 'customer' // Garante role
            })

        if (error) throw error
        
        // Atualiza metadata também
        await supabase.auth.updateUser({
            data: { full_name: formData.full_name, phone: formData.phone }
        })
        
        toast.success('Cadastro completo!')
        setIsOpen(false)
        router.refresh()
    } catch (error) {
        console.error(error)
        toast.error('Erro ao salvar dados.')
    } finally {
        setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="bg-zinc-900 w-full max-w-2xl rounded-2xl border border-amber-500/30 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-zinc-800 bg-amber-500/5 rounded-t-2xl flex-shrink-0">
                <h2 className="text-2xl font-black text-amber-500 flex items-center gap-3">
                    <AlertTriangle className="animate-pulse" />
                    Quase lá!
                </h2>
                <p className="text-zinc-400 mt-2">
                    Confirme seus dados e adicione seu CPF para agendar.
                </p>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                {/* FORMULÁRIO IGUAL AO ANTERIOR */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Nome Completo *</label>
                        <input required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                            value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">CPF *</label>
                        <input required placeholder="000.000.000-00" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                            value={formData.cpf} onChange={e => setFormData({...formData, cpf: maskCPF(e.target.value)})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Celular / WhatsApp *</label>
                        <input required placeholder="(00) 00000-0000" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                            value={formData.phone} onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})} />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <h3 className="text-sm font-bold text-zinc-400">Endereço (Opcional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <input placeholder="CEP" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                                value={formData.cep} onChange={e => setFormData({...formData, cep: maskCEP(e.target.value)})} onBlur={handleCepBlur} />
                        </div>
                        <div className="md:col-span-2">
                            <input placeholder="Rua / Logradouro" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                                value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                        </div>
                        <div>
                            <input placeholder="Número" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                                value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                        </div>
                        <div>
                            <input placeholder="Bairro" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                                value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                        </div>
                        <div>
                            <input placeholder="Cidade" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                                value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                        </div>
                    </div>
                </div>
            </form>

             <div className="p-6 border-t border-zinc-800 flex-shrink-0">
                <button onClick={handleSave} disabled={saving} className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                    {saving ? <Loader2 className="animate-spin" /> : <>Salvar e Continuar <Save size={20} /></>}
                </button>
            </div>
        </div>
    </div>
  )
}