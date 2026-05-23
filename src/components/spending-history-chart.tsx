'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export interface HistoryDataPoint {
  month: string
  [categoryId: string]: string | number
}

export interface HistoryCategory {
  id: string
  name: string
  color: string
  icon: string
}

interface SpendingHistoryChartProps {
  data: HistoryDataPoint[]
  categories: HistoryCategory[]
}

export function SpendingHistoryChart({ data, categories }: SpendingHistoryChartProps) {
  // Only render bars for categories that have any spending in the period
  const activeCategories = categories.filter(cat =>
    data.some(point => Number(point[cat.id] ?? 0) > 0)
  )

  if (activeCategories.length === 0 || data.every(d => {
    const { month, ...rest } = d
    return Object.values(rest).every(v => Number(v) === 0)
  })) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No spending data in the last 6 months yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `$${v}`}
          width={48}
        />
        <Tooltip
          formatter={(value, name) => {
            const nameStr = String(name ?? '')
            const cat = activeCategories.find(c => c.id === nameStr)
            return [`$${Number(value ?? 0).toFixed(2)}`, cat ? `${cat.icon} ${cat.name}` : nameStr]
          }}
          contentStyle={{ fontSize: 12 }}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
        <Legend
          formatter={(value: string) => {
            const cat = activeCategories.find(c => c.id === value)
            return <span style={{ fontSize: 11 }}>{cat ? `${cat.icon} ${cat.name}` : value}</span>
          }}
        />
        {activeCategories.map(cat => (
          <Bar
            key={cat.id}
            dataKey={cat.id}
            stackId="spending"
            fill={cat.color}
            radius={activeCategories[activeCategories.length - 1].id === cat.id ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
