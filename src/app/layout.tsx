import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lake Show Analytics',
  description: 'LA Lakers Player Development & Opponent Scouting Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface text-gray-100 antialiased">
        {children}
      </body>
    </html>
  )
}
