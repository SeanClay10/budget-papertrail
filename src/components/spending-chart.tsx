'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { CategoryWithSpending } from '@/types/database'

interface SpendingChartProps {
  categories: CategoryWithSpending[]
}

export function SpendingChart({ categories }: SpendingChartProps) {
  const data = categories.filter(c => c.spent > 0).map(c => ({
    name: `${c.icon} ${c.name}`,
    value: c.spent,
    color: c.color,
  }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
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
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => typeof value === 'number' ? [`$${value.toFixed(2)}`, 'Spent'] : [String(value), 'Spent']}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend
          formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
          iconSize={10}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
