import { QueryProvider } from '@/components/providers/query-provider'
import { SessionProvider } from '@/components/providers/session-provider'
import { SpaceProvider } from '@/components/providers/space-provider'
import { ThemeConfigProvider } from '@/components/providers/theme-config-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AppLayout } from '@/components/layout/app-layout'
import { Toaster } from '@/components/ui/sonner'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Expense Control - Controle de Despesas',
  description: 'Sistema de controle de despesas',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <ThemeConfigProvider>
            <SessionProvider>
              <QueryProvider>
                <SpaceProvider>
                  <AppLayout>{children}</AppLayout>
                  <Toaster />
                </SpaceProvider>
              </QueryProvider>
            </SessionProvider>
          </ThemeConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
