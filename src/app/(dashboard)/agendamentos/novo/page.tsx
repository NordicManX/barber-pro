'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Calendar, Clock, User, Scissors, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'

// Tipos para nosso TypeScript não reclamar
type Service = { id: string; name: string; price: number; duration_minutes: number; image_url: string | null }
type Profile = { id: string; full_name: string; avatar_url: string | null }

export default function NewAppointmentPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Dados do Banco
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Profile[]>([])

  // Seleções do Usuário
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedBarber, setSelectedBarber] = useState<Profile | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  // 1. Carregar Dados Iniciais (Serviços e Barbeiros)
  // ... dentro do componente
  useEffect(() => {
    async function loadData() {
      console.log("Iniciando busca de dados...") // <--- ADICIONE ISSO

      // Busca Serviços
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
      
      if (servicesError) console.error("Erro Serviços:", servicesError) // <--- VERIFIQUE O ERRO
      console.log("Serviços encontrados:", servicesData) // <--- VEJA SE VEIO ARRAY VAZIO []

      // Busca Perfis
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
      
      if (profilesError) console.error("Erro Perfis:", profilesError) // <--- VERIFIQUE O ERRO
      console.log("Barbeiros encontrados:", profilesData) // <--- VEJA SE VEIO ARRAY VAZIO []
      
      if (servicesData) setServices(servicesData)
      if (profilesData) setBarbers(profilesData)
      
      setLoading(false)
    }
    loadData()
  }, [])

  // Gerar horários fixos para teste (Fase 4 faremos isso ser inteligente)
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ]

  // Função de Salvar
  const handleBooking = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast.warning('Preencha todos os campos para agendar.')
      return
    }

    setSubmitting(true)

    try {
      // Pega o usuário logado (Cliente)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Você precisa estar logado.')
        return
      }

      // Monta a data completa (Data + Hora)
      // Ex: 2023-10-25T14:30:00.000Z
      const finalDateTime = new Date(`${selectedDate}T${selectedTime}:00`)

      // INSERE NO BANCO DE DADOS
      const { error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,            // Quem está agendando
          service_id: selectedService.id, // O que
          barber_id: selectedBarber.id,   // Com quem
          date: finalDateTime.toISOString(), // Quando
          status: 'confirmed'          // Já nasce confirmado (simplificação)
        })

      if (error) throw error

      toast.success('Agendamento realizado!', {
        description: `Te esperamos dia ${selectedDate.split('-').reverse().join('/')} às ${selectedTime}.`
      })

      router.push('/') // Volta para a Home para ver o agendamento lá

    } catch (error) {
      console.error(error)
      toast.error('Erro ao realizar agendamento.')
    } finally {
      setSubmitting(false)
    }
  }

  // Formata moeda
  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  if (loading) {
    return (
        <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Novo Agendamento</h1>
        <p className="text-zinc-400">Monte seu estilo em poucos passos.</p>
      </div>

      {/* PASSO 1: SERVIÇOS */}
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

      {/* PASSO 2: PROFISSIONAL */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <div className="bg-amber-500/10 p-2 rounded text-amber-500"><User size={18} /></div>
            2. Escolha o Profissional
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
            {barbers.map(barber => (
                <div 
                    key={barber.id}
                    onClick={() => setSelectedBarber(barber)}
                    className={`min-w-[120px] p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center gap-2
                        ${selectedBarber?.id === barber.id 
                            ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500' 
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                >
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-lg">
                        {barber.full_name?.charAt(0) || 'B'}
                    </div>
                    <span className={`text-sm font-medium text-center ${selectedBarber?.id === barber.id ? 'text-amber-500' : 'text-zinc-300'}`}>
                        {barber.full_name?.split(' ')[0] || 'Barbeiro'}
                    </span>
                </div>
            ))}
        </div>
      </section>

      {/* PASSO 3: DATA E HORA */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <div className="bg-amber-500/10 p-2 rounded text-amber-500"><Calendar size={18} /></div>
            3. Data e Hora
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input de Data Nativo (Simples e Funcional no Mobile) */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Dia</label>
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} // Não permite datas passadas
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
            </div>

            {/* Grid de Horários */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                 <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Horário Disponível</label>
                 <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map(time => (
                        <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 text-sm rounded-lg border transition-all
                                ${selectedTime === time 
                                    ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold' 
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                                }`}
                        >
                            {time}
                        </button>
                    ))}
                 </div>
            </div>
        </div>
      </section>

      {/* RODAPÉ FLUTUANTE DE CONFIRMAÇÃO (Mobile Friendly) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-800 md:relative md:bg-transparent md:border-0 md:p-0">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <div className="hidden md:block">
                  <p className="text-zinc-500 text-xs uppercase">Total estimado</p>
                  <p className="text-xl font-bold text-amber-500">
                    {selectedService ? formatMoney(selectedService.price) : 'R$ 0,00'}
                  </p>
              </div>

              <button 
                onClick={handleBooking}
                disabled={submitting || !selectedService || !selectedDate || !selectedTime}
                className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-black py-4 px-8 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wide shadow-lg shadow-amber-500/20"
              >
                {submitting ? <Loader2 className="animate-spin" /> : (
                    <>
                        Confirmar Agendamento <CheckCircle2 size={20} />
                    </>
                )}
              </button>
          </div>
      </div>

    </div>
  )
}