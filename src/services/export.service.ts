import { type AnalyticsFilters, type SummaryMetricsResponse, type SpendingByCategoryResponse, type SpendingBySpaceResponse } from './analytics.service'

export interface ExportData {
  summaryMetrics?: SummaryMetricsResponse
  spendingByCategory?: SpendingByCategoryResponse
  spendingBySpace?: SpendingBySpaceResponse
  filters?: AnalyticsFilters
  reportDate: string
}

class ExportService {
  /**
   * Exportar dados para CSV
   */
  async exportToCSV(data: ExportData): Promise<void> {
    const csvContent = this.generateCSVContent(data)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const filename = this.generateFilename('csv', data.filters)
    this.downloadFile(blob, filename)
  }

  /**
   * Exportar dados para PDF
   */
  async exportToPDF(data: ExportData): Promise<void> {
    // Para PDF, vamos usar uma abordagem simples primeiro
    // Em uma implementação mais robusta, usaríamos bibliotecas como jsPDF ou Puppeteer
    const htmlContent = this.generateHTMLContent(data)
    
    // Criar uma nova janela para impressão/PDF
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Aguardar o carregamento e abrir diálogo de impressão
      printWindow.onload = () => {
        printWindow.print()
        // A janela será fechada após a impressão ou cancelamento
        printWindow.onafterprint = () => printWindow.close()
      }
    }
  }

  /**
   * Gerar conteúdo CSV
   */
  private generateCSVContent(data: ExportData): string {
    const lines: string[] = []
    
    // Cabeçalho do relatório
    lines.push('RELATÓRIO FINANCEIRO')
    lines.push(`Data de Geração: ${data.reportDate}`)
    
    if (data.filters) {
      lines.push('FILTROS APLICADOS')
      if (data.filters.startDate) lines.push(`Data Inicial: ${data.filters.startDate}`)
      if (data.filters.endDate) lines.push(`Data Final: ${data.filters.endDate}`)
      if (data.filters.spaceId) lines.push(`Espaço: ${data.filters.spaceId}`)
      if (data.filters.accountId) lines.push(`Conta: ${data.filters.accountId}`)
    }
    
    lines.push('') // Linha vazia
    
    // Métricas de resumo
    if (data.summaryMetrics) {
      lines.push('MÉTRICAS DE RESUMO')
      lines.push('Métrica,Valor,Quantidade')
      lines.push(`Total de Receitas,${data.summaryMetrics.current.formattedTotalIncome},${data.summaryMetrics.current.incomeCount}`)
      lines.push(`Total de Despesas,${data.summaryMetrics.current.formattedTotalExpenses},${data.summaryMetrics.current.expenseCount}`)
      lines.push(`Saldo Líquido,${data.summaryMetrics.current.formattedNetIncome},${data.summaryMetrics.current.transactionCount}`)
      lines.push(`Receita Média,${data.summaryMetrics.current.formattedAverageIncome},-`)
      lines.push(`Despesa Média,${data.summaryMetrics.current.formattedAverageExpense},-`)
      lines.push(`Categorias Ativas,-,${data.summaryMetrics.current.uniqueCategories}`)
      lines.push(`Espaços Ativos,-,${data.summaryMetrics.current.uniqueSpaces}`)
      
      // Comparação com período anterior
      if (data.summaryMetrics.comparison) {
        lines.push('')
        lines.push('COMPARAÇÃO COM PERÍODO ANTERIOR')
        lines.push('Métrica,Variação (%)')
        lines.push(`Receitas,${data.summaryMetrics.comparison.totalIncomeChange.toFixed(2)}%`)
        lines.push(`Despesas,${data.summaryMetrics.comparison.totalExpensesChange.toFixed(2)}%`)
        lines.push(`Saldo Líquido,${data.summaryMetrics.comparison.netIncomeChange.toFixed(2)}%`)
        lines.push(`Transações,${data.summaryMetrics.comparison.transactionCountChange.toFixed(2)}%`)
      }
      
      // Transações de destaque
      if (data.summaryMetrics.current.largestIncome || data.summaryMetrics.current.largestExpense) {
        lines.push('')
        lines.push('TRANSAÇÕES DE DESTAQUE')
        lines.push('Tipo,Valor,Descrição,Categoria,Espaço')
        
        if (data.summaryMetrics.current.largestIncome) {
          const income = data.summaryMetrics.current.largestIncome
          lines.push(`Maior Receita,${income.formattedAmount},"${income.description}",${income.categoryName || 'N/A'},${income.spaceName || 'N/A'}`)
        }
        
        if (data.summaryMetrics.current.largestExpense) {
          const expense = data.summaryMetrics.current.largestExpense
          lines.push(`Maior Despesa,${expense.formattedAmount},"${expense.description}",${expense.categoryName || 'N/A'},${expense.spaceName || 'N/A'}`)
        }
      }
    }
    
    // Gastos por categoria
    if (data.spendingByCategory && data.spendingByCategory.data.length > 0) {
      lines.push('')
      lines.push('GASTOS POR CATEGORIA')
      lines.push('Categoria,Valor,Percentual,Transações')
      
      data.spendingByCategory.data.forEach(category => {
        lines.push(`"${category.categoryName}",${category.formattedAmount},${category.percentage.toFixed(2)}%,${category.transactionCount}`)
      })
    }
    
    // Gastos por espaço
    if (data.spendingBySpace && data.spendingBySpace.data.length > 0) {
      lines.push('')
      lines.push('GASTOS POR ESPAÇO')
      lines.push('Espaço,Valor,Percentual,Transações')
      
      data.spendingBySpace.data.forEach(space => {
        lines.push(`"${space.spaceName}",${space.formattedAmount},${space.percentage.toFixed(2)}%,${space.transactionCount}`)
      })
    }
    
    return lines.join('\n')
  }

  /**
   * Gerar conteúdo HTML para PDF
   */
  private generateHTMLContent(data: ExportData): string {
    const styles = `
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          color: #333;
          line-height: 1.6;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          padding-bottom: 20px;
          border-bottom: 2px solid #eee;
        }
        .section { 
          margin-bottom: 30px; 
        }
        .section-title { 
          font-size: 18px; 
          font-weight: bold; 
          margin-bottom: 15px; 
          color: #2563eb;
          border-left: 4px solid #2563eb;
          padding-left: 10px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 12px; 
          text-align: left; 
        }
        th { 
          background-color: #f8f9fa; 
          font-weight: bold;
        }
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        .metric-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          background-color: #f8f9fa;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }
        .metric-label {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        .filters {
          background-color: #f1f5f9;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .comparison {
          background-color: #fef3c7;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
        @media print {
          body { margin: 0; }
          .section { page-break-inside: avoid; }
        }
      </style>
    `
    
    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório Financeiro</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <h1>Relatório Financeiro</h1>
          <p>Gerado em: ${data.reportDate}</p>
        </div>
    `
    
    // Filtros aplicados
    if (data.filters && Object.keys(data.filters).length > 0) {
      content += `
        <div class="section">
          <div class="section-title">Filtros Aplicados</div>
          <div class="filters">
      `
      
      if (data.filters.startDate) content += `<p><strong>Data Inicial:</strong> ${new Date(data.filters.startDate).toLocaleDateString('pt-BR')}</p>`
      if (data.filters.endDate) content += `<p><strong>Data Final:</strong> ${new Date(data.filters.endDate).toLocaleDateString('pt-BR')}</p>`
      if (data.filters.spaceId) content += `<p><strong>Espaço:</strong> ${data.filters.spaceId}</p>`
      if (data.filters.accountId) content += `<p><strong>Conta:</strong> ${data.filters.accountId}</p>`
      
      content += `
          </div>
        </div>
      `
    }
    
    // Métricas de resumo
    if (data.summaryMetrics) {
      const metrics = data.summaryMetrics.current
      
      content += `
        <div class="section">
          <div class="section-title">Resumo Financeiro</div>
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-value">${metrics.formattedTotalIncome}</div>
              <div class="metric-label">Total de Receitas (${metrics.incomeCount} transações)</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${metrics.formattedTotalExpenses}</div>
              <div class="metric-label">Total de Despesas (${metrics.expenseCount} transações)</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${metrics.formattedNetIncome}</div>
              <div class="metric-label">Saldo Líquido</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${metrics.transactionCount}</div>
              <div class="metric-label">Total de Transações</div>
            </div>
          </div>
        </div>
      `
      
      // Comparação com período anterior
      if (data.summaryMetrics.comparison) {
        const comp = data.summaryMetrics.comparison
        content += `
          <div class="section">
            <div class="section-title">Comparação com Período Anterior</div>
            <div class="comparison">
              <table>
                <thead>
                  <tr>
                    <th>Métrica</th>
                    <th>Variação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Receitas</td>
                    <td class="${comp.totalIncomeChange >= 0 ? 'positive' : 'negative'}">${comp.totalIncomeChange >= 0 ? '+' : ''}${comp.totalIncomeChange.toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td>Despesas</td>
                    <td class="${comp.totalExpensesChange <= 0 ? 'positive' : 'negative'}">${comp.totalExpensesChange >= 0 ? '+' : ''}${comp.totalExpensesChange.toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td>Saldo Líquido</td>
                    <td class="${comp.netIncomeChange >= 0 ? 'positive' : 'negative'}">${comp.netIncomeChange >= 0 ? '+' : ''}${comp.netIncomeChange.toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `
      }
      
      // Transações de destaque
      if (metrics.largestIncome || metrics.largestExpense) {
        content += `
          <div class="section">
            <div class="section-title">Transações de Destaque</div>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Espaço</th>
                </tr>
              </thead>
              <tbody>
        `
        
        if (metrics.largestIncome) {
          const income = metrics.largestIncome
          content += `
            <tr>
              <td>Maior Receita</td>
              <td>${income.formattedAmount}</td>
              <td>${income.description}</td>
              <td>${income.categoryName || 'N/A'}</td>
              <td>${income.spaceName || 'N/A'}</td>
            </tr>
          `
        }
        
        if (metrics.largestExpense) {
          const expense = metrics.largestExpense
          content += `
            <tr>
              <td>Maior Despesa</td>
              <td>${expense.formattedAmount}</td>
              <td>${expense.description}</td>
              <td>${expense.categoryName || 'N/A'}</td>
              <td>${expense.spaceName || 'N/A'}</td>
            </tr>
          `
        }
        
        content += `
              </tbody>
            </table>
          </div>
        `
      }
    }
    
    // Gastos por categoria
    if (data.spendingByCategory && data.spendingByCategory.data.length > 0) {
      content += `
        <div class="section">
          <div class="section-title">Gastos por Categoria</div>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Percentual</th>
                <th>Transações</th>
              </tr>
            </thead>
            <tbody>
      `
      
      data.spendingByCategory.data.forEach(category => {
        content += `
          <tr>
            <td>${category.categoryName}</td>
            <td>${category.formattedAmount}</td>
            <td>${category.percentage.toFixed(2)}%</td>
            <td>${category.transactionCount}</td>
          </tr>
        `
      })
      
      content += `
            </tbody>
          </table>
        </div>
      `
    }
    
    // Gastos por espaço
    if (data.spendingBySpace && data.spendingBySpace.data.length > 0) {
      content += `
        <div class="section">
          <div class="section-title">Gastos por Espaço</div>
          <table>
            <thead>
              <tr>
                <th>Espaço</th>
                <th>Valor</th>
                <th>Percentual</th>
                <th>Transações</th>
              </tr>
            </thead>
            <tbody>
      `
      
      data.spendingBySpace.data.forEach(space => {
        content += `
          <tr>
            <td>${space.spaceName}</td>
            <td>${space.formattedAmount}</td>
            <td>${space.percentage.toFixed(2)}%</td>
            <td>${space.transactionCount}</td>
          </tr>
        `
      })
      
      content += `
            </tbody>
          </table>
        </div>
      `
    }
    
    content += `
      </body>
      </html>
    `
    
    return content
  }

  /**
   * Gerar nome do arquivo
   */
  private generateFilename(extension: 'csv' | 'pdf', filters?: AnalyticsFilters): string {
    const date = new Date().toISOString().slice(0, 10)
    let filename = `relatorio-financeiro-${date}`
    
    if (filters?.startDate && filters?.endDate) {
      filename += `-${filters.startDate}-a-${filters.endDate}`
    }
    
    return `${filename}.${extension}`
  }

  /**
   * Fazer download do arquivo
   */
  private downloadFile(blob: Blob, filename: string): void {
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Limpar URL do objeto
    URL.revokeObjectURL(url)
  }
}

export const exportService = new ExportService()
export default exportService