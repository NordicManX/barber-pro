'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Camera, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner' // <--- Importando a biblioteca chique

interface LogoUploaderProps {
  currentUrl: string | null
}

export function LogoUploader({ currentUrl }: LogoUploaderProps) {
  const supabase = createClient()
  const router = useRouter()
  
  // URL de fallback caso não tenha imagem
  const defaultImage = "https://ui-avatars.com/api/?name=Hartmann&background=f59e0b&color=000"
  
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl || defaultImage)

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return

      setUploading(true)
      
      // 1. AVISO DE CARREGAMENTO (Substitui o alert antigo)
      const toastId = toast.loading('Processando imagem...')

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}.${fileExt}`

      // Upload para o Supabase
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Pegar URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName)

      // Atualizar Banco de Dados
      const { error: dbError } = await supabase
        .from('barbershop_settings')
        .update({ logo_url: publicUrl })
        .eq('id', 1)

      if (dbError) throw dbError

      setPreview(publicUrl)
      
      // 2. AVISO DE SUCESSO (Fecha o loading e mostra o verde)
      toast.dismiss(toastId)
      toast.success('Identidade visual atualizada!', {
        description: 'A nova logo já está visível para os clientes.',
        duration: 4000,
      })

      router.refresh()

    } catch (error) {
      console.error(error)
      // 3. AVISO DE ERRO
      toast.dismiss() // Garante que fecha o loading anterior
      toast.error('Erro ao atualizar imagem', {
        description: 'Verifique sua conexão ou tente uma imagem menor.',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group w-40 h-40">
        <div className="relative w-40 h-40 rounded-full border-4 border-amber-500 overflow-hidden shadow-2xl bg-zinc-900 flex items-center justify-center transition-all hover:scale-105">
          <Image 
            src={preview} 
            alt="Logo da Barbearia" 
            fill
            className={`object-contain p-2 transition-all duration-500 ${uploading ? 'opacity-30 blur-sm' : 'opacity-100'}`}
          />
          
          {uploading && (
             <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
             </div>
          )}
        </div>

        <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
          {!uploading && (
            <div className="flex flex-col items-center text-zinc-200 animate-in fade-in zoom-in duration-300">
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold uppercase tracking-wide">Trocar</span>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  )
}