'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { format, addDays, isSameDay, startOfToday, isBefore, set } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock, Scissors, User, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { sendAppointmentEmail } from '@/app/actions/send-appointment-email'

// Tipos
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

export default function NewAppointmentPage() {
    const supabase = createClient()
    const router = useRouter()

    // --- ESTADOS ---
    const [services, setServices] = useState<Service[]>([])
    const [barbers, setBarbers] = useState<Barber[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Seleções do Usuário
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    // Dados para Calendário
    const today = startOfToday()
    const [currentMonth, setCurrentMonth] = useState(today)

    // Horários disponíveis
    const timeSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
    ]

    // --- LOAD DATA ---
    useEffect(() => {
        async function loadData() {
            setLoading(true)

            const { data: servicesData } = await supabase
                .from('services')
                .select('*')
                .order('price')

            if (servicesData) setServices(servicesData)

            const { data: barbersData } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, role')
                .in('role', ['barber', 'admin'])
                .order('full_name')

            if (barbersData) setBarbers(barbersData)

            setLoading(false)
        }
        loadData()
    }, [])

    // --- HELPERS DE CALENDÁRIO ---
    const daysInMonth = Array.from({ length: 35 }, (_, i) => {
        const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        const startDate = addDays(start, -start.getDay())
        return addDays(startDate, i)
    })

    // --- NOVA FUNÇÃO: VERIFICA SE O HORÁRIO JÁ PASSOU ---
    const isTimeDisabled = (time: string) => {
        const now = new Date(); // Hora exata agora
        const [hours, minutes] = time.split(':').map(Number);

        // 1. Cria o objeto Date específico desse botão (Data Selecionada + Horário do Botão)
        const slotDateTime = set(selectedDate, {
            hours,
            minutes,
            seconds: 0,
            milliseconds: 0
        });

        // 2. A Mágica: Se esse momento já passou, bloqueia.
        // Isso resolve "Hoje" (passado), "Ontem" (tudo bloqueado) e "Amanhã" (tudo liberado)
        return isBefore(slotDateTime, now);
    }

    const handleConfirm = async () => {
        if (!selectedService || !selectedBarber || !selectedTime) {
            toast.error("Preencha todos os campos!")
            return
        }

        setSubmitting(true)

        const [hours, minutes] = selectedTime.split(':').map(Number)
        const finalDate = new Date(selectedDate)
        finalDate.setHours(hours, minutes, 0, 0)

        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) {
            toast.error("Você precisa estar logado.")
            router.push('/login')
            return
        }

        const { error } = await supabase.from('appointments').insert({
            user_id: user.id,
            barber_id: selectedBarber.id,
            service_id: selectedService.id,
            date: finalDate.toISOString(),
            status: 'pending'
        })

        if (error) {
            console.error(error)
            toast.error("Erro ao agendar. Tente novamente.")
        } else {
            // Tenta enviar o email, mas não bloqueia se falhar (apenas loga)
            try {
                await sendAppointmentEmail({
                    clientName: "Cliente", // Pode buscar o nome real no profile se quiser
                    clientEmail: user.email,
                    barberName: selectedBarber.full_name,
                    serviceName: selectedService.name,
                    date: format(selectedDate, 'dd/MM/yyyy'),
                    time: selectedTime
                })
            } catch (emailError) {
                console.error("Falha ao enviar email:", emailError)
            }

            toast.success("Agendamento realizado com sucesso!")
            router.push('/agendamentos')
        }
        setSubmitting(false)
    }

    if (loading) {
        return <div className="flex h-screen items-center justify-center text-amber-500"><Loader2 className="animate-spin w-10 h-10" /></div>
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500 px-4 md:px-0">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-100">Novo Agendamento</h1>
                <p className="text-zinc-400">Monte seu estilo.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* COLUNA DA ESQUERDA (SERVIÇOS E PROFISSIONAIS) */}
                <div className="lg:col-span-7 space-y-8">

                    {/* 1. SELEÇÃO DE SERVIÇO */}
                    <section>
                        <h2 className="text-amber-500 font-bold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
                            <Scissors size={16} /> 1. Serviço
                        </h2>
                        <div className="space-y-3">
                            {services.map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => setSelectedService(service)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all
                                ${selectedService?.id === service.id
                                            ? 'bg-zinc-800 border-amber-500 ring-1 ring-amber-500'
                                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'}
                            `}
                                >
                                    <div className="text-left">
                                        <span className={`font-bold block ${selectedService?.id === service.id ? 'text-white' : 'text-zinc-200'}`}>
                                            {service.name}
                                        </span>
                                        <span className="text-xs text-zinc-500">{service.duration_minutes} min</span>
                                    </div>
                                    <span className="font-bold text-amber-500">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 2. SELEÇÃO DE PROFISSIONAL */}
                    <section>
                        <h2 className="text-amber-500 font-bold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
                            <User size={16} /> 2. Profissional
                        </h2>

                        {barbers.length === 0 ? (
                            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 text-sm">
                                Nenhum profissional encontrado.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {barbers.map(barber => (
                                    <button
                                        key={barber.id}
                                        onClick={() => setSelectedBarber(barber)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                                    ${selectedBarber?.id === barber.id
                                                ? 'bg-zinc-800 border-amber-500 ring-1 ring-amber-500'
                                                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'}
                                `}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative border border-zinc-700">
                                            {barber.avatar_url ? (
                                                <Image src={barber.avatar_url} alt={barber.full_name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">
                                                    {barber.full_name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <span className={`font-bold block text-sm ${selectedBarber?.id === barber.id ? 'text-white' : 'text-zinc-200'}`}>
                                                {barber.full_name}
                                            </span>
                                            <span className="text-[10px] uppercase text-zinc-500 font-bold">
                                                {barber.role === 'admin' ? 'Superadmin' : 'Barbeiro'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* COLUNA DA DIREITA (DATA, HORA E RESUMO) */}
                <div className="lg:col-span-5 space-y-6">

                    {/* 3. DATA E HORA */}
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
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                                <div key={d} className="text-center text-xs text-zinc-600 font-bold py-2">{d}</div>
                            ))}
                            {daysInMonth.map((day, i) => {
                                const isSelected = isSameDay(day, selectedDate)
                                const isTodayDate = isSameDay(day, today)
                                const isCurrentMonth = day.getMonth() === currentMonth.getMonth()

                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setSelectedDate(day)
                                            setSelectedTime(null) // Reseta horário ao mudar dia
                                        }}
                                        disabled={day < startOfToday()}
                                        className={`
                                    h-10 rounded-lg text-sm font-medium transition-all
                                    ${!isCurrentMonth ? 'text-zinc-700' : ''}
                                    ${isSelected
                                                ? 'bg-amber-500 text-zinc-950 font-bold'
                                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}
                                    ${isTodayDate && !isSelected ? 'border border-amber-500/50 text-amber-500' : ''}
                                    ${day < startOfToday() ? 'opacity-20 cursor-not-allowed hover:bg-transparent' : ''}
                                `}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Grid Horários */}
                        <h3 className="text-xs font-bold text-zinc-500 mb-3 flex items-center gap-1"><Clock size={12} /> HORÁRIOS DISPONÍVEIS</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {timeSlots.map(time => {
                                const isDisabled = isTimeDisabled(time)

                                return (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time)}
                                        disabled={isDisabled}
                                        className={`
                                    py-2 rounded-lg text-xs font-bold transition-all border
                                    ${isDisabled
                                                ? 'bg-zinc-900/50 text-zinc-700 border-zinc-800/50 cursor-not-allowed opacity-50' // Estilo Desabilitado
                                                : selectedTime === time
                                                    ? 'bg-zinc-100 text-zinc-950 border-white'
                                                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white'
                                            }
                                `}
                                    >
                                        {time}
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    {/* RESUMO E CONFIRMAÇÃO */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-zinc-400 text-sm font-bold">TOTAL ESTIMADO</span>
                            <span className="text-2xl font-bold text-green-500">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService?.price || 0)}
                            </span>
                        </div>

                        <button
                            onClick={handleConfirm}
                            disabled={!selectedService || !selectedBarber || !selectedTime || submitting}
                            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                            CONFIRMAR AGENDAMENTO
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}