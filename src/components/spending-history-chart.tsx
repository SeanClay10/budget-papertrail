'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
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

const tooltipStyle = {
  border: '2px solid var(--border)',
  boxShadow: '3px 3px 0px 0px var(--border)',
  borderRadius: '12px',
  fontSize: 12,
  fontFamily: 'var(--font-body)',
  backgroundColor: 'var(--card)',
  color: 'var(--foreground)',
}

export function SpendingHistoryChart({ data, categories }: SpendingHistoryChartProps) {
  const activeCategories = categories.filter(cat =>
    data.some(point => Number(point[cat.id] ?? 0) > 0)
  )

  const isEmpty = activeCategories.length === 0 || data.every(d => {
    const { month, ...rest } = d
    return Object.values(rest).every(v => Number(v) === 0)
  })

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm font-body">
        No spending data in the last 6 months yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" opacity={0.25} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fontFamily: 'var(--font-body)', fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fontFamily: 'var(--font-body)', fill: 'var(--muted-foreground)' }}
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
          contentStyle={tooltipStyle}
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        />
        <Legend
          formatter={(value: string) => {
            const cat = activeCategories.find(c => c.id === value)
            return <span style={{ fontSize: 11, fontFamily: 'var(--font-body)' }}>{cat ? `${cat.icon} ${cat.name}` : value}</span>
          }}
        />
        {activeCategories.map((cat, i) => (
          <Bar
            key={cat.id}
            dataKey={cat.id}
            stackId="spending"
            fill={cat.color}
            stroke="var(--border)"
            strokeWidth={1.5}
            radius={i === activeCategories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
