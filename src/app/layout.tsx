import type { Metadata } from "next";
import Script from 'next/script';
import "./globals.css";

export const metadata: Metadata = {
  title: "Recadinhos do Papai Noel",
  description: "Crie recadinhos personalizados do Papai Noel para as crianças",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      

      <Script
        id="utmify-script-global"
        strategy="afterInteractive"
        src="https://cdn.utmify.com.br/scripts/utms/latest.js"
        data-utmify-prevent-xcod-sck
        data-utmify-prevent-subids
        data-utmify-meta-pixel-id={process.env.NEXT_PUBLIC_UTMIFY_META_PIXEL_ID}
      />

      {children}
    </>
  );
}
