import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const Chart = ({ data }: { data: { timestamp: number; price: number }[] }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

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

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
        >
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={value => `$${value.toLocaleString()}`}
            tick={{ fontSize: 12 }}
            domain={['dataMin - 1000', 'dataMax + 1000']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#333"
            dot={true}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default Chart
