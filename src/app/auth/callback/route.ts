import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [] // Em rotas de API não precisamos ler cookies da request assim
          },
          setAll(cookiesToSet) {
             // Apenas definimos os cookies na resposta
             cookiesToSet.forEach(({ name, value, options }) => 
                // @ts-ignore
                cookieStore.set(name, value, options)
             )
          },
        },
      }
    )
    
    // IMPORTANTE: Aqui precisamos de um truque pro Next.js 15/16 + SSR funcionar liso
    // Mas vamos usar a forma simplificada primeiro:
    const cookieStore = (await import('next/headers')).cookies()
    const supabaseServer = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // O método setAll foi chamado de um Server Component.
                // Isso pode ser ignorado se tivermos middleware tratando a sessão
              }
            },
          },
        }
      )

    const { error } = await supabaseServer.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Se der erro, volta pro login com aviso
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}