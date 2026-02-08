'use client'

import { useState, useRef, useLayoutEffect } from 'react'
import { 
    Clock, User, DollarSign, Calendar as CalendarIcon, 
    Scissors, AlertCircle, Trash2, X, CalendarClock // <--- Novo ícone
} from 'lucide-react'
import Link from 'next/link'

// Tipagem
interface Appointment {
    id: string
    date: string
    status: string
    services: { name: string; price: number; duration_minutes: number } | null
    profiles: { full_name: string } | null
}

interface SlotProps {
    app: Appointment
    userRole: string 
    onDeleteRequest: () => void 
}

export function CalendarAppointmentSlot({ app, userRole, onDeleteRequest }: SlotProps) {
    
    // Estados
    const [isHovered, setIsHovered] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false) 
    
    // Posicionamento do Popover
    const [verticalPos, setVerticalPos] = useState<'top' | 'bottom'>('top')
    const [horizontalAlign, setHorizontalAlign] = useState<'left' | 'right'>('left')
    const triggerRef = useRef<HTMLDivElement>(null)

    // Formatação
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    }

    // Lógica de Posição
    useLayoutEffect(() => {
        if (isHovered && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            if (rect.top < 230) setVerticalPos('bottom');
            else setVerticalPos('top');
            
            if (window.innerWidth - rect.right < 280) setHorizontalAlign('right');
            else setHorizontalAlign('left');
        }
    }, [isHovered]) 

    return (
        <>
            {/* O SLOT NA AGENDA (Clicável) */}
            <div 
                ref={triggerRef}
                className="relative group z-10" 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={(e) => {
                    e.stopPropagation(); 
                    setIsModalOpen(true);
                }}
            >
                {/* Etiqueta Visual */}
                <div className={`
                    text-[10px] md:text-xs border rounded px-1.5 py-1 truncate cursor-pointer transition-all relative select-none flex items-center gap-1
                    ${isHovered 
                        ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold shadow-lg shadow-amber-500/20 scale-[1.02]' 
                        : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                    }
                    ${!app.services ? 'opacity-50 border-red-900/50 bg-red-900/10 text-red-400' : ''}
                `}>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isHovered ? 'bg-zinc-950' : 'bg-amber-500'}`} />
                    
                    {app.services ? (
                        <div className="flex items-center gap-1 truncate w-full">
                            <span className="font-mono opacity-80">{formatTime(app.date)}</span>
                            <span className="truncate flex-1">{app.profiles?.full_name || 'Cliente'}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 truncate w-full">
                            <AlertCircle size={10} /> <span className="truncate">Cancelado</span>
                        </div>
                    )}
                </div>

                {/* POPOVER HOVER */}
                {isHovered && !isModalOpen && app.services && (
                    <div className={`absolute w-64 bg-zinc-950 border border-zinc-700 rounded-xl shadow-2xl p-3 z-[9999] animate-in fade-in zoom-in-95 duration-150 pointer-events-none
                        ${verticalPos === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
                        ${horizontalAlign === 'left' ? 'left-0' : 'right-0'}
                    `}>
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
                            <span className="text-amber-500 font-bold text-xs flex items-center gap-1">
                                <Scissors size={12}/> {app.services.name}
                            </span>
                            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">Ver detalhes</span>
                        </div>
                        <div className="space-y-1 text-xs text-zinc-400">
                             <p className="flex items-center gap-2"><User size={12}/> {app.profiles?.full_name}</p>
                             <p className="flex items-center gap-2"><Clock size={12}/> {formatTime(app.date)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODAL DE DETALHES --- */}
            {isModalOpen && app.services && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                        
                        {/* Cabeçalho */}
                        <div className="bg-zinc-900/50 p-4 border-b border-zinc-800 flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-bold text-zinc-100">Agendamento</h2>
                                <p className="text-xs text-zinc-500">Detalhes do horário marcado.</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Corpo */}
                        <div className="p-5 space-y-4">
                            <div className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800/50 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-amber-500 font-bold text-lg">{app.services.name}</span>
                                    <span className="text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded text-xs border border-green-500/20">
                                        {formatCurrency(app.services.price)}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm text-zinc-400 pt-2 border-t border-zinc-800/50">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-zinc-500"/> 
                                        <span className="text-zinc-300">{app.profiles?.full_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon size={14} className="text-zinc-500"/> 
                                        <span>{formatDate(app.date)} às <span className="text-zinc-200 font-bold">{formatTime(app.date)}</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rodapé com Ações */}
                        <div className="p-5 pt-0 flex gap-3">
                            {/* Botão REMARCAR (Mudamos de 'Editar' para 'Remarcar' visualmente) */}
                            <Link 
                                href={`/agendamentos/editar/${app.id}`}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 text-sm"
                            >
                                <CalendarClock size={18} /> 
                                Remarcar
                            </Link>

                            {/* Botão CANCELAR */}
                            <button 
                                onClick={() => {
                                    setIsModalOpen(false); 
                                    onDeleteRequest();     
                                }}
                                className="flex-1 bg-zinc-800 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 text-zinc-400 border border-zinc-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <Trash2 size={18} /> Cancelar
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}