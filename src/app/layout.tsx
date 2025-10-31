import type { Metadata } from "next";
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
  return children;
}
