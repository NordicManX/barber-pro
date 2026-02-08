'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  User, Scissors, CheckCircle2, Loader2, ArrowLeft, Clock, Save, 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight 
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameDay, isBefore, startOfDay, parseISO 
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

type Service = { id: string; name: string; price: number; duration_minutes: number }
type Profile = { id: string; full_name: string; avatar_url: string | null }

export default function EditAppointmentPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const appointmentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Dados
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Profile[]>([])
  
  // Seleções
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedBarber, setSelectedBarber] = useState<Profile | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null) 
  const [selectedTime, setSelectedTime] = useState<string>('')

  // Controle de Horários
  const [busySlots, setBusySlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  // Controle do Calendário Interno
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // 1. CARREGAR DADOS
  useEffect(() => {
    async function loadData() {
      try {
        const { data: servicesData } = await supabase.from('services').select('*').eq('active', true)
        const { data: profilesData } = await supabase.from('profiles').select('*').in('role', ['barber', 'admin'])
        
        if (servicesData) setServices(servicesData)
        if (profilesData) setBarbers(profilesData)

        const { data: appointment, error } = await supabase
            .from('appointments')
            .select(`*, services (*), barber:profiles!barber_id (*)`)
            .eq('id', appointmentId)
            .single()

        if (error || !appointment) {
            toast.error("Agendamento não encontrado.")
            router.push('/agendamentos')
            return
        }

        // @ts-ignore
        const serviceData = Array.isArray(appointment.services) ? appointment.services[0] : appointment.services
        // @ts-ignore
        const barberData = Array.isArray(appointment.barber) ? appointment.barber[0] : appointment.barber
        
        const dateObj = new Date(appointment.date) 
        
        setSelectedService(serviceData)
        setSelectedBarber(barberData)
        setSelectedDate(dateObj)
        setCurrentMonth(dateObj) 
        
        const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        setSelectedTime(timeStr)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [appointmentId, router])

  // 2. BUSCAR DISPONIBILIDADE
  useEffect(() => {
    async function checkAvailability() {
      if (!selectedDate || !selectedBarber) return

      setLoadingSlots(true)
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const startOfDayStr = `${dateStr}T00:00:00`
      const endOfDayStr = `${dateStr}T23:59:59`

      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, date')
        .eq('barber_id', selectedBarber.id)
        .gte('date', startOfDayStr)
        .lte('date', endOfDayStr)
        .neq('status', 'canceled')

      if (appointments) {
        const times = appointments
            .filter(app => app.id !== appointmentId) // Ignora o próprio agendamento atual
            .map(app => {
                const d = new Date(app.date)
                return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            })
        setBusySlots(times)
      } else {
        setBusySlots([])
      }
      setLoadingSlots(false)
    }
    checkAvailability()
  }, [selectedDate, selectedBarber, appointmentId])

  const calendarDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })
  const startEmptyDays = Array.from({ length: startOfMonth(currentMonth).getDay() })

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ]

  const handleUpdate = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.warning('Preencha todos os campos.')
      return
    }

    setSubmitting(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const finalDateTime = new Date(`${dateStr}T${selectedTime}:00`)

      const { error } = await supabase
        .from('appointments')
        .update({
          service_id: selectedService.id,
          barber_id: selectedBarber.id,
          date: finalDateTime.toISOString(),
        })
        .eq('id', appointmentId)

      if (error) throw error

      toast.success('Agendamento Atualizado!')
      router.push('/agendamentos')
      router.refresh()

    } catch (error) {
      console.error(error)
      toast.error('Erro ao atualizar.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  if (loading) return <div className="flex flex-col items-center justify-center h-[50vh] gap-4"><Loader2 className="animate-spin text-amber-500 w-10 h-10"/><p className="text-zinc-500">Carregando dados...</p></div>

  return (
    // ESTRUTURA HÍBRIDA (Igual ao Novo Agendamento)
    <div className="w-full max-w-5xl mx-auto pb-40">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/agendamentos" className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors">
            <ArrowLeft size={24} />
        </Link>
        <div>
            <h1 className="text-2xl font-bold text-zinc-100 leading-none">Remarcar</h1>
            <p className="text-sm text-zinc-500">Altere os detalhes do serviço.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA ESQUERDA */}
        <div className="md:col-span-7 space-y-8">
            
            {/* 1. SERVIÇO */}
            <section className="space-y-3">
                <h2 className="text-amber-500 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <Scissors size={16} /> 1. Serviço
                </h2>
                <div className="grid grid-cols-1 gap-3">
                    {services.map(service => (
                        <button 
                            key={service.id}
                            onClick={() => setSelectedService(service)}
                            className={`w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group
                                ${selectedService?.id === service.id 
                                    ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500' 
                                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                                }`}
                        >
                            <div className="flex justify-between items-center z-10 relative">
                                <h3 className={`font-bold ${selectedService?.id === service.id ? 'text-amber-500' : 'text-zinc-100'}`}>
                                    {service.name}
                                </h3>
                                <span className="font-semibold text-zinc-300">{formatMoney(service.price)}</span>
                            </div>
                            <p className="text-zinc-500 text-xs mt-1">{service.duration_minutes} min</p>
                        </button>
                    ))}
                </div>
            </section>

            {/* 2. PROFISSIONAL */}
            <section className="space-y-3">
                <h2 className="text-amber-500 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <User size={16} /> 2. Profissional
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    {barbers.map(barber => (
                        <button 
                            key={barber.id}
                            onClick={() => setSelectedBarber(barber)}
                            className={`flex-shrink-0 min-w-[100px] p-3 rounded-xl border transition-all flex flex-col items-center gap-2
                                ${selectedBarber?.id === barber.id 
                                    ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500' 
                                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                                }`}
                        >
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-lg text-zinc-400 border border-zinc-700 overflow-hidden">
                                {barber.avatar_url ? (
                                    <img src={barber.avatar_url} className="w-full h-full object-cover"/> 
                                ) : (
                                    barber.full_name?.charAt(0)
                                )}
                            </div>
                            <span className={`text-xs font-bold truncate w-full text-center ${selectedBarber?.id === barber.id ? 'text-amber-500' : 'text-zinc-300'}`}>
                                {barber.full_name.split(' ')[0]}
                            </span>
                        </button>
                    ))}
                </div>
            </section>
        </div>

        {/* COLUNA DIREITA */}
        <div className="md:col-span-5 space-y-8 sticky top-4">
            
            {/* 3. DATA E HORA */}
            <section className="space-y-3">
                <h2 className="text-amber-500 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <CalendarIcon size={16} /> 3. Data e Hora
                </h2>
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-full">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400"><ChevronLeft size={20} /></button>
                        <span className="font-bold capitalize text-zinc-200">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400"><ChevronRight size={20} /></button>
                    </div>
                    <div className="grid grid-cols-7 text-center text-xs text-zinc-500 mb-2 font-bold">
                        {['D','S','T','Q','Q','S','S'].map((d, i) => <span key={i}>{d}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {startEmptyDays.map((_, i) => <div key={`empty-${i}`} />)}
                        {calendarDays.map(day => {
                            const isSelected = selectedDate && isSameDay(day, selectedDate)
                            const isPast = isBefore(day, startOfDay(new Date()))
                            return (
                                <button
                                    key={day.toISOString()}
                                    disabled={isPast}
                                    onClick={() => setSelectedDate(day)}
                                    className={`
                                        w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                                        ${isSelected ? 'bg-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20' : 'text-zinc-300 hover:bg-zinc-800'}
                                        ${isPast ? 'opacity-20 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {format(day, 'd')}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className={`space-y-2 transition-all duration-300 ${!selectedDate || !selectedBarber ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 flex items-center gap-2">
                        <Clock size={14} /> Horários
                    </label>
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl relative min-h-[100px] w-full">
                        {loadingSlots && (
                            <div className="absolute inset-0 bg-zinc-900/80 z-20 flex items-center justify-center rounded-2xl backdrop-blur-sm">
                                <Loader2 className="animate-spin text-amber-500 w-8 h-8" />
                            </div>
                        )}
                        <div className="grid grid-cols-4 gap-2">
                            {timeSlots.map(time => {
                                const isBusy = busySlots.includes(time)
                                return (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time)}
                                        disabled={isBusy}
                                        className={`py-2 text-xs rounded-lg border transition-all font-bold w-full
                                            ${isBusy 
                                                ? 'bg-zinc-950 border-zinc-900 text-zinc-700 cursor-not-allowed line-through opacity-50' 
                                                : selectedTime === time 
                                                    ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-lg shadow-amber-500/20 scale-105' 
                                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                                            }`}
                                    >
                                        {time}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* RESUMO E BOTÃO DE SALVAR */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-zinc-400 font-bold uppercase text-xs tracking-wider">Total</span>
                    <span className="text-2xl font-bold text-green-500">{selectedService ? formatMoney(selectedService.price) : 'R$ 0,00'}</span>
                </div>
                
                <button 
                    onClick={handleUpdate}
                    disabled={submitting || !selectedService || !selectedBarber || !selectedDate || !selectedTime}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black py-4 px-6 rounded-xl uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? <Loader2 className="animate-spin" /> : <>Salvar Alterações <Save size={20} /></>}
                </button>
            </div>

        </div>
      </div>
    </div>
  )
}