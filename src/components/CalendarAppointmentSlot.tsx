'use client'

import { useState, useRef, useLayoutEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, User, DollarSign, Calendar as CalendarIcon, Scissors, AlertCircle } from 'lucide-react'

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
    const [isHovered, setIsHovered] = useState(false)
    
    // Estados para controlar ONDE o popover aparece
    const [verticalPos, setVerticalPos] = useState<'top' | 'bottom'>('top')
    const [horizontalAlign, setHorizontalAlign] = useState<'left' | 'right'>('left')
    
    const triggerRef = useRef<HTMLDivElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

    // useLayoutEffect roda ANTES de pintar na tela, evitando "piscadas"
    useLayoutEffect(() => {
        if (isHovered && triggerRef.current && popoverRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const popoverRect = popoverRef.current.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // --- CÁLCULO VERTICAL ---
            // Altura estimada do popover + um respiro
            const popoverHeight = popoverRect.height + 20; 
            
            // Se o espaço ACIMA do slot for menor que a altura do popover...
            if (triggerRect.top < popoverHeight) {
                 // ...joga para BAIXO.
                 setVerticalPos('bottom');
            } else {
                 // Caso contrário, tenta jogar para CIMA (padrão).
                 // Mas verifica se em cima não vai vazar a tela também (caso raro de tela muito pequena)
                 if (triggerRect.top - popoverHeight < 0) {
                    setVerticalPos('bottom'); // Força para baixo se não couber em cima de jeito nenhum
                 } else {
                    setVerticalPos('top');
                 }
            }

            // --- CÁLCULO HORIZONTAL (Resolve o scrollbar) ---
            // Largura do popover (w-64 = 256px) + margem de segurança
            const neededSpaceRight = 270; 
            const spaceOnRight = windowWidth - triggerRect.left;

            // Se o espaço que sobra na direita for menor que o necessário...
            if (spaceOnRight < neededSpaceRight) {
                // ...alinha à DIREITA (cresce para a esquerda, para dentro da tela)
                setHorizontalAlign('right');
            } else {
                // ...alinha à ESQUERDA (cresce para a direita, padrão)
                setHorizontalAlign('left');
            }
        }
    }, [isHovered]) // Roda toda vez que o mouse entra/sai

    return (
        // Adicionamos 'group' aqui para facilitar o controle do z-index
        <div 
            ref={triggerRef}
            className="relative group" 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* A Etiqueta */}
            <div className={`
                text-xs border rounded px-2 py-1 truncate cursor-pointer transition-all relative
                ${isHovered 
                    ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold z-30' 
                    : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:border-zinc-500 z-10'
                }
                ${app.services ? '' : 'opacity-50'} // Se serviço foi excluído, fica mais apagado
            `}>
                {app.services ? (
                    <>
                    <span className="mr-1 opacity-70">{formatTime(app.date)}</span>
                    {app.services.name}
                    </>
                ) : (
                    <div className="flex items-center gap-1 text-red-400">
                        <AlertCircle size={12} /> Serviço Excluído
                    </div>
                )}
            </div>

            {/* O POP-OVER (Agora com esteroides de posicionamento) */}
            {isHovered && app.services && (
                <div 
                    ref={popoverRef}
                    className={`absolute w-64 bg-zinc-950 border border-zinc-700 rounded-xl shadow-2xl p-4 z-[100] animate-in fade-in zoom-in-95 duration-150 cursor-default
                    
                    /* POSIÇÃO VERTICAL */
                    ${verticalPos === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}

                    /* POSIÇÃO HORIZONTAL */
                    ${horizontalAlign === 'left' ? 'left-0' : 'right-0'}
                    `}
                >
                    
                    {/* Setinha do Modal (Precisa acompanhar a posição) */}
                    <div className={`absolute w-3 h-3 bg-zinc-950 rotate-45
                        /* Vertical da seta */
                        ${verticalPos === 'top' ? '-bottom-1.5 border-r border-b border-zinc-700' : '-top-1.5 border-l border-t border-zinc-700'}
                        
                        /* Horizontal da seta (para não ficar no canto estranho) */
                        ${horizontalAlign === 'left' ? 'left-4' : 'right-4'}
                    `}></div>

                    <div className="relative z-20 space-y-3">
                        {/* Cabeçalho */}
                        <div className="border-b border-zinc-800 pb-2">
                            <h4 className="text-zinc-100 font-bold text-sm flex items-center gap-2 truncate">
                                <Scissors size={14} className="text-amber-500 flex-shrink-0"/>
                                <span className="truncate">{app.services.name}</span>
                            </h4>
                            <span className={`text-xs font-mono mt-1 block font-bold
                                ${app.status === 'confirmed' ? 'text-green-500' : 'text-zinc-500'}
                            `}>
                                ● {app.status === 'confirmed' ? 'Confirmado' : app.status}
                            </span>
                        </div>

                        {/* Detalhes */}
                        <div className="space-y-2 text-xs text-zinc-400">
                            <div className="flex items-center gap-2">
                                <CalendarIcon size={12} className="text-amber-500/70 flex-shrink-0" />
                                {format(new Date(app.date), "d 'de' MMMM", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={12} className="text-amber-500/70 flex-shrink-0" />
                                {formatTime(app.date)} - {app.services.duration_minutes} min
                            </div>
                            <div className="flex items-center gap-2">
                                <User size={12} className="text-amber-500/70 flex-shrink-0" />
                                <span className="truncate">{app.profiles?.full_name || 'Profissional Indefinido'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-200 font-bold bg-zinc-900 p-2 rounded-lg mt-3 border border-zinc-800">
                                <DollarSign size={14} className="text-amber-500 flex-shrink-0" />
                                <span className="text-lg">
                                    {formatCurrency(app.services.price)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}