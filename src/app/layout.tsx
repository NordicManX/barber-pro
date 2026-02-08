import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner' 

// 👇 1. IMPORTANTE: Importe o Modal aqui
import { CompleteRegistrationModal } from '@/components/CompleteRegistrationModal'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hartmann Barbearia',
  description: 'Sistema de Agendamento Premium',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50`}>
        
        {/* 👇 2. O SEGREDINHO: Coloque o Modal aqui antes de tudo! */}
        {/* Ele vai vigiar o usuário invisivelmente em TODAS as páginas */}
        <CompleteRegistrationModal />

        {children}
        
        {/* Toaster para avisos */}
        <Toaster richColors position="top-center" theme="dark" /> 
      </body>
    </html>
  )
}