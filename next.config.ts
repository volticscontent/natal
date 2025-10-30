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
};

export default withNextIntl(nextConfig);
