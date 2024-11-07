import { cn } from '@/lib/utils'
import React, { useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { BarChart2, LineChart as LineIcon } from 'lucide-react'

interface ChartProps {
  data: { timestamp: number; price: number }[]
  className?: string
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString()
}

const Chart = ({ data, className }: ChartProps) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>(data.length === 1 ? 'bar' : 'line')

  const getYAxisDomain = () => {
    if (chartType === 'bar') {
      const maxValue = Math.max(...data.map(d => d.price))
      return [0, Math.ceil(maxValue * 1.1)]
    }
    return ['dataMin - 1000', 'dataMax + 1000']
  }

  const ChartComponent = chartType === 'bar' ? (
    <BarChart
      className="hover:bg-transparent"
      data={data}
      margin={{ top: 30, right: 30, left: 0, bottom: 20 }}
    >
      <XAxis
        dataKey="timestamp"
        tickFormatter={formatDate}
        tick={{ fontSize: 12 }}
      />
      <YAxis
        tickFormatter={value => `$${value.toLocaleString()}`}
        tick={{ fontSize: 12 }}
        domain={getYAxisDomain()}
      />
      <Tooltip
        content={<CustomTooltip />}
        cursor={{
          fill: 'transparent'
        }}
      />
      <Bar
        dataKey="price"
        fill="#333"
        radius={[4, 4, 0, 0]}
        maxBarSize={60}
      />
    </BarChart>
  ) : (
    <LineChart data={data} margin={{ top: 30, right: 30, left: 0, bottom: 20 }}>
      <XAxis
        dataKey="timestamp"
        tickFormatter={formatDate}
        tick={{ fontSize: 12 }}
      />
      <YAxis
        tickFormatter={value => `$${value.toLocaleString()}`}
        tick={{ fontSize: 12 }}
        domain={getYAxisDomain()}
      />
      <Tooltip
        content={<CustomTooltip />}
        cursor={{
          fill: 'transparent'
        }}
      />
      <Line
        type="monotone"
        dataKey="price"
        stroke="#333"
        dot={true}
        strokeWidth={2}
      />
    </LineChart>
  )

  return (
    <div className={cn('-space-y-8 mt-8', className)}>
      <div className="flex justify-end relative z-30 space-x-2">
        <button
          onClick={() => setChartType('line')}
          className={cn(
            'p-2 rounded-md transition-colors',
            chartType === 'line'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          )}
          aria-label="Switch to line chart"
        >
          <LineIcon size={20} />
        </button>
        <button
          onClick={() => setChartType('bar')}
          className={cn(
            'p-2 rounded-md transition-colors',
            chartType === 'bar'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          )}
          aria-label="Switch to bar chart"
        >
          <BarChart2 size={20} />
        </button>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {ChartComponent}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Chart

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg p-3">
        <p className="text-zinc-400 text-sm mb-1">{formatDate(label)}</p>
        <p className="text-white font-medium">
          Price: ${payload[0].value.toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}