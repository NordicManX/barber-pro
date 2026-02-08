'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Search, User, Phone, Loader2, MessageCircle, Pencil, Trash2, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

// Tipo Completo do Cliente
type ClientProfile = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  role: string
  cpf?: string
  birth_date?: string
  cep?: string
  address?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  notes?: string
}

export default function ClientesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Estados do Modal de Edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null)
  
  // Estado do Modal de Exclusão (NOVO)
  const [clientToDelete, setClientToDelete] = useState<ClientProfile | null>(null)
  
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 1. Busca os Clientes
  async function loadClients() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('full_name', { ascending: true })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  // --- MÁSCARAS ---
  const maskPhone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1')
  const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1')
  const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1')

  // --- VIACEP ---
  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')
    if (cep.length !== 8) return

    try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro && editingClient) {
            setEditingClient({
                ...editingClient,
                address: data.logradouro,
                neighborhood: data.bairro,
                city: data.localidade,
                state: data.uf
            })
            toast.success('Endereço encontrado!')
        }
    } catch (error) {
        toast.error('CEP não encontrado.')
    }
  }

  // --- SALVAR EDIÇÃO ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return

    setSaving(true)
    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: editingClient.full_name,
                phone: editingClient.phone,
                cpf: editingClient.cpf,
                birth_date: editingClient.birth_date,
                cep: editingClient.cep,
                address: editingClient.address,
                number: editingClient.number,
                neighborhood: editingClient.neighborhood,
                city: editingClient.city,
                state: editingClient.state,
                notes: editingClient.notes
            })
            .eq('id', editingClient.id)

        if (error) throw error
        
        toast.success('Cliente atualizado!')
        setIsModalOpen(false)
        loadClients()
    } catch (error) {
        console.error(error)
        toast.error('Erro ao atualizar.')
    } finally {
        setSaving(false)
    }
  }

  // --- EXCLUIR CLIENTE (NOVO) ---
  const handleConfirmDelete = async () => {
    if (!clientToDelete) return

    setDeleting(true)
    try {
        const { error } = await supabase.from('profiles').delete().eq('id', clientToDelete.id)
        if (error) throw error
        
        toast.success('Cliente removido com sucesso.')
        setClientToDelete(null) // Fecha o modal
        loadClients() // Atualiza lista
    } catch (error) {
        console.error(error)
        toast.error('Erro ao excluir. Verifique se o cliente tem agendamentos.')
    } finally {
        setDeleting(false)
    }
  }

  // Filtro
  const filteredClients = clients.filter(client => {
    const search = searchTerm.toLowerCase()
    return (
      client.full_name?.toLowerCase().includes(search) ||
      client.phone?.includes(search) || 
      client.cpf?.includes(search)
    )
  })

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <User className="w-8 h-8 text-amber-500" />
            Gestão de Clientes
          </h1>
          <p className="text-zinc-400 mt-1">
            Base completa com dados cadastrais.
          </p>
        </div>
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 text-zinc-500 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Buscar nome, CPF ou tel..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600"
            />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-amber-500 w-10 h-10" />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center p-20 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <p className="text-zinc-500">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
                <div key={client.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl hover:border-zinc-700 transition-all group relative">
                    
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => {
                                setEditingClient(client)
                                setIsModalOpen(true)
                            }}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                            title="Editar"
                        >
                            <Pencil size={16} />
                        </button>
                        <button 
                            onClick={() => setClientToDelete(client)} // Abre o modal customizado
                            className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg transition-colors"
                            title="Excluir"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-500 font-bold text-xl overflow-hidden">
                            {client.avatar_url ? <img src={client.avatar_url} alt="" className="w-full h-full object-cover" /> : client.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="font-bold text-zinc-200 truncate pr-16">{client.full_name || 'Sem Nome'}</h3>
                            <span className="text-xs text-zinc-500 uppercase font-semibold tracking-wider flex items-center gap-1">
                                {client.city ? `${client.city}/${client.state}` : 'Sem endereço'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
                            <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                <Phone size={16} />
                                <span>{client.phone || 'Sem telefone'}</span>
                            </div>
                            {client.phone && (
                                <a href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`} target="_blank" className="text-green-500 hover:text-green-400">
                                    <MessageCircle size={20} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* --- MODAL DE EDIÇÃO --- */}
      {isModalOpen && editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
                <div className="sticky top-0 bg-zinc-900/95 backdrop-blur p-6 border-b border-zinc-800 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2"><User className="text-amber-500"/> Editar Cliente</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-300"><X size={24} /></button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs text-zinc-400 mb-1 block">Nome Completo</label>
                            <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                                value={editingClient.full_name} onChange={e => setEditingClient({...editingClient, full_name: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 mb-1 block">CPF</label>
                            <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                                value={editingClient.cpf || ''} onChange={e => setEditingClient({...editingClient, cpf: maskCPF(e.target.value)})} placeholder="000.000.000-00"/>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 mb-1 block">Celular</label>
                            <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                                value={editingClient.phone || ''} onChange={e => setEditingClient({...editingClient, phone: maskPhone(e.target.value)})} />
                        </div>
                    </div>
                    {/* (Restante do formulário de endereço aqui... igual ao anterior) */}
                     <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Endereço</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">CEP</label>
                                <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                                    value={editingClient.cep || ''} onChange={e => setEditingClient({...editingClient, cep: maskCEP(e.target.value)})} onBlur={handleCepBlur}/>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-zinc-400 mb-1 block">Rua</label>
                                <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                                    value={editingClient.address || ''} onChange={e => setEditingClient({...editingClient, address: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">Número</label>
                                <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                                    value={editingClient.number || ''} onChange={e => setEditingClient({...editingClient, number: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">Bairro</label>
                                <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                                    value={editingClient.neighborhood || ''} onChange={e => setEditingClient({...editingClient, neighborhood: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">Cidade</label>
                                <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                                    value={editingClient.city || ''} onChange={e => setEditingClient({...editingClient, city: e.target.value})} />
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-bold transition-all">Cancelar</button>
                        <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black transition-all flex items-center gap-2">
                            {saving ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- MODAL DE EXCLUSÃO (CONFIRMATION) --- */}
      {clientToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-200 p-6 text-center">
                
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                
                <h2 className="text-xl font-bold text-zinc-100 mb-2">Tem certeza disso?</h2>
                <p className="text-zinc-400 text-sm mb-6">
                    Você está prestes a excluir <strong className="text-zinc-200">{clientToDelete.full_name}</strong>. 
                    Essa ação apagará todo o histórico e não poderá ser desfeita.
                </p>

                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={() => setClientToDelete(null)}
                        className="flex-1 py-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-bold transition-all"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirmDelete}
                        disabled={deleting}
                        className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                    >
                        {deleting ? <Loader2 className="animate-spin" /> : 'Sim, Excluir'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  )
}