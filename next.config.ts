import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import path from "path";

const withNextIntl = createNextIntlPlugin('./src/i18n/i18n.ts');
const isDev = process.env.NODE_ENV !== 'production';

// Deriva hostname público do R2 a partir da env R2_PUBLIC_URL, se disponível
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';
let R2_PUBLIC_HOST: string | null = null;
try {
  if (R2_PUBLIC_URL) {
    const u = new URL(R2_PUBLIC_URL);
    R2_PUBLIC_HOST = u.hostname;
  }
} catch {
  R2_PUBLIC_HOST = null;
}

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: path.join(__dirname),
  
  // Otimizações de imagem
  images: {
    // No desenvolvimento (ou se forçado por env), desabilita o otimizador para evitar 401 em /_next/image
    // quando múltiplas instâncias/portas do localhost estão em uso.
    unoptimized: isDev || process.env.NEXT_IMAGE_UNOPTIMIZED === 'true',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.videopapainoel.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'videopapainoel.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-4a4f09b19c604fc88b20d7ddd1447673.r2.dev',
        port: '',
        pathname: '/**',
      },
      // Permite exibir imagens diretamente do domínio público do R2 (fotos/…)
      ...(R2_PUBLIC_HOST ? [
        {
          protocol: 'https' as const,
          hostname: R2_PUBLIC_HOST,
          port: '',
          pathname: '/**',
        }
      ] : []),
    ],
    // Suporte adicional caso o projeto utilize images.domains
    domains: R2_PUBLIC_HOST 
      ? ['www.videopapainoel.com', 'videopapainoel.com', 'pub-4a4f09b19c604fc88b20d7ddd1447673.r2.dev', R2_PUBLIC_HOST] 
      : ['www.videopapainoel.com', 'videopapainoel.com', 'pub-4a4f09b19c604fc88b20d7ddd1447673.r2.dev'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    // Allow blob: URLs for local image previews and be less restrictive
    contentSecurityPolicy: "default-src 'self'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; script-src 'none'; sandbox;",
    qualities: [50, 75, 85, 90, 95, 100],
    // Mobile-specific optimizations
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Configurações específicas para Vercel - sintaxe atualizada
  serverExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
  
  // Otimizações para reduzir tamanho do bundle
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Otimizações de build e performance
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Configurações experimentais para melhor performance
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
  
  // Configurações do Turbopack
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Configurações de compressão e otimização
  
  // Configurações de webpack para otimização
  webpack: (config, { dev, isServer }) => {
    // Otimizações para produção
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            // Mobile-specific chunk splitting
            mobile: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'mobile-core',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }
    
    // Mobile optimizations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Headers para cache e performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          ...(isDev ? [] : [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }]),
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://analytics.tiktok.com https://cdn.utmify.com.br https://js.stripe.com https://m.stripe.network https://fonts.googleapis.com https://vitals.vercel-insights.com https://staticxx.facebook.com https://vercel.live https://vercel.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live; font-src 'self' https://fonts.gstatic.com https://db.onlinewebfonts.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss: ws: https://vitals.vercel-insights.com https://vercel.live https://vercel.com https://api.mapbox.com https://api.opencagedata.com https://nominatim.openstreetmap.org https://api.stripe.com; media-src 'self' blob: https://pub-4a4f09b19c604fc88b20d7ddd1447673.r2.dev; frame-src 'self' https://www.youtube.com https://www.facebook.com https://staticxx.facebook.com https://www.youtube-nocookie.com https://vercel.live https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self';${isDev ? '' : ' upgrade-insecure-requests;'}`,
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400',
          },
        ],
      },
      // Headers específicos para arquivos de vídeo
      {
        source: '/videos/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'video/webm',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
        ],
      },
      {
        source: '/(.*)\\.webm',
        headers: [
          {
            key: 'Content-Type',
            value: 'video/webm',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
        ],
      },
      {
        source: '/(.*)\\.mp4',
        headers: [
          {
            key: 'Content-Type',
            value: 'video/mp4',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
        ],
      },
    ];
  },
  
  // Rewrites para evitar 404 em assets estáticos quando o locale está presente no caminho
  async rewrites() {
    return {
      beforeFiles: [
        // Reescrever o caminho dinâmico de c.js (gerado por tracking) para um stub local
        // Com e sem locale no caminho
        {
          source: '/:locale(pt|en|es)/:path*/a-4-a/c.js',
          destination: '/cjs-stub.js',
        },
        {
          source: '/:path*/a-4-a/c.js',
          destination: '/cjs-stub.js',
        },
        // Fallback de locale para páginas de personalização: /pers -> /pt/pers
        {
          source: '/pers',
          destination: '/pt/pers',
        },
        {
          source: '/pers/:path*',
          destination: '/pt/pers/:path*',
        },
        // Garantir que /pt/videos/... e similares apontem para /videos/...
        {
          source: '/:locale(pt|en|es)/videos/:path*',
          destination: '/videos/:path*',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};
export default withNextIntl(nextConfig);


