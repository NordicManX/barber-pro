'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { format, addDays, isSameDay, startOfToday, isBefore, set, addMinutes, isAfter, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock, Scissors, User, CheckCircle2, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { sendAppointmentEmail } from '@/app/actions/send-appointment-email'

// --- TIPOS ---
type Service = {
    id: string
    name: string
    price: number
    duration_minutes: number
}

type Barber = {
    id: string
    full_name: string
    avatar_url: string | null
    role: string
}

type WorkingHour = {
    day_of_week: number
    opens_at: string
    closes_at: string
    is_closed: boolean
}

export default function NewAppointmentPage() {
    const supabase = createClient()
    const router = useRouter()

    // --- ESTADOS ---
    const [services, setServices] = useState<Service[]>([])
    const [barbers, setBarbers] = useState<Barber[]>([])
    const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]) // <--- NOVO
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Seleções
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    // Calendário
    const today = startOfToday()
    const [currentMonth, setCurrentMonth] = useState(today)

    // --- CARREGAR DADOS ---
    useEffect(() => {
        async function loadData() {
            setLoading(true)
            
            // 1. Serviços e Barbeiros (Igual antes)
            const p1 = supabase.from('services').select('*').order('price')
            const p2 = supabase.from('profiles').select('id, full_name, avatar_url, role').in('role', ['barber', 'admin']).order('full_name')
            
            // 2. NOVO: Buscar Horários de Funcionamento
            const p3 = supabase.from('working_hours').select('*')

            const [resServices, resBarbers, resHours] = await Promise.all([p1, p2, p3])

            if (resServices.data) setServices(resServices.data)
            if (resBarbers.data) setBarbers(resBarbers.data)
            if (resHours.data) setWorkingHours(resHours.data)

            setLoading(false)
        }
        loadData()
    }, [])

    // --- LÓGICA DE GERAR HORÁRIOS (O CORAÇÃO DO SISTEMA) ---
    const availableTimeSlots = useMemo(() => {
        if (workingHours.length === 0) return []

        const dayOfWeek = selectedDate.getDay() // 0 = Domingo, 1 = Segunda...
        const config = workingHours.find(w => w.day_of_week === dayOfWeek)

        // Se não tiver config ou estiver fechado
        if (!config || config.is_closed) return []

        const slots: string[] = []
        let currentTime = parse(config.opens_at, 'HH:mm:ss', selectedDate)
        const closeTime = parse(config.closes_at, 'HH:mm:ss', selectedDate)

        // Intervalo de cada slot (30 min)
        const interval = 30 

        while (isBefore(currentTime, closeTime)) {
            const timeString = format(currentTime, 'HH:mm')
            slots.push(timeString)
            currentTime = addMinutes(currentTime, interval)
        }

        return slots
    }, [selectedDate, workingHours])


    // --- HELPERS ---
    const daysInMonth = Array.from({ length: 35 }, (_, i) => {
        const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        const startDate = addDays(start, -start.getDay())
        return addDays(startDate, i)
    })

    const isTimeDisabled = (time: string) => {
        const now = new Date()
        const [hours, minutes] = time.split(':').map(Number)
        
        // Data/Hora do slot
        const slotDateTime = set(selectedDate, { hours, minutes, seconds: 0, milliseconds: 0 })

        // 1. Passado?
        if (isBefore(slotDateTime, now)) return true

        // 2. Futuro: Verificar se já está ocupado (Busy)
        // AQUI entraria a verificação se o barbeiro já tem agendamento
        // Por enquanto, deixamos apenas a verificação de passado.
        
        return false
    }

    const handleConfirm = async () => {
        if (!selectedService || !selectedBarber || !selectedTime) {
            toast.error("Preencha todos os campos!")
            return
        }
        setSubmitting(true)

        const [hours, minutes] = selectedTime.split(':').map(Number)
        const finalDate = set(selectedDate, { hours, minutes, seconds: 0, milliseconds: 0 })

        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !user.email) {
            toast.error("Faça login para continuar.")
            router.push('/login')
            return
        }

        // Tenta salvar
        const { error } = await supabase.from('appointments').insert({
            user_id: user.id,
            barber_id: selectedBarber.id,
            service_id: selectedService.id,
            date: finalDate.toISOString(),
            status: 'pending'
        })

        if (error) {
            console.error(error)
            toast.error("Erro ao agendar.")
        } else {
            // Envia Email (Sem travar se falhar)
            try {
                await sendAppointmentEmail({
                    clientName: "Cliente",
                    clientEmail: user.email,
                    barberName: selectedBarber.full_name,
                    serviceName: selectedService.name,
                    date: format(selectedDate, 'dd/MM/yyyy'),
                    time: selectedTime
                })
            } catch (e) { console.error("Email fail", e) }

            toast.success("Agendamento confirmado!")
            router.push('/area-cliente') // Mudei para área do cliente
        }
        setSubmitting(false)
    }

    if (loading) return <div className="flex h-screen items-center justify-center text-amber-500"><Loader2 className="animate-spin w-10 h-10" /></div>

    // Verifica se o dia selecionado está FECHADO
    const currentDayConfig = workingHours.find(w => w.day_of_week === selectedDate.getDay())
    const isClosedDay = currentDayConfig?.is_closed

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500 px-4 md:px-0">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-100">Novo Agendamento</h1>
                <p className="text-zinc-400">Escolha o serviço, profissional e horário ideal.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ESQUERDA: Serviços e Barbeiros */}
                <div className="lg:col-span-7 space-y-8">
                     {/* SELEÇÃO DE SERVIÇO */}
                     <section>
                        <h2 className="text-amber-500 font-bold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
                            <Scissors size={16} /> 1. Serviço
                        </h2>
                        <div className="space-y-3">
                            {services.map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => setSelectedService(service)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedService?.id === service.id ? 'bg-zinc-800 border-amber-500 ring-1 ring-amber-500' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50'}`}
                                >
                                    <div className="text-left">
                                        <span className={`font-bold block ${selectedService?.id === service.id ? 'text-white' : 'text-zinc-200'}`}>{service.name}</span>
                                        <span className="text-xs text-zinc-500">{service.duration_minutes} min</span>
                                    </div>
                                    <span className="font-bold text-amber-500">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* SELEÇÃO DE BARBEIRO */}
                    <section>
                        <h2 className="text-amber-500 font-bold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
                            <User size={16} /> 2. Profissional
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {barbers.map(barber => (
                                <button
                                    key={barber.id}
                                    onClick={() => setSelectedBarber(barber)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedBarber?.id === barber.id ? 'bg-zinc-800 border-amber-500 ring-1 ring-amber-500' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50'}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative border border-zinc-700">
                                        {barber.avatar_url ? (
                                            <Image src={barber.avatar_url} alt={barber.full_name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">{barber.full_name?.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div>
                                        <span className={`font-bold block text-sm ${selectedBarber?.id === barber.id ? 'text-white' : 'text-zinc-200'}`}>{barber.full_name}</span>
                                        <span className="text-[10px] uppercase text-zinc-500 font-bold">Barbeiro</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* DIREITA: Data e Hora */}
                <div className="lg:col-span-5 space-y-6">
                    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <h2 className="text-amber-500 font-bold text-sm tracking-wider uppercase mb-6 flex items-center gap-2">
                            <CalendarIcon size={16} /> 3. Data e Hora
                        </h2>

                        {/* Navegação Mês */}
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="p-1 hover:bg-zinc-800 rounded"><ChevronLeft size={20} className="text-zinc-400" /></button>
                            <span className="font-bold text-zinc-200 capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
                            <button onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="p-1 hover:bg-zinc-800 rounded"><ChevronRight size={20} className="text-zinc-400" /></button>
                        </div>

                        {/* Grid Dias */}
                        <div className="grid grid-cols-7 gap-1 mb-6">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d} className="text-center text-xs text-zinc-600 font-bold py-2">{d}</div>)}
                            {daysInMonth.map((day, i) => {
                                const isSelected = isSameDay(day, selectedDate)
                                const isTodayDate = isSameDay(day, today)
                                const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                                return (
                                    <button
                                        key={i}
                                        onClick={() => { setSelectedDate(day); setSelectedTime(null) }}
                                        disabled={day < startOfToday()}
                                        className={`h-10 rounded-lg text-sm font-medium transition-all ${!isCurrentMonth ? 'text-zinc-700' : ''} ${isSelected ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:bg-zinc-800'} ${isTodayDate && !isSelected ? 'border border-amber-500/50 text-amber-500' : ''} ${day < startOfToday() ? 'opacity-20 cursor-not-allowed' : ''}`}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Grid Horários (Dinâmico) */}
                        <h3 className="text-xs font-bold text-zinc-500 mb-3 flex items-center gap-1"><Clock size={12} /> HORÁRIOS DISPONÍVEIS</h3>
                        
                        {isClosedDay ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                                <AlertCircle className="text-red-500" />
                                <span className="text-red-400 font-bold text-sm">Fechado neste dia</span>
                                <span className="text-xs text-red-500/70">Por favor, selecione outra data.</span>
                            </div>
                        ) : availableTimeSlots.length === 0 ? (
                            <div className="p-4 bg-zinc-950 rounded-xl text-center text-zinc-500 text-xs">
                                Nenhum horário disponível.
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {availableTimeSlots.map(time => {
                                    const isDisabled = isTimeDisabled(time)
                                    return (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            disabled={isDisabled}
                                            className={`py-2 rounded-lg text-xs font-bold transition-all border ${isDisabled ? 'bg-zinc-900/50 text-zinc-700 border-zinc-800/50 cursor-not-allowed opacity-50' : selectedTime === time ? 'bg-zinc-100 text-zinc-950 border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white'}`}
                                        >
                                            {time}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </section>

                    {/* Resumo */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-zinc-400 text-sm font-bold">TOTAL ESTIMADO</span>
                            <span className="text-2xl font-bold text-green-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService?.price || 0)}</span>
                        </div>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedService || !selectedBarber || !selectedTime || submitting}
                            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />} CONFIRMAR AGENDAMENTO
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}