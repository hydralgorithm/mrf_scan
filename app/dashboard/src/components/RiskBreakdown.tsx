import { PredictionResult } from '../types'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface RiskBreakdownProps {
  breakdown: Array<{ label: string; points: number; description: string }>
  curb65Score: number
  prediction: PredictionResult
}

export default function RiskBreakdown({ breakdown, curb65Score, prediction }: RiskBreakdownProps) {
  const chartData = breakdown.map(item => ({
    name: item.label,
    value: item.points,
    description: item.description
  }))

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
        Risk Breakdown
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CURB-65 Components */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            CURB-65 Component Scores
          </h3>
          <div className="space-y-3">
            {breakdown.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  item.points > 0
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {item.label}
                  </span>
                  <span className={`badge ${item.points > 0 ? 'badge-red' : 'badge-green'}`}>
                    {item.points} point{item.points !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Visual Chart */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Score Distribution
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Summary */}
          <div className="bg-medical-blue-light dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Total CURB-65 Score:</strong> {curb65Score}/5
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              <strong>X-ray Classification:</strong> {prediction.classification.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
