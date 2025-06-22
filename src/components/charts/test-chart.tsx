'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { BaseChart } from './base-chart'

const testData = [
  { month: 'Jan', income: 4000, expenses: 2400 },
  { month: 'Fev', income: 3000, expenses: 1398 },
  { month: 'Mar', income: 2000, expenses: 9800 },
  { month: 'Abr', income: 2780, expenses: 3908 },
  { month: 'Mai', income: 1890, expenses: 4800 },
  { month: 'Jun', income: 2390, expenses: 3800 },
]

export function TestChart() {
  return (
    <BaseChart height={400} className="p-4">
      <LineChart data={testData}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Receitas" />
        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Despesas" />
      </LineChart>
    </BaseChart>
  )
}
