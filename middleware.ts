import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

// Configuração do middleware de internacionalização
const intlMiddleware = createIntlMiddleware({
  locales: ['pt', 'en', 'es'],
  defaultLocale: 'pt',
  localePrefix: 'never'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirecionamento da raiz para /pt
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/pt', request.url));
  }

  // Lista de extensões de arquivos estáticos
  const staticFileExtensions = /\.(webm|mp4|webp|png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/i;
  
  // Lista de caminhos que devem ser excluídos do processamento de locale
  const excludedPaths = [
    '/videos/',
    '/images/', 
    '/hero/',
    '/_next/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml'
  ];

  // Verificar se é um arquivo estático ou caminho excluído
  const isStaticFile = staticFileExtensions.test(pathname);
  const isExcludedPath = excludedPaths.some(path => pathname.startsWith(path));
  
  // Se for arquivo estático ou caminho excluído, pular processamento de locale
  if (isStaticFile || isExcludedPath) {
    const response = NextResponse.next();
    
    // Adicionar headers específicos para vídeos
    if (pathname.startsWith('/videos/') || pathname.match(/\.(webm|mp4)$/i)) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      response.headers.set('Accept-Ranges', 'bytes');
      
      if (pathname.endsWith('.webm')) {
        response.headers.set('Content-Type', 'video/webm');
      } else if (pathname.endsWith('.mp4')) {
        response.headers.set('Content-Type', 'video/mp4');
      }
    }
    
    return response;
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
    // Aplicar a todas as rotas exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|videos/|images/|hero/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webm|mp4|css|js|woff|woff2|ttf|eot)$).*)',
    // Aplicar especificamente às APIs (mas não aos arquivos estáticos)
    '/api/((?!.*\\.(?:webm|mp4|webp|png|jpg|jpeg|gif|svg|ico)$).*)'
  ]
};