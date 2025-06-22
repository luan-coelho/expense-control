'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { NotificationList } from '@/components/notifications/notification-list'
import { useUnreadNotificationsCount } from '@/hooks/use-notifications'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data: unreadCount } = useUnreadNotificationsCount()

  const count = unreadCount?.count || 0
  const hasNotifications = count > 0

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-4 w-4" />
          {hasNotifications && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <NotificationList mode="dropdown" />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
