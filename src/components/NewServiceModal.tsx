'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { X, Plus, Loader2, DollarSign, Clock, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function NewServiceModal() {
  const [isOpen, setIsOpen] = useState(false) // Controla se o modal está visível
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Estados do Formulário
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('30')
  const [description, setDescription] = useState('')

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !price) {
        toast.warning('Preencha pelo menos nome e preço.')
        return
    }

    try {
        setLoading(true)
        
        // Converter preço de texto "40,00" para numero 40.00
        const numericPrice = parseFloat(price.replace(',', '.'))

        const { error } = await supabase
            .from('services')
            .insert({
                name,
                price: numericPrice,
                duration_minutes: parseInt(duration),
                description,
                active: true
            })

        if (error) throw error

        toast.success('Serviço criado!', {
            description: `${name} foi adicionado ao catálogo.`
        })

        setIsOpen(false) // Fecha o modal
        resetForm()      // Limpa os campos
        router.refresh() // Atualiza a lista atrás do modal

    } catch (error) {
        console.error(error)
        toast.error('Erro ao criar serviço')
    } finally {
        setLoading(false)
    }
  }

  const resetForm = () => {
      setName('')
      setPrice('')
      setDuration('30')
      setDescription('')
  }

  return (
    <>
      {/* 1. O GATILHO (Botão que abre o modal) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-white/5"
      >
        <Plus size={20} />
        Novo Serviço
      </button>

      {/* 2. O MODAL (Só aparece se isOpen for true) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            
            {/* Caixa do Modal */}
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                
                {/* Cabeçalho */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-zinc-100">Adicionar Serviço</h2>
                    <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-red-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Formulário */}
                <form onSubmit={handleCreateService} className="p-6 space-y-4">
                    
                    {/* Nome */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">Nome do Serviço</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ex: Corte Degadê"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-amber-500 focus:outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Preço */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">Valor (R$)</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                                <input 
                                    type="number" 
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    placeholder="0,00"
                                    step="0.01"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 pl-9 text-zinc-100 focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Duração */}
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

                    {/* Descrição */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">Detalhes (Opcional)</label>
                        <textarea 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Ex: Incluso lavagem e finalização..."
                            rows={3}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-amber-500 focus:outline-none resize-none"
                        />
                    </div>

                    {/* Botão de Salvar */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Salvar Serviço'}
                    </button>

                </form>
            </div>
        </div>
      )}
    </>
  )
}