import { PredictionResult, SeverityResult } from '../types'

interface SeverityDisplayProps {
  severityResult: SeverityResult
  prediction: PredictionResult | null
}

export default function SeverityDisplay({ severityResult, prediction }: SeverityDisplayProps) {
  const isAdvisoryOnly = Boolean(severityResult.advisoryOnly)
  const isReassuranceOnly = Boolean(severityResult.reassuranceOnly)
  const mode: 'standard' | 'advisory' | 'reassure' = isReassuranceOnly
    ? 'reassure'
    : isAdvisoryOnly
      ? 'advisory'
      : 'standard'

  const getSeverityGradient = (severity: number) => {
    if (severity === 0) return 'from-green-500 to-green-600'
    if (severity <= 3) return 'from-yellow-500 to-yellow-600'
    if (severity <= 6) return 'from-orange-500 to-orange-600'
    return 'from-red-500 to-red-600'
  }

  const getAdvisoryBg = () => {
    if (severityResult.riskLevel === 'high') {
      return 'bg-rose-950/40 border-rose-400/60'
    }
    return 'bg-amber-950/35 border-amber-300/55'
  }

  const getAdvisoryTitle = () => severityResult.advisoryTitle || 'Clinical Advisory'

  const getTone = () => {
    if (mode === 'reassure') {
      return {
        heroBg: 'bg-[linear-gradient(135deg,rgba(12,63,56,0.94),rgba(8,39,35,0.94))] border-emerald-300/45',
        chip: 'bg-emerald-300/20 text-emerald-100 border-emerald-200/40',
        headline: 'from-emerald-200 via-cyan-200 to-teal-100',
        body: 'bg-[rgba(10,35,31,0.8)] border-emerald-200/20 text-emerald-100/90',
        icon: '✅',
        eyebrow: 'Reassuring Findings'
      }
    }

    if (mode === 'advisory') {
      if (severityResult.riskLevel === 'high') {
        return {
          heroBg: 'bg-rose-950/40 border-rose-400/60',
          chip: 'bg-rose-400/20 text-rose-100 border-rose-300/40',
          headline: 'from-rose-200 via-violet-200 to-amber-200',
          body: 'bg-[rgba(38,10,24,0.7)] border-rose-300/25 text-rose-100/90',
          icon: '🚨',
          eyebrow: getAdvisoryTitle()
        }
      }

      return {
        heroBg: 'bg-amber-950/35 border-amber-300/55',
        chip: 'bg-amber-300/20 text-amber-100 border-amber-200/40',
        headline: 'from-amber-200 via-violet-200 to-rose-200',
        body: 'bg-[rgba(41,27,10,0.72)] border-amber-300/25 text-amber-100/90',
        icon: '⚠️',
        eyebrow: getAdvisoryTitle()
      }
    }

    if (severityResult.finalSeverity === 0) {
      return {
        heroBg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        chip: 'bg-green-300/20 text-green-100 border-green-200/40',
        headline: 'from-green-400 to-green-600',
        body: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
        icon: '✓',
        eyebrow: 'Clinical Severity'
      }
    }

    if (severityResult.finalSeverity <= 3) {
      return {
        heroBg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        chip: 'bg-yellow-300/20 text-yellow-100 border-yellow-200/40',
        headline: 'from-yellow-500 to-yellow-600',
        body: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
        icon: '⚠️',
        eyebrow: 'Clinical Severity'
      }
    }

    if (severityResult.finalSeverity <= 6) {
      return {
        heroBg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
        chip: 'bg-orange-300/20 text-orange-100 border-orange-200/40',
        headline: 'from-orange-500 to-orange-600',
        body: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
        icon: '⚠️',
        eyebrow: 'Clinical Severity'
      }
    }

    return {
      heroBg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      chip: 'bg-rose-300/20 text-rose-100 border-rose-200/40',
      headline: 'from-red-500 to-red-600',
      body: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
      icon: '🚨',
      eyebrow: 'Clinical Severity'
    }
  }

  const tone = getTone()

  const getPrimaryText = () => {
    if (mode === 'reassure') return 'No Pneumonia Detected'
    if (mode === 'advisory') return 'Clinical Review Recommended'
    return `${severityResult.finalSeverity}/10`
  }

  const getSecondaryText = () => {
    if (mode === 'reassure') return 'CURB-65 is low risk. Continue monitoring symptoms.'
    if (mode === 'advisory') return 'X-ray may be normal, but clinical findings need physician review.'
    return 'Final Severity Score'
  }

  const cleanInterpretation = severityResult.interpretation
    .replace(/^[^A-Za-z0-9]+/u, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
        Clinical Severity Assessment
      </h2>

      <div className={`${mode === 'advisory' ? getAdvisoryBg() : tone.heroBg} rounded-2xl p-6 border-2 animate-fade-in text-center`}>
        <p className="text-xs uppercase tracking-[0.16em] text-gray-200/80 mb-2">
          {tone.eyebrow}
        </p>
        <h3 className={`text-5xl font-black tracking-tight bg-gradient-to-r ${tone.headline} bg-clip-text text-transparent mb-2`}>
          {getPrimaryText()}
        </h3>
        <p className="text-sm text-gray-200/90 leading-relaxed max-w-3xl mx-auto">
          {getSecondaryText()}
        </p>

        {mode === 'standard' && (
          <div className="max-w-2xl mx-auto mt-5">
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
        )}
      </div>

      <div className={`${tone.body} rounded-lg p-6 border animate-slide-up`}>
        <div className="flex items-start gap-4">
          <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/10 text-xl">
            {tone.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">
              {cleanInterpretation}
            </h3>
            <p className="leading-relaxed text-sm md:text-base">
              {severityResult.recommendation}
            </p>
          </div>
          <div className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold border ${tone.chip}`}>
            CURB-65: {severityResult.curb65Score}/5
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
