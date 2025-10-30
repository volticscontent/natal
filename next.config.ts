import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import path from "path";

const withNextIntl = createNextIntlPlugin('./src/i18n/i18n.ts');

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: path.join(__dirname),
  images: {
    domains: ['www.elfisanta.com.br'],
  },
  // Configurações específicas para Vercel - sintaxe atualizada
  serverExternalPackages: ['@aws-sdk/client-s3'],
  // Configurações de build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default withNextIntl(nextConfig);
