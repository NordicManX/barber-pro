'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client' // <--- O IMPORT CORRETO
import { useRouter } from 'next/navigation'
import { Scissors, Loader2, Skull } from 'lucide-react' // Adicionei o icone de Caveira se quiser usar

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient() 

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

  const handleSignUp = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
      {/* Fundo com textura sutil ou gradiente para dar ar "Premium" */}
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-zinc-800">
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-zinc-100 p-3 rounded-full mb-4 shadow-lg shadow-white/10">
            {/* Como a logo é P&B, o ícone preto no fundo branco destaca */}
            <Scissors className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-black text-zinc-100 tracking-tighter uppercase">
            Hartmann
          </h1>
          <h2 className="text-xl font-light text-zinc-400 uppercase tracking-widest border-b border-zinc-700 pb-1 mb-2">
            Barbearia
          </h2>
          <p className="text-zinc-500 text-xs">Acesse para agendar seu corte.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-sm p-3 text-zinc-100 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
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
              className="w-full bg-zinc-950 border border-zinc-800 rounded-sm p-3 text-zinc-100 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-100 hover:bg-white text-black font-black uppercase tracking-wide py-3 rounded-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar na Barbearia'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
          <p className="text-zinc-500 text-sm mb-3">Novo na Hartmann?</p>
          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="text-zinc-300 hover:text-white font-semibold text-sm transition-colors hover:underline"
          >
            Criar cadastro
          </button>
        </div>
      </div>
    </div>
  )
}