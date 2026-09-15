import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Permitir acesso livre a login, cadastro e arquivos estáticos
  if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/cadastro')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    // Buscar perfil do usuário no banco
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'aluno'
    const status = profile?.status || 'pendente'

    // 1. Redirecionar cadastros pendentes
    if (status === 'pendente' && pathname !== '/aguardando-aprovacao') {
      return NextResponse.redirect(new URL('/aguardando-aprovacao', request.url))
    }

    // 2. Restringir acesso de alunos às rotas administrativas
    const rotasAdmin = ['/exercicios', '/fichas-de-treino', '/alunos']
    if (role === 'aluno' && rotasAdmin.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/meu-treino', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}