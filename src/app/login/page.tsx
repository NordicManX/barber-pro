'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, User, Phone, Mail, Lock } from 'lucide-react' 
import Image from 'next/image'

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'signup'>('login')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('') // <--- NOVO: Texto dinâmico de carregamento
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingText('Entrando...') // Feedback visual
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Erro ao entrar. Verifique email e senha.')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingText('Criando usuário...') // 1. Primeira mensagem
    setError(null)

    if (!fullName || !phone) {
        setError("Nome e telefone são obrigatórios para o cadastro.")
        setLoading(false)
        return
    }

    // Tenta criar o usuário
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
            full_name: fullName,
            phone: phone,
            role: 'customer'
        }
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // 2. SUCESSO! Agora damos o tempo para o banco processar
      setLoadingText('Configurando sua conta...') // Muda a mensagem para o usuário saber que algo está acontecendo
      
      // 3. PAUSA DE 2.5 SEGUNDOS (O segredo está aqui 🤫)
      await new Promise(resolve => setTimeout(resolve, 2500))

      // 4. Agora sim, redireciona com tudo pronto
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        
        {/* LOGO */}
        <div className="flex flex-col items-center text-center mb-8">
            <div className="relative w-40 h-40 mb-4">
                <Image 
                    src="/logo.png" 
                    alt="Logo da Barbearia"
                    fill
                    className="object-contain"
                    priority
                />
            </div>
            
            <h1 className="text-3xl font-black text-zinc-100 tracking-tighter uppercase">Hartmann</h1>
            <h2 className="text-xl font-light text-zinc-400 uppercase tracking-widest border-b border-zinc-700 pb-1 mb-2">Barbearia</h2>
            
            <p className="text-zinc-500 text-sm mt-2">
                {view === 'login' ? 'Acesse para agendar.' : 'Crie seu cadastro rápido.'}
            </p>
        </div>

        <form onSubmit={view === 'login' ? handleLogin : handleSignUp} className="space-y-4">
            
          {/* CAMPOS DE CADASTRO */}
          {view === 'signup' && (
            <>
                <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Nome Completo</label>
                    <div className="relative">
                        <div className="absolute left-3 top-3 text-zinc-500"><User size={20} /></div>
                        <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600"
                        placeholder="Ex: João da Silva"
                        />
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Celular</label>
                    <div className="relative">
                        <div className="absolute left-3 top-3 text-zinc-500"><Phone size={20} /></div>
                        <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600"
                        placeholder="(00) 00000-0000"
                        />
                    </div>
                </div>
            </>
          )}

          {/* CAMPOS PADRÃO */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Email</label>
            <div className="relative">
                <div className="absolute left-3 top-3 text-zinc-500"><Mail size={20} /></div>
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600"
                placeholder="cliente@exemplo.com"
                required
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Senha</label>
            <div className="relative">
                <div className="absolute left-3 top-3 text-zinc-500"><Lock size={20} /></div>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600"
                placeholder="••••••••"
                required
                />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center animate-in fade-in slide-in-from-bottom-2">
              {error}
            </div>
          )}

          {/* BOTÃO PRINCIPAL COM TEXTO DINÂMICO */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black uppercase tracking-wide py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{loadingText}</span> {/* Mostra "Criando..." depois "Configurando..." */}
                </>
            ) : (
                view === 'login' ? 'Entrar' : 'Confirmar Cadastro'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
          <p className="text-zinc-500 text-sm mb-3">
            {view === 'login' ? 'Novo na Hartmann?' : 'Já tem conta?'}
          </p>
          <button
            type="button"
            onClick={() => {
                setView(view === 'login' ? 'signup' : 'login')
                setError(null)
            }}
            disabled={loading}
            className="text-amber-500 hover:text-amber-400 font-bold text-sm transition-colors hover:underline uppercase tracking-wide"
          >
            {view === 'login' ? 'Criar cadastro rápido' : 'Fazer Login'}
          </button>
        </div>
      </div>
    </div>
  )
}