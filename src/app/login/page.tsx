'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Scissors, Loader2, User, Phone } from 'lucide-react'

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'signup'>('login')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  
  const [loading, setLoading] = useState(false)
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
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!fullName || !phone) {
        setError("Nome e telefone são obrigatórios para o cadastro.")
        setLoading(false)
        return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
            full_name: fullName,
            phone: phone,
        }
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setError('Verifique seu email para confirmar o cadastro!')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-zinc-800">
        
        <div className="flex flex-col items-center mb-8">
          {/* Ícone com fundo AMBER e sombra colorida */}
          <div className="bg-amber-500 p-3 rounded-full mb-4 shadow-lg shadow-amber-500/20">
            <Scissors className="w-8 h-8 text-zinc-950" />
          </div>
          <h1 className="text-3xl font-black text-zinc-100 tracking-tighter uppercase">
            Hartmann
          </h1>
          <h2 className="text-xl font-light text-zinc-400 uppercase tracking-widest border-b border-zinc-700 pb-1 mb-2">
            Barbearia
          </h2>
          <p className="text-zinc-500 text-xs">
            {view === 'login' ? 'Acesse para agendar.' : 'Crie seu cadastro rápido.'}
          </p>
        </div>

        <form onSubmit={view === 'login' ? handleLogin : handleSignUp} className="space-y-4">
            
          {view === 'signup' && (
            <>
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase tracking-wider">Nome Completo</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                        <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        // Foco com borda AMBER
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-sm p-3 pl-10 text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        placeholder="Ex: João da Silva"
                        />
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase tracking-wider">Celular / WhatsApp</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                        <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        // Foco com borda AMBER
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-sm p-3 pl-10 text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                        placeholder="(00) 00000-0000"
                        />
                    </div>
                </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Foco com borda AMBER
              className="w-full bg-zinc-950 border border-zinc-800 rounded-sm p-3 text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              placeholder="cliente@exemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase tracking-wider">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              // Foco com borda AMBER
              className="w-full bg-zinc-950 border border-zinc-800 rounded-sm p-3 text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Botão Principal AMBER */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black uppercase tracking-wide py-3 rounded-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-500/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (view === 'login' ? 'Entrar' : 'Confirmar Cadastro')}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
          <p className="text-zinc-500 text-sm mb-3">
            {view === 'login' ? 'Novo na Hartmann?' : 'Já tem conta?'}
          </p>
          {/* Link secundário AMBER */}
          <button
            type="button"
            onClick={() => {
                setView(view === 'login' ? 'signup' : 'login')
                setError(null)
            }}
            disabled={loading}
            className="text-amber-500 hover:text-amber-400 font-semibold text-sm transition-colors hover:underline uppercase tracking-wide"
          >
            {view === 'login' ? 'Criar cadastro rápido' : 'Fazer Login'}
          </button>
        </div>
      </div>
    </div>
  )
}