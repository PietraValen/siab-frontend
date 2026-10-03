import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIAB — Sistema de Identificação e Autenticação Biométrica",
  description:
    "Controle de acesso biométrico facial com três níveis de permissão. Projeto de APS — PIVC — UNIP.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Ícones de telemetria/status usados nos painéis administrativos e
            no terminal de reconhecimento (ver components/ui/Icon.tsx).
            display=block evita mostrar o nome do ícone como texto enquanto
            a fonte carrega. no-page-custom-font não se aplica ao App Router:
            este layout raiz vale para todas as páginas. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
