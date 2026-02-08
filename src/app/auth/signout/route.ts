import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // 1. Desconecta o usuário no servidor Supabase
  await supabase.auth.signOut()

  // 2. Limpa o cache para garantir que dados protegidos não fiquem na memória
  revalidatePath('/', 'layout')

  // 3. Redireciona para a tela de Login
  return NextResponse.redirect(new URL('/login', req.url), {
    status: 302,
  })
}