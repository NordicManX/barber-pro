'use client'

import { useState, useEffect } from 'react'
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameDay, isToday, parseISO, addMonths, subMonths 
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  ChevronLeft, ChevronRight, Clock, User, X, 
  Calendar as CalendarIcon, AlertTriangle, Loader2, Scissors 
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Tipagem
type Appointment = {
  id: string
  date: string
  status: string
  profiles: { full_name: string }
  services?: { name: string, price: number, duration_minutes?: number } | null
}

interface CalendarViewProps {
  appointments: Appointment[]
  userRole: string
}

export function CalendarView({ appointments: initialAppointments, userRole }: CalendarViewProps) {
  const supabase = createClient()
  const router = useRouter()
  
  // ESTADOS
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // Modais e Seleção
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [canceling, setCanceling] = useState(false)

  // Sincroniza dados novos vindos do pai
  useEffect(() => {
    setAppointments(initialAppointments)
  }, [initialAppointments])

  // GERAÇÃO DO CALENDÁRIO
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  })
  
  const startDay = startOfMonth(currentDate).getDay()
  const emptyDays = Array(startDay).fill(null)

  // FILTROS
  const getAppointmentsOnDate = (date: Date) => {
    return appointments.filter(app => isSameDay(parseISO(app.date), date))
  }

  const selectedDayAppointments = appointments
    .filter(app => isSameDay(parseISO(app.date), selectedDate))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

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

  const handleRemarcar = () => {
     if(selectedAppointment) {
         router.push(`/agendamentos/editar/${selectedAppointment.id}`)
     }
  }

  const handleConfirmCancel = async () => {
    if (!selectedAppointment) return

    setCanceling(true)
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'canceled' })
        .eq('id', selectedAppointment.id)

      if (error) throw error

      setAppointments((prev) => prev.filter(a => a.id !== selectedAppointment.id))
      toast.success('Agendamento cancelado.')
      handleCloseDetails()
      router.refresh()

    } catch (error) {
      console.error(error)
      toast.error('Erro ao cancelar.')
    } finally {
      setCanceling(false)
    }
  }

  return (
    // AQUI ESTÁ A MUDANÇA: 'mx-3 md:mx-0' para dar o espaçamento no mobile
    <div className="flex flex-col lg:flex-row h-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 mx-3 md:mx-0 shadow-xl">
      
      {/* LADO ESQUERDO: CALENDÁRIO */}
      <div className="p-4 lg:w-7/12 border-b lg:border-b-0 lg:border-r border-zinc-800">
        
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-lg font-bold capitalize text-zinc-100 flex items-center gap-2">
             <CalendarIcon className="text-amber-500 w-5 h-5" />
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

        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-zinc-500 uppercase py-2">
              {day}
            </div>
          ))}

          {emptyDays.map((_, i) => <div key={`empty-${i}`} />)}

          {daysInMonth.map(day => {
            const isSelected = isSameDay(day, selectedDate)
            const isTodayDate = isToday(day)
            
            // Lógica das Bolinhas
            const dayApps = getAppointmentsOnDate(day)
            const count = dayApps.length
            const hasApp = count > 0

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200 border
                  
                  ${isSelected 
                    ? 'border-amber-500 ring-1 ring-amber-500 bg-zinc-800 z-10' 
                    : 'border-transparent hover:bg-zinc-800'
                  }

                  ${!isSelected && hasApp 
                    ? 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_-4px_rgba(245,158,11,0.2)]' 
                    : ''
                  }

                  ${!isSelected && !hasApp ? 'text-zinc-400' : ''}
                `}
              >
                <span className={`text-sm mb-0.5 ${isTodayDate && !isSelected ? 'text-amber-500 font-bold underline' : ''} ${hasApp ? 'font-bold text-zinc-200' : ''}`}>
                  {format(day, 'd')}
                </span>
                
                {/* BOLINHAS MÚLTIPLAS */}
                {hasApp && (
                   <div className="flex gap-0.5 mt-0.5 h-1.5 items-end">
                     {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`
                            w-1 h-1 rounded-full 
                            ${isSelected ? 'bg-amber-500' : 'bg-amber-500/80'}
                          `} 
                        />
                     ))}
                     {count > 4 && <div className="w-0.5 h-0.5 bg-amber-500/50 rounded-full self-center ml-px" />}
                   </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* LADO DIREITO: LISTA */}
      <div className="flex-1 bg-zinc-950/50 flex flex-col min-h-[300px]">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
           <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              Agendamentos
              <span className="text-zinc-600 normal-case font-normal text-xs">
                 {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </span>
           </h3>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
           {selectedDayAppointments.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-zinc-600 py-10 gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                   <CalendarIcon size={20} className="opacity-50"/>
                </div>
                <p className="text-sm">Nada agendado para este dia.</p>
             </div>
           ) : (
             selectedDayAppointments.map(app => (
               <button
                 key={app.id}
                 onClick={() => handleOpenDetails(app)}
                 className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-4 hover:border-amber-500/50 hover:bg-zinc-800 transition-all group text-left"
               >
                  <div className="bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800 group-hover:border-zinc-700 min-w-[60px] text-center">
                     <span className="block text-amber-500 font-bold text-sm">
                        {format(parseISO(app.date), 'HH:mm')}
                     </span>
                  </div>

                  <div className="flex-1 min-w-0">
                     <h4 className="font-bold text-zinc-200 truncate group-hover:text-amber-500 transition-colors">
                        {app.profiles.full_name}
                     </h4>
                     <p className="text-xs text-zinc-500 truncate mt-0.5 flex items-center gap-1">
                        <Scissors size={10} />
                        {app.services?.name || 'Serviço Personalizado'}
                     </p>
                  </div>
               </button>
             ))
           )}
        </div>
      </div>

      {/* MODAL DETALHES */}
      {isDetailsOpen && selectedAppointment && !isCancelConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-zinc-800">
                <div>
                    <h3 className="font-bold text-lg text-white">Agendamento</h3>
                    <p className="text-xs text-zinc-500">Detalhes do horário marcado.</p>
                </div>
                <button onClick={handleCloseDetails} className="text-zinc-500 hover:text-white p-2">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 space-y-4">
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                    <h4 className="text-amber-500 font-bold text-lg mb-4 flex justify-between items-center">
                          {selectedAppointment.services?.name || 'Corte'}
                          <span className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded border border-green-500/20 font-mono">
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

      {/* MODAL CANCELAR */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <AlertTriangle className="text-red-500 w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Cancelar Horário?</h3>
                <p className="text-zinc-400 text-sm mb-6">
                    Você tem certeza que deseja cancelar o agendamento de <strong className="text-zinc-200">{selectedAppointment?.profiles.full_name}</strong>?
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