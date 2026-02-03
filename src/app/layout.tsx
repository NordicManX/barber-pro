import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner' // <--- TEM QUE TER ISSO

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
      <body className={inter.className}>
        {children}
        {/* TEM QUE TER ESSA LINHA AQUI EMBAIXO: */}
        <Toaster richColors position="top-center" /> 
      </body>
    </html>
  )
}