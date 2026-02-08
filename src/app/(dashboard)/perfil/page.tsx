'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User, Camera, Lock, Save, Loader2, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  
  // Dados do Perfil
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  
  // Dados de Senha
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // 1. Carregar Dados
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
        setAvatarUrl(profile.avatar_url)
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  // 2. Upload de Foto
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return
    
    const file = event.target.files[0]
    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}-${Math.random()}.${fileExt}`

    setSaving(true)
    toast.info('Enviando foto...')

    try {
        // Envia para o Bucket 'avatars'
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        // Pega a URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

        // Salva a URL no perfil do usuário
        await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', userId)

        setAvatarUrl(publicUrl)
        toast.success('Foto atualizada!')
        window.location.reload() // Atualiza o avatar no menu lateral

    } catch (error) {
        console.error(error)
        toast.error('Erro ao enviar foto.')
    } finally {
        setSaving(false)
    }
  }

  // 3. Salvar Nome
  const handleUpdateName = async () => {
    if (!fullName) return toast.warning('Nome não pode ser vazio.')
    
    setSaving(true)
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', userId)

        if (error) throw error
        toast.success('Perfil atualizado!')
        router.refresh()
    } catch (error) {
        toast.error('Erro ao atualizar perfil.')
    } finally {
        setSaving(false)
    }
  }

  // 4. Trocar Senha
  const handleChangePassword = async () => {
    if (!password || !confirmPassword) return toast.warning('Preencha as senhas.')
    if (password !== confirmPassword) return toast.error('As senhas não coincidem.')
    if (password.length < 6) return toast.error('Senha deve ter no mínimo 6 caracteres.')

    setSaving(true)
    try {
        const { error } = await supabase.auth.updateUser({ password: password })
        if (error) throw error
        
        toast.success('Senha alterada com sucesso!')
        setPassword('')
        setConfirmPassword('')
    } catch (error) {
        toast.error('Erro ao alterar senha.')
    } finally {
        setSaving(false)
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-amber-500" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Meu Perfil</h1>
        <p className="text-zinc-400">Gerencie suas informações pessoais.</p>
      </div>

      {/* --- SEÇÃO 1: FOTO E NOME --- */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2 border-b border-zinc-800 pb-2">
            <User size={18} className="text-amber-500" /> Dados Pessoais
        </h2>

        <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center overflow-hidden relative">
                    {avatarUrl ? (
                        <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                    ) : (
                        <span className="text-2xl font-bold text-zinc-500">{fullName?.charAt(0)}</span>
                    )}
                    
                    {/* Overlay de Hover */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white w-6 h-6" />
                    </div>
                </div>
                {/* Input escondido */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                />
            </div>

            {/* Input Nome */}
            <div className="flex-1 w-full space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Nome Completo</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                    />
                    <button 
                        onClick={handleUpdateName}
                        disabled={saving}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 rounded-xl font-bold transition-all"
                    >
                        {saving ? <Loader2 className="animate-spin w-5 h-5"/> : <Save size={20}/>}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* --- SEÇÃO 2: SEGURANÇA --- */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Lock size={18} className="text-amber-500" /> Alterar Senha
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Nova Senha</label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-3 text-zinc-600 w-5 h-5"/>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:border-amber-500 focus:outline-none"
                        placeholder="••••••"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Confirmar Senha</label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-3 text-zinc-600 w-5 h-5"/>
                    <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-200 focus:border-amber-500 focus:outline-none"
                        placeholder="••••••"
                    />
                </div>
            </div>
        </div>

        <div className="flex justify-end">
            <button 
                onClick={handleChangePassword}
                disabled={saving || !password}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {saving ? 'Salvando...' : 'Atualizar Senha'}
            </button>
        </div>
      </div>

    </div>
  )
}