'use client'

import { useState } from 'react'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, isBefore, startOfDay, isToday
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarPickerProps {
  selectedDate: string | undefined
  onSelect: (date: string) => void
}

export function CalendarPicker({ selectedDate, onSelect }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const today = startOfDay(new Date()) // Hoje zerado (00:00)

  // Navegação
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  // Cálculos da Grade
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 select-none w-full">
      
      {/* Cabeçalho (Mês e Ano + Setas) */}
      <div className="flex items-center justify-between mb-4">
        <button 
            onClick={prevMonth} 
            disabled={isBefore(monthStart, startOfMonth(today))} 
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        
        <span className="font-bold text-zinc-200 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>

        <button 
            onClick={nextMonth} 
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dias da Semana */}
      <div className="grid grid-cols-7 mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(day => (
          <div key={day} className="text-center text-xs font-bold text-zinc-600">
            {day}
          </div>
        ))}
      </div>

      {/* Grade de Dias */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const isPast = isBefore(day, today)
          const isSelected = selectedDate ? isSameDay(day, new Date(selectedDate + 'T12:00:00')) : false
          const isCurrentMonth = isSameMonth(day, currentMonth)

          return (
            <button
              key={day.toString()}
              onClick={() => onSelect(format(day, 'yyyy-MM-dd'))} 
              disabled={isPast}
              className={`
                h-9 w-full rounded-lg text-sm font-medium transition-all flex items-center justify-center relative
                ${isPast ? 'text-zinc-800 cursor-not-allowed' : 'hover:bg-zinc-800 text-zinc-300'}
                ${isSelected ? '!bg-amber-500 !text-zinc-950 font-bold shadow-lg shadow-amber-500/20' : ''}
                ${!isCurrentMonth && !isPast ? 'opacity-30' : ''}
                ${isToday(day) && !isSelected ? 'border border-amber-500/50 text-amber-500' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}