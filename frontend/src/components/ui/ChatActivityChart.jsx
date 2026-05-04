import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// Sample data - used as fallback if no real data provided
const generateChartData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map(day => ({
    name: day,
    active: Math.floor(Math.random() * 50) + 20,
    escalated: Math.floor(Math.random() * 20) + 5,
    assigned: Math.floor(Math.random() * 30) + 10,
  }))
}

export default function ChatActivityChart({ data, type = 'bar' }) {
  // Use provided data or generate sample data
  const chartData = data && data.length > 0 ? data : generateChartData()

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-400 capitalize">{entry.name}:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const chartConfig = {
    active: { 
      color: '#10b981', // green
      name: 'Active AI'
    },
    escalated: { 
      color: '#ef4444', // red
      name: 'Escalated'
    },
    assigned: { 
      color: '#3b82f6', // blue
      name: 'Assigned'
    },
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {type === 'line' ? (
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="currentColor" 
            className="text-gray-200 dark:text-slate-700" 
            vertical={false}
          />
          <XAxis 
            dataKey="name" 
            stroke="currentColor" 
            className="text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="currentColor" 
            className="text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          <Line 
            type="monotone" 
            dataKey="active" 
            stroke={chartConfig.active.color}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name={chartConfig.active.name}
          />
          <Line 
            type="monotone" 
            dataKey="escalated" 
            stroke={chartConfig.escalated.color}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name={chartConfig.escalated.name}
          />
          <Line 
            type="monotone" 
            dataKey="assigned" 
            stroke={chartConfig.assigned.color}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name={chartConfig.assigned.name}
          />
        </LineChart>
      ) : (
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="currentColor" 
            className="text-gray-200 dark:text-slate-700" 
            vertical={false}
          />
          <XAxis 
            dataKey="name" 
            stroke="currentColor" 
            className="text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="currentColor" 
            className="text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          <Bar 
            dataKey="active" 
            fill={chartConfig.active.color}
            radius={[4, 4, 0, 0]}
            name={chartConfig.active.name}
          />
          <Bar 
            dataKey="escalated" 
            fill={chartConfig.escalated.color}
            radius={[4, 4, 0, 0]}
            name={chartConfig.escalated.name}
          />
          <Bar 
            dataKey="assigned" 
            fill={chartConfig.assigned.color}
            radius={[4, 4, 0, 0]}
            name={chartConfig.assigned.name}
          />
        </BarChart>
      )}
    </ResponsiveContainer>
  )
}
