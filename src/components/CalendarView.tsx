'use client'

import { useState } from 'react'
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CalendarAppointmentSlot } from './CalendarAppointmentSlot'

// Tipagem
interface Appointment {
  id: string
  date: string
  status: string
  services: { name: string; price: number; duration_minutes: number } | null
  profiles: { full_name: string } | null
}

interface CalendarViewProps {
  appointments: Appointment[]
}

export function CalendarView({ appointments }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const firstDayOfMonth = startOfMonth(currentDate)
  const lastDayOfMonth = endOfMonth(currentDate)
  const startDate = startOfWeek(firstDayOfMonth)
  const endDate = endOfWeek(lastDayOfMonth)
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const jumpToToday = () => setCurrentDate(new Date())

  return (
    // 1. ALTERAÇÃO AQUI: Removi 'h-[600px]' e 'overflow-hidden'
    // Agora o calendário cresce o quanto precisar e não corta os popups
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl flex flex-col">
      
      {/* CABEÇALHO */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/50 rounded-t-xl">
        <h2 className="text-xl font-bold text-zinc-100 capitalize flex items-center gap-2">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        
        <div className="flex items-center gap-2">
            <button onClick={jumpToToday} className="text-xs font-bold text-zinc-400 hover:text-white mr-2 px-3 py-1 rounded hover:bg-zinc-800 transition-colors">
                Hoje
            </button>
            <button onClick={prevMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-300 transition-colors">
                <ChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-300 transition-colors">
                <ChevronRight size={20} />
            </button>
        </div>
      </div>

      {/* DIAS DA SEMANA */}
      <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-950/30">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((weekDay) => (
          <div key={weekDay} className="py-2 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
            {weekDay}
          </div>
        ))}
      </div>

      {/* GRANDE GRADE */}
      {/* 2. ALTERAÇÃO AQUI: Removi 'overflow-y-auto' e adicionei 'min-h-[500px]'
         Isso evita barra de rolagem interna que corta o card */}
      <div className="grid grid-cols-7 auto-rows-fr min-h-[500px]">
        {calendarDays.map((day) => {
            const dayAppointments = appointments.filter(app => 
                isSameDay(new Date(app.date), day)
            )
            const isCurrentMonth = isSameMonth(day, currentDate)

            return (
                <div 
                    key={day.toString()} 
                    className={`
                        border-r border-b border-zinc-800/50 p-2 transition-colors relative min-h-[120px]
                        ${!isCurrentMonth ? 'bg-zinc-950/80 text-zinc-700' : 'bg-zinc-900/50 hover:bg-zinc-900'}
                    `}
                >
                    {/* Número do Dia */}
                    <div className="flex justify-between items-start mb-2">
                        <span className={`
                            text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full
                            ${isToday(day) ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20' : ''}
                        `}>
                            {format(day, 'd')}
                        </span>
                    </div>

                    {/* Lista de Agendamentos */}
                    <div className="space-y-1 relative z-10">
                        {dayAppointments.map(app => (
                            <CalendarAppointmentSlot key={app.id} app={app} />
                        ))}
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  )
}