import type { Metadata, Viewport } from 'next' // 1. Importe Viewport aqui
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner' 
import { CompleteRegistrationModal } from '@/components/CompleteRegistrationModal'

const inter = Inter({ subsets: ['latin'] })

// 2. Metadados do PWA (Nome, Ícone, Barra de Status no iOS)
export const metadata: Metadata = {
  title: 'Hartmann Barbearia',
  description: 'Sistema de Agendamento Premium',
  manifest: "/manifest.json", // <--- TEM QUE SER EXATAMENTE ASSIM
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hartmann Barbearia",
  },
}

// 3. Configuração de Viewport (Cores e Zoom no Celular)
// No Next.js novo, isso fica separado do metadata
export const viewport: Viewport = {
  themeColor: "#09090b", // Cor da barra do navegador (igual ao fundo do site)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Impede aquele zoom chato ao clicar em inputs
  userScalable: false, // Faz parecer um App nativo (não dá zoom com pinça)
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50`}>
        
        {/* Modal de Cadastro (Mantido) */}
        <CompleteRegistrationModal />

        {children}
        
        {/* Toaster (Mantido) */}
        <Toaster richColors position="top-center" theme="dark" /> 
      </body>
    </html>
  )
}