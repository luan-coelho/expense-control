'use client'

import { UserMenu } from '@/components/auth/user-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { SpaceSelector } from './space-selector'
import { NotificationBell } from '@/components/notifications'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />

      <div className="flex flex-1 items-center justify-between gap-4">
        <SpaceSelector />

        <div className="flex items-center gap-2">
          <NotificationBell />

          <ThemeToggle />

          <UserMenu />
        </div>
      </div>
    </header>
  )
}
