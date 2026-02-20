import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  // Faz uma consulta ultra-leve (só conta 1 linha)
  // Isso força o Supabase a "acordar" ou manter-se ativo
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  if (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 })
  }

  return NextResponse.json({ 
    status: 'alive', 
    timestamp: new Date().toISOString(),
    message: 'O Banco de Dados tomou um café e está acordado! ☕' 
  })
}