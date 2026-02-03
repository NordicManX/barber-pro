'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Loader2, DollarSign, Clock, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface EditServiceModalProps {
  service: {
    id: string
    name: string
    price: number
    duration_minutes: number
    description: string | null
  }
}

export function EditServiceModal({ service }: EditServiceModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false) // <--- Novo controle de estado
  
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(service.name)
  const [price, setPrice] = useState(service.price.toString())
  const [duration, setDuration] = useState(service.duration_minutes.toString())
  const [description, setDescription] = useState(service.description || '')

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
        setLoading(true)
        const numericPrice = parseFloat(price.replace(',', '.'))

        const { error } = await supabase
            .from('services')
            .update({
                name,
                price: numericPrice,
                duration_minutes: parseInt(duration),
                description
            })
            .eq('id', service.id)

        if (error) throw error

        toast.success('Serviço atualizado!')
        setIsOpen(false)
        router.refresh() 

    } catch (error) {
        console.error(error)
        toast.error('Erro ao atualizar.')
    } finally {
        setLoading(false)
    }
  }

  // Agora deleta direto, pois a confirmação visual já aconteceu antes de chamar isso
  const handleDelete = async () => {
    try {
        setLoading(true)
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', service.id)

        if (error) throw error

        toast.success('Serviço excluído com sucesso.')
        setIsOpen(false)
        router.refresh()
    } catch (error) {
        toast.error('Erro ao excluir.')
    } finally {
        setLoading(false)
    }
  }

  // Reseta o estado de confirmação quando fecha o modal
  const handleClose = () => {
      setIsOpen(false)
      setShowDeleteConfirm(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
      >
        <Pencil size={14} />
        Editar Detalhes
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-zinc-100">
                        {showDeleteConfirm ? 'Excluir Serviço?' : 'Editar Serviço'}
                    </h2>
                    <button onClick={handleClose} className="text-zinc-500 hover:text-red-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {/* SE ESTIVER CONFIRMANDO EXCLUSÃO, MOSTRA AVISO */}
                    {showDeleteConfirm ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                             <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-4">
                                <AlertTriangle className="text-red-500 w-10 h-10" />
                                <div>
                                    <h3 className="text-red-500 font-bold">Atenção!</h3>
                                    <p className="text-zinc-400 text-sm">
                                        Você tem certeza que deseja remover <strong>{name}</strong>? Essa ação não pode ser desfeita.
                                    </p>
                                </div>
                             </div>

                             <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-lg transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Sim, Excluir'}
                                </button>
                             </div>
                        </div>
                    ) : (
                        // FORMULÁRIO NORMAL DE EDIÇÃO
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">Nome</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">Valor (R$)</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                                        <input 
                                            type="number" 
                                            value={price}
                                            onChange={e => setPrice(e.target.value)}
                                            step="0.01"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 pl-9 text-zinc-100 focus:border-amber-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">Minutos</label>
                                    <div className="relative">
                                        <Clock size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                                        <select 
                                            value={duration}
                                            onChange={e => setDuration(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 pl-9 text-zinc-100 focus:border-amber-500 focus:outline-none appearance-none"
                                        >
                                            <option value="15">15 min</option>
                                            <option value="30">30 min</option>
                                            <option value="45">45 min</option>
                                            <option value="60">1h (60 min)</option>
                                            <option value="90">1h 30m</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">Detalhes</label>
                                <textarea 
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-amber-500 focus:outline-none resize-none"
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                {/* Botão de Lixeira - AGORA ATIVA O MODO DE CONFIRMAÇÃO */}
                                <button 
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-3 px-4 rounded-lg transition-all"
                                >
                                <Trash2 size={20} />
                                </button>

                                {/* Botão de Salvar */}
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
      )}
    </>
  )
}