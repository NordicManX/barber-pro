'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Calendar, User, Scissors, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
// 👇 Importante: Importando o componente que acabamos de criar
import { CalendarPicker } from '@/components/CalendarPicker' 

type Service = { id: string; name: string; price: number; duration_minutes: number }
type Profile = { id: string; full_name: string; avatar_url: string | null }

export default function NewAppointmentPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Dados
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Profile[]>([])
  
  // Seleções
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedBarber, setSelectedBarber] = useState<Profile | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('') 
  const [selectedTime, setSelectedTime] = useState<string>('')

  // Lógica de Horários
  const [busySlots, setBusySlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // 1. Carrega Serviços e Barbeiros
  useEffect(() => {
    async function loadData() {
      const { data: servicesData } = await supabase.from('services').select('*').eq('active', true)
      const { data: profilesData } = await supabase.from('profiles').select('*').in('role', ['barber', 'admin'])
      
      if (servicesData) setServices(servicesData)
      if (profilesData) setBarbers(profilesData)
      setLoading(false)
    }
    loadData()
  }, [])

  // 2. Busca Horários Ocupados
  useEffect(() => {
    async function checkAvailability() {
      if (!selectedDate || !selectedBarber) return

      setLoadingSlots(true)
      const startOfDay = `${selectedDate}T00:00:00`
      const endOfDay = `${selectedDate}T23:59:59`

      const { data: appointments } = await supabase
        .from('appointments')
        .select('date')
        .eq('barber_id', selectedBarber.id)
        .gte('date', startOfDay)
        .lte('date', endOfDay)
        .neq('status', 'canceled')

      if (appointments) {
        const times = appointments.map(app => {
            const date = new Date(app.date)
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        })
        setBusySlots(times)
      } else {
        setBusySlots([])
      }
      setLoadingSlots(false)
    }
    checkAvailability()
  }, [selectedDate, selectedBarber])

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ]

  const handleBooking = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.warning('Preencha todos os campos.')
      return
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não logado')

      const finalDateTime = new Date(`${selectedDate}T${selectedTime}:00`)

      const { error } = await supabase.from('appointments').insert({
          user_id: user.id,
          service_id: selectedService.id,
          barber_id: selectedBarber.id,
          date: finalDateTime.toISOString(),
          status: 'confirmed'
        })

      if (error) throw error

      toast.success('Agendamento Confirmado!')
      router.push('/agendamentos')

    } catch (error) {
      console.error(error)
      toast.error('Erro ao agendar.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-amber-500"/></div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Novo Agendamento</h1>
        <p className="text-zinc-400">Monte seu estilo em poucos passos.</p>
      </div>

      {/* 1. SERVIÇO */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <div className="bg-amber-500/10 p-2 rounded text-amber-500"><Scissors size={18} /></div>
            1. Escolha o Serviço
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map(service => (
                <div 
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center group
                        ${selectedService?.id === service.id 
                            ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500' 
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                >
                    <div>
                        <h3 className={`font-bold ${selectedService?.id === service.id ? 'text-amber-500' : 'text-zinc-100'}`}>
                            {service.name}
                        </h3>
                        <p className="text-zinc-500 text-sm">{service.duration_minutes} minutos</p>
                    </div>
                    <span className="font-semibold text-zinc-300">{formatMoney(service.price)}</span>
                </div>
            ))}
        </div>
      </section>

      {/* 2. PROFISSIONAL */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <div className="bg-amber-500/10 p-2 rounded text-amber-500"><User size={18} /></div>
            2. Escolha o Profissional
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
            {barbers.map(barber => (
                <div 
                    key={barber.id}
                    onClick={() => {
                        setSelectedBarber(barber)
                        setSelectedTime('') 
                    }}
                    className={`min-w-[140px] p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center gap-2
                        ${selectedBarber?.id === barber.id 
                            ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500' 
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                >
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-lg text-zinc-400 border border-zinc-700 overflow-hidden relative">
                        {barber.avatar_url ? (
                           <img src={barber.avatar_url} alt={barber.full_name} className="w-full h-full object-cover"/> 
                        ) : (
                           barber.full_name?.charAt(0)
                        )}
                    </div>
                    <span className={`text-sm font-medium text-center truncate w-full ${selectedBarber?.id === barber.id ? 'text-amber-500' : 'text-zinc-300'}`}>
                        {barber.full_name.split(' ')[0]}
                    </span>
                </div>
            ))}
        </div>
      </section>

      {/* 3. DATA E HORA (LAYOUT AJUSTADO: ESQUERDA CALENDÁRIO, DIREITA HORÁRIOS) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <div className="bg-amber-500/10 p-2 rounded text-amber-500"><Calendar size={18} /></div>
            3. Data e Hora
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* ESQUERDA: O NOVO CALENDÁRIO VISUAL */}
            <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 mb-2">Selecione o Dia</label>
                
                {/* 👇 AQUI ESTÁ A MUDANÇA: Substituímos o <input> pelo componente */}
                <CalendarPicker 
                    selectedDate={selectedDate}
                    onSelect={(date) => {
                        setSelectedDate(date)
                        setSelectedTime('') 
                    }}
                />

                {!selectedBarber && (
                    <p className="text-xs text-amber-500 flex items-center gap-1 mt-3 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                        <AlertCircle size={14}/> Selecione um profissional para ver a agenda.
                    </p>
                )}
            </div>

            {/* DIREITA: GRID DE HORÁRIOS */}
            <div className={`space-y-2 transition-all duration-300 ${!selectedDate || !selectedBarber ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                 <label className="block text-xs font-bold text-zinc-500 uppercase ml-1 mb-2">Horários Disponíveis</label>
                 
                 <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl relative min-h-[300px]">
                    
                    {loadingSlots && (
                        <div className="absolute inset-0 bg-zinc-900/80 z-20 flex items-center justify-center rounded-xl backdrop-blur-sm">
                            <Loader2 className="animate-spin text-amber-500 w-8 h-8" />
                        </div>
                    )}

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {timeSlots.map(time => {
                            const isBusy = busySlots.includes(time)
                            return (
                                <button
                                    key={time}
                                    onClick={() => setSelectedTime(time)}
                                    disabled={isBusy}
                                    className={`py-2 text-sm rounded-lg border transition-all font-medium
                                        ${isBusy 
                                            ? 'bg-zinc-950 border-zinc-800 text-zinc-700 cursor-not-allowed line-through' 
                                            : selectedTime === time 
                                                ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold shadow-lg shadow-amber-500/20 transform scale-105' 
                                                : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white'
                                        }`}
                                >
                                    {time}
                                </button>
                            )
                        })}
                    </div>
                 </div>
            </div>
        </div>
      </section>

      {/* BOTÃO DE CONFIRMAR */}
      <div className="pt-6 border-t border-zinc-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-zinc-400 text-sm">
                Total estimado: <span className="text-xl font-bold text-amber-500 ml-1">{selectedService ? formatMoney(selectedService.price) : 'R$ 0,00'}</span>
            </div>

            <button 
                onClick={handleBooking}
                disabled={submitting || !selectedService || !selectedBarber || !selectedDate || !selectedTime}
                className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-black py-4 px-12 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wide shadow-lg shadow-amber-500/20"
            >
                {submitting ? <Loader2 className="animate-spin" /> : <>Confirmar Agendamento <CheckCircle2 size={20} /></>}
            </button>
        </div>
      </div>

    </div>
  )
}