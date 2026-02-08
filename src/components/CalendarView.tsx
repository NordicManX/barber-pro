'use client'

import { useState, useEffect } from 'react'
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameDay, isToday, parseISO, addMonths, subMonths 
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, User, X, Calendar as CalendarIcon, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Tipagem (deve bater com o que vem da page.tsx)
type Appointment = {
  id: string
  date: string
  status: string
  profiles: { full_name: string }
  services?: { name: string, price: number } | null
}

interface CalendarViewProps {
  appointments: Appointment[]
  userRole: string
}

export function CalendarView({ appointments: initialAppointments, userRole }: CalendarViewProps) {
  const supabase = createClient()
  const router = useRouter()
  
  // ESTADO LOCAL (Para atualização imediata)
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  
  // Sincroniza se o pai mandar dados novos
  useEffect(() => {
    setAppointments(initialAppointments)
  }, [initialAppointments])

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  
  // Modais
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [canceling, setCanceling] = useState(false)

  // Geração do Calendário
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  })
  
  const startDay = startOfMonth(currentDate).getDay()
  const emptyDays = Array(startDay).fill(null)

  // AÇÕES
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const handleOpenDetails = (app: Appointment) => {
    setSelectedAppointment(app)
    setIsDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
    setIsCancelConfirmOpen(false)
    setTimeout(() => setSelectedAppointment(null), 300)
  }

  // --- A MÁGICA DO CANCELAMENTO ACONTECE AQUI ---
  const handleConfirmCancel = async () => {
    if (!selectedAppointment) return

    setCanceling(true)
    try {
      // 1. Atualiza no Banco
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'canceled' })
        .eq('id', selectedAppointment.id)

      if (error) throw error

      // 2. ATUALIZAÇÃO VISUAL IMEDIATA (Remove da lista local)
      setAppointments((prev) => prev.filter(a => a.id !== selectedAppointment.id))
      
      toast.success('Agendamento cancelado com sucesso.')
      
      // 3. Fecha tudo
      handleCloseDetails()
      
      // 4. Atualiza os dados do servidor em background
      router.refresh()

    } catch (error) {
      console.error(error)
      toast.error('Erro ao cancelar agendamento.')
    } finally {
      setCanceling(false)
    }
  }

  const handleRemarcar = () => {
     if(selectedAppointment) {
         router.push(`/agendamentos/editar/${selectedAppointment.id}`)
     }
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6">
      
      {/* Cabeçalho do Calendário */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold capitalize text-zinc-100 flex items-center gap-2">
           <CalendarIcon className="text-amber-500" />
           {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-1">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* GRID DO CALENDÁRIO */}
      <div className="grid grid-cols-7 gap-px bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-800 flex-1">
        
        {/* Dias da Semana */}
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="bg-zinc-900 p-2 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
            {day}
          </div>
        ))}

        {/* Dias Vazios (início do mês) */}
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="bg-zinc-900/50 min-h-[100px]" />
        ))}

        {/* Dias do Mês */}
        {daysInMonth.map(day => {
          const dayAppointments = appointments.filter(app => isSameDay(parseISO(app.date), day))
          const isTodayDate = isToday(day)

          return (
            <div key={day.toISOString()} className={`bg-zinc-900 p-2 min-h-[100px] hover:bg-zinc-800/50 transition-colors relative group border-t border-zinc-800/50`}>
              <span className={`text-sm font-bold block mb-2 ${isTodayDate ? 'text-amber-500' : 'text-zinc-400'}`}>
                {format(day, 'd')}
              </span>
              
              {/* Lista de Agendamentos do Dia */}
              <div className="space-y-1">
                {dayAppointments.map(app => (
                  <button
                    key={app.id}
                    onClick={() => handleOpenDetails(app)}
                    className="w-full text-left px-2 py-1.5 rounded bg-zinc-800 border border-zinc-700/50 hover:border-amber-500/50 hover:bg-zinc-700 transition-all group/card overflow-hidden"
                  >
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-[10px] font-bold text-zinc-300 truncate">
                            {format(parseISO(app.date), 'HH:mm')}
                        </span>
                        <span className="text-[10px] text-zinc-500 truncate group-hover/card:text-zinc-300">
                             {app.profiles.full_name}
                        </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ======================================================= */}
      {/* MODAL DE DETALHES */}
      {/* ======================================================= */}
      {isDetailsOpen && selectedAppointment && !isCancelConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="p-4 flex items-center justify-between border-b border-zinc-800">
                <div>
                    <h3 className="font-bold text-lg text-white">Agendamento</h3>
                    <p className="text-xs text-zinc-500">Detalhes do horário marcado.</p>
                </div>
                <button onClick={handleCloseDetails} className="text-zinc-500 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {/* Conteúdo Modal */}
            <div className="p-6 space-y-4">
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                    <h4 className="text-amber-500 font-bold text-lg mb-4 flex justify-between">
                         {selectedAppointment.services?.name || 'Corte'}
                         <span className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded border border-green-500/20 h-fit">
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedAppointment.services?.price || 0)}
                         </span>
                    </h4>
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-zinc-300 text-sm">
                            <User size={16} className="text-zinc-500" />
                            <span>{selectedAppointment.profiles.full_name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-300 text-sm">
                            <Clock size={16} className="text-zinc-500" />
                            <span className="capitalize">
                                {format(parseISO(selectedAppointment.date), "dd 'de' MMM. 'às' HH:mm", { locale: ptBR })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button 
                        onClick={handleRemarcar}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <CalendarIcon size={18} /> Remarcar
                    </button>
                    <button 
                        onClick={() => setIsCancelConfirmOpen(true)}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                       <X size={18} /> Cancelar
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO */}
      {/* ======================================================= */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <AlertTriangle className="text-red-500 w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Cancelar Horário?</h3>
                <p className="text-zinc-400 text-sm mb-6">
                    Você vai remover o agendamento de <br/>
                    <strong className="text-zinc-200">{selectedAppointment?.profiles.full_name}</strong>.
                </p>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsCancelConfirmOpen(false)}
                        disabled={canceling}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                    >
                        Voltar
                    </button>
                    <button 
                        onClick={handleConfirmCancel}
                        disabled={canceling}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {canceling ? <Loader2 className="animate-spin w-5 h-5"/> : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  )
}