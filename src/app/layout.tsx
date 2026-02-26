import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JF Ajuda — Mapa de Emergência',
  description:
    'Mapa colaborativo e anônimo de pedidos de ajuda durante emergências em Juiz de Fora, MG, Brasil.',
  keywords: ['emergência', 'ajuda', 'Juiz de Fora', 'MG', 'mapa', 'crise'],
  authors: [{ name: 'Comunidade JF Ajuda' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#b91c1c',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
