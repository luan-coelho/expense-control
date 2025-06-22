'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExportSection } from '@/components/import-export/export-section'
import { ImportSection } from '@/components/import-export/import-section'
import { OperationHistory } from '@/components/import-export/operation-history'
import { Download, Upload, History } from 'lucide-react'

export default function ImportExportPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Importação e Exportação</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus dados financeiros com importação e exportação de arquivos
          </p>
        </div>
      </div>

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exportar Dados
              </CardTitle>
              <CardDescription>
                Exporte suas transações, relatórios ou faça backup completo dos seus dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExportSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importar Dados
              </CardTitle>
              <CardDescription>Importe transações a partir de arquivos CSV ou Excel</CardDescription>
            </CardHeader>
            <CardContent>
              <ImportSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Operações
              </CardTitle>
              <CardDescription>Visualize o histórico de importações e exportações realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <OperationHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
