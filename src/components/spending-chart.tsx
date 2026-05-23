'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { CategoryWithSpending } from '@/types/database'

interface SpendingChartProps {
  categories: CategoryWithSpending[]
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

export function SpendingChart({ categories }: SpendingChartProps) {
  const data = categories.filter(c => c.spent > 0).map(c => ({
    name: `${c.icon} ${c.name}`,
    value: c.spent,
    color: c.color,
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm font-body">
        No spending recorded this month yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={72}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={2}
          stroke="var(--border)"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => typeof value === 'number' ? [`$${value.toFixed(2)}`, 'Spent'] : [String(value), 'Spent']}
          contentStyle={tooltipStyle}
        />
        <Legend
          formatter={(value) => <span style={{ fontSize: 11, fontFamily: 'var(--font-body)' }}>{value}</span>}
          iconSize={10}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
