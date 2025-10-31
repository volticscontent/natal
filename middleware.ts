import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

// Configuração do middleware de internacionalização
const intlMiddleware = createIntlMiddleware({
  locales: ['pt', 'en', 'es'],
  defaultLocale: 'pt',
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Excluir explicitamente vídeos do processamento de locale
  if (pathname.startsWith('/videos/') || 
      pathname.match(/\.(webm|mp4)$/)) {
    return NextResponse.next();
  }

  // Otimização: processar apenas rotas que realmente precisam
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Headers mínimos para APIs críticas
    if (pathname.includes('/save-photos') || pathname.includes('/submit-order')) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    
    return response;
  }

  // Aplicar middleware de internacionalização para outras rotas
  return intlMiddleware(request);
}

export const config = {
  // Matcher para aplicar o middleware
  matcher: [
    // Aplicar a todas as rotas exceto arquivos estáticos e vídeos
    '/((?!_next/static|_next/image|favicon.ico|videos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webm|mp4)$).*)',
    // Aplicar especificamente às APIs
    '/api/:path*'
  ]
};