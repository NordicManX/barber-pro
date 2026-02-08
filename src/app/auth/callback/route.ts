import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // 1. Pega os parâmetros da URL
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Se tiver um destino (next), usa ele. Se não, manda pra Home.
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // 2. Cria o cliente usando nossa configuração centralizada
    const supabase = await createClient()
    
    // 3. Troca o código temporário pela Sessão Real (Cookies)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // SUCESSO! Redireciona o usuário limpo para o sistema
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // ERRO: Se o código for inválido ou expirar, manda pro login com erro
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}