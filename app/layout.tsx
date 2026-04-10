import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ProLang — Professional Translation Services',
  description: 'Certified document translation services. Fast, accurate, legally recognized.',
  keywords: 'translation, certified translation, document translation, Mongolia, Mongolian',
  openGraph: {
    title: 'ProLang Translation Services',
    description: 'Professional certified document translation',
    url: 'https://prolang.mbg.mn',
    siteName: 'ProLang',
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
