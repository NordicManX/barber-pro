'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react' // Removi Save e adicionei imports limpos
import Image from 'next/image'
import { toast } from 'sonner' // <--- IMPORTANTE: Importando o sistema de notificação
import { useRouter } from 'next/navigation' // <--- IMPORTANTE: Para atualizar a página

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter() // Hook de navegação

  const [loading, setLoading] = useState(true) // Começa carregando
  const [logoUrl, setLogoUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  // 1. Carregar a logo atual ao abrir a página
  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await supabase
          .from('barbershop_settings')
          .select('logo_url')
          .single() 
        
        if (data?.logo_url) {
          setLogoUrl(data.logo_url)
        }
      } catch (error) {
        console.error("Erro ao carregar configurações", error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [supabase])

  // 2. Função de Upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Variável para controlar a notificação de loading
    let toastId = null

    try {
      if (!event.target.files || event.target.files.length === 0) return

      setUploading(true)
      // Inicia o feedback visual
      toastId = toast.loading('Processando imagem...')
      
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}.${fileExt}` 
      const filePath = `${fileName}`

      // A. Envia para o Storage (Bucket 'assets')
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // B. Pega a URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath)

      // C. Salva a nova URL no Banco de Dados
      const { error: dbError } = await supabase
        .from('barbershop_settings')
        .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', 1)

      if (dbError) throw dbError

      setLogoUrl(publicUrl)
      
      // Sucesso: Remove o loading e mostra mensagem verde
      toast.dismiss(toastId)
      toast.success('Logo atualizada com sucesso!', {
        description: 'A nova identidade visual já está ativa.',
        duration: 4000,
      })

      // Atualiza o site todo para a logo nova aparecer no menu
      router.refresh()

    } catch (error) {
      console.error(error)
      // Erro: Remove o loading e mostra mensagem vermelha
      if (toastId) toast.dismiss(toastId)
      toast.error('Erro ao atualizar logo', {
        description: 'Tente novamente com um arquivo menor.',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Configurações da Barbearia</h1>
        <p className="text-zinc-400">Gerencie a identidade visual e informações da loja.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
          <ImageIcon className="text-amber-500" />
          Logo da Barbearia
        </h2>

        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* PREVIEW DA LOGO */}
          <div className="relative w-40 h-40 rounded-full border-4 border-amber-500 overflow-hidden bg-black shadow-xl shadow-amber-500/10 flex-shrink-0 transition-all hover:scale-105">
            {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-amber-500" />
                </div>
            ) : logoUrl ? (
              <Image 
                src={logoUrl} 
                alt="Logo Atual" 
                fill 
                className={`object-contain p-2 transition-opacity ${uploading ? 'opacity-50' : 'opacity-100'}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-bold uppercase">
                Sem Logo
              </div>
            )}
            
            {/* Loading Overlay durante upload */}
            {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
            )}
          </div>

          {/* AREA DE UPLOAD */}
          <div className="flex-1 space-y-4">
            <p className="text-sm text-zinc-400">
              Faça upload de uma imagem PNG ou JPG. Recomendamos formato quadrado e fundo transparente.
            </p>
            
            <label className={`cursor-pointer inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 py-2 rounded-lg border border-zinc-700 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />}
              <span className="font-medium">
                {uploading ? 'Enviando...' : 'Alterar Logo'}
              </span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden" 
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}