import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Foerderberater Portal',
  description: 'KI-gestuetztes Portal fuer oesterreichische Foerderantraege',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
