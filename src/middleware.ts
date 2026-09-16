import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 1. Se não estiver logado, redireciona para login
  if (!user && pathname !== '/login' && !pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Se estiver logado, busca o perfil sem bloquear caso ocorra erro
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', user.id)
      .maybeSingle()

    // Libera direto se for Personal Trainer
    if (profile?.role === 'personal') {
      if (pathname === '/aguardando-aprovacao') {
        return NextResponse.redirect(new URL('/', request.url))
      }
      return response
    }

    // Só manda para análise se for explicitamente aluno e estiver pendente
    if (profile?.role === 'aluno' && profile?.status === 'pendente' && pathname !== '/aguardando-aprovacao') {
      return NextResponse.redirect(new URL('/aguardando-aprovacao', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}