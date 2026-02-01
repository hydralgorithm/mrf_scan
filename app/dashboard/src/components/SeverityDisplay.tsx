import { PredictionResult, SeverityResult } from '../types'

interface SeverityDisplayProps {
  severityResult: SeverityResult
  prediction: PredictionResult | null
}

export default function SeverityDisplay({ severityResult, prediction }: SeverityDisplayProps) {
  const getSeverityColor = (severity: number) => {
    if (severity === 0) return 'text-green-600 dark:text-green-400'
    if (severity <= 3) return 'text-yellow-600 dark:text-yellow-400'
    if (severity <= 6) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getSeverityGradient = (severity: number) => {
    if (severity === 0) return 'from-green-500 to-green-600'
    if (severity <= 3) return 'from-yellow-500 to-yellow-600'
    if (severity <= 6) return 'from-orange-500 to-orange-600'
    return 'from-red-500 to-red-600'
  }

  const getSeverityBg = (severity: number) => {
    if (severity === 0) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    if (severity <= 3) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    if (severity <= 6) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
        Clinical Severity Assessment
      </h2>

      {/* Main Severity Score */}
      <div className={`${getSeverityBg(severityResult.finalSeverity)} rounded-2xl p-8 border-2 text-center animate-fade-in`}>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
          Final Severity Score
        </p>
        <div className={`text-8xl font-bold mb-4 bg-gradient-to-r ${getSeverityGradient(severityResult.finalSeverity)} bg-clip-text text-transparent animate-pulse-slow`}>
          {severityResult.finalSeverity}/10
        </div>
        
        {/* Severity Bar */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
            <span>0</span>
            <span>2</span>
            <span>4</span>
            <span>6</span>
            <span>8</span>
            <span>10</span>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getSeverityGradient(severityResult.finalSeverity)} transition-all duration-1000 ease-out`}
              style={{ width: `${(severityResult.finalSeverity / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 animate-slide-up">
        <div className="flex items-start gap-4">
          <div className="text-4xl">
            {severityResult.finalSeverity === 0 ? '✓' :
             severityResult.finalSeverity <= 3 ? '⚠️' :
             severityResult.finalSeverity <= 6 ? '⚠️' : '🚨'}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {severityResult.interpretation}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {severityResult.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Pneumonia Type Note */}
      {prediction && prediction.classification !== 'NORMAL' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 animate-fade-in">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Pneumonia Type:</strong> {prediction.classification.replace('_', ' ')} detected.
            {prediction.classification === 'BACTERIAL_PNEUMONIA' 
              ? ' Higher baseline risk - typically requires antibiotic treatment.'
              : ' Standard baseline risk - may be managed with supportive care.'}
          </p>
        </div>
      )}
    </div>
  )
}
