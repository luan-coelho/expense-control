import { Metadata } from 'next'
import { NotificationList, NotificationSettings, NotificationSimulator } from '@/components/notifications'
import { NotificationPreferences } from '@/components/notifications/notification-preferences'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata: Metadata = {
  title: 'Notificações',
  description: 'Gerencie suas notificações e alertas financeiros',
}

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">Gerencie suas notificações e configure alertas financeiros</p>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="simulator">Simulador</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationList mode="page" />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <NotificationPreferences />
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6">
          <div className="max-w-md">
            <NotificationSimulator />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
