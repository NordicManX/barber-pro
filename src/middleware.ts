import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Como o 'matcher' lá embaixo já exclui o manifest.json e as imagens,
  // esta função NEM SERÁ CHAMADA para eles.
  // Pode deixar apenas a atualização de sessão aqui.
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (SEU ARQUIVO PWA)
     * - imagens (svg, png, jpg, etc - SEUS ÍCONES PWA)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}