'use client'

import { useState, useRef, useLayoutEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
    Clock, User, DollarSign, Calendar as CalendarIcon, 
    Scissors, AlertCircle, Trash2, Edit, X, Loader2 
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Appointment {
    id: string
    date: string
    status: string
    services: { name: string; price: number; duration_minutes: number } | null
    profiles: { full_name: string } | null
}

interface SlotProps {
    app: Appointment
}

export function CalendarAppointmentSlot({ app }: SlotProps) {
    const supabase = createClient()
    const router = useRouter()
    
    // Estados
    const [isHovered, setIsHovered] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false) // Controla o Modal
    const [isDeleting, setIsDeleting] = useState(false)
    
    // Posicionamento do Popover (Hover)
    const [verticalPos, setVerticalPos] = useState<'top' | 'bottom'>('top')
    const [horizontalAlign, setHorizontalAlign] = useState<'left' | 'right'>('left')
    const triggerRef = useRef<HTMLDivElement>(null)

    // Formatação
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

    // Lógica de Posição do Hover (Mantida igual)
    useLayoutEffect(() => {
        if (isHovered && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            if (rect.top < 230) setVerticalPos('bottom');
            else setVerticalPos('top');
            
            if (window.innerWidth - rect.right < 280) setHorizontalAlign('right');
            else setHorizontalAlign('left');
        }
    }, [isHovered]) 

    // --- FUNÇÃO DE EXCLUIR ---
    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('appointments')
                .delete() // Ou .update({ status: 'canceled' }) se preferir manter histórico
                .eq('id', app.id)

            if (error) throw error

            toast.success('Agendamento cancelado com sucesso!')
            setIsModalOpen(false)
            router.refresh() // Atualiza a tela para sumir o agendamento
        } catch (error) {
            console.error(error)
            toast.error('Erro ao cancelar.')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <>
            {/* O SLOT NA AGENDA (Clicável) */}
            <div 
                ref={triggerRef}
                className="relative group" 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setIsModalOpen(true)} // <--- CLIQUE ABRE O MODAL
            >
                {/* Etiqueta Visual */}
                <div className={`
                    text-xs border rounded px-2 py-1 truncate cursor-pointer transition-all relative select-none
                    ${isHovered 
                        ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold z-50' 
                        : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:border-zinc-500 z-10'
                    }
                    ${app.services ? '' : 'opacity-50'}
                `}>
                    {app.services ? (
                        <div className="flex items-center gap-1">
                            <span className="opacity-70 font-mono text-[10px]">{formatTime(app.date)}</span>
                            <span className="truncate">{app.services.name}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-red-400">
                            <AlertCircle size={12} /> Excluído
                        </div>
                    )}
                </div>

                {/* POPOVER HOVER (Só resumo visual) */}
                {isHovered && !isModalOpen && app.services && (
                    <div className={`absolute w-72 bg-zinc-950 border border-zinc-700 rounded-xl shadow-2xl p-4 z-[999] animate-in fade-in zoom-in-95 duration-150 pointer-events-none
                        ${verticalPos === 'top' ? 'bottom-full mb-3' : 'top-full mt-3'}
                        ${horizontalAlign === 'left' ? 'left-0' : 'right-0'}
                    `}>
                        {/* Conteúdo do Hover (Mantido igual) */}
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
                            <span className="text-amber-500 font-bold text-xs flex items-center gap-1">
                                <Scissors size={12}/> {app.services.name}
                            </span>
                            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">Clique para gerenciar</span>
                        </div>
                        <div className="space-y-1 text-xs text-zinc-400">
                             <p>👤 {app.profiles?.full_name}</p>
                             <p>🕒 {formatTime(app.date)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* --- O MODAL DE GERENCIAMENTO (Centralizado na Tela) --- */}
            {isModalOpen && app.services && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                        
                        {/* Botão Fechar */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
                            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        {/* Cabeçalho do Modal */}
                        <div className="bg-zinc-900/50 p-6 border-b border-zinc-800">
                            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                Gerenciar Agendamento
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">
                                O que você deseja fazer com este horário?
                            </p>
                        </div>

                        {/* Corpo com Detalhes */}
                        <div className="p-6 space-y-4">
                            <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500 text-xs font-bold uppercase">Serviço</span>
                                    <span className="text-amber-500 font-bold flex items-center gap-2">
                                        <Scissors size={14} /> {app.services.name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500 text-xs font-bold uppercase">Cliente/Profissional</span>
                                    <span className="text-zinc-300 font-medium flex items-center gap-2">
                                        <User size={14} /> {app.profiles?.full_name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500 text-xs font-bold uppercase">Data e Hora</span>
                                    <span className="text-zinc-300 font-medium flex items-center gap-2">
                                        <CalendarIcon size={14} /> 
                                        {format(new Date(app.date), "dd 'de' MMM", { locale: ptBR })} às {formatTime(app.date)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-zinc-800 pt-3 mt-2">
                                    <span className="text-zinc-500 text-xs font-bold uppercase">Valor</span>
                                    <span className="text-green-500 font-bold text-lg flex items-center gap-1">
                                        <DollarSign size={16} /> {formatCurrency(app.services.price)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Rodapé com Ações */}
                        <div className="p-6 pt-0 flex gap-3">
                            {/* Botão EDITAR */}
                            <Link 
                                href={`/agendamentos/editar/${app.id}`}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700"
                            >
                                <Edit size={18} />
                                Editar
                            </Link>

                            {/* Botão EXCLUIR */}
                            <button 
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 hover:border-red-500 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 size={18} />}
                                {isDeleting ? 'Cancelando...' : 'Cancelar'}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}