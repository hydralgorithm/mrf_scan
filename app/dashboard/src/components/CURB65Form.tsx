import { CURB65Data } from '../types'

interface CURB65FormProps {
  data: CURB65Data
  onChange: (field: keyof CURB65Data, value: any) => void
  score: number
  showScore?: boolean
}

export default function CURB65Form({ data, onChange, score, showScore = false }: CURB65FormProps) {
  const getRiskLevel = () => {
    if (score <= 1) {
      return {
        level: 'Low',
        panelClass: 'risk-score-panel risk-score-low',
        chipClass: 'risk-chip risk-chip-low',
        icon: '🟢'
      }
    }
    if (score === 2) {
      return {
        level: 'Moderate',
        panelClass: 'risk-score-panel risk-score-moderate',
        chipClass: 'risk-chip risk-chip-moderate',
        icon: '🟠'
      }
    }
    return {
      level: 'High',
      panelClass: 'risk-score-panel risk-score-high',
      chipClass: 'risk-chip risk-chip-high',
      icon: '🔴'
    }
  }

  const risk = getRiskLevel()

  return (
    <div className="space-y-6">
      {/* CURB-65 Score Display */}
      {showScore && (
        <div className={risk.panelClass}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/70 mb-2">CURB-65 Score</p>
              <p className="text-5xl font-black tracking-tight text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.45)]">
                {score}/5
              </p>
            </div>
            <span className={risk.chipClass}>
              <span>{risk.icon}</span> {risk.level} Risk
            </span>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <span className="inline-flex items-center gap-2">
              👤 Age (years)
            </span>
          </label>
          <input
            type="number"
            min="0"
            max="120"
            value={data.age ?? ''}
            onChange={(e) => onChange('age', e.target.value ? parseInt(e.target.value) : null)}
            className="input-field"
            placeholder="e.g., 45"
          />
        </div>

        {/* Respiratory Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <span className="inline-flex items-center gap-2">
              🫁 Respiratory Rate (breaths/min)
            </span>
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={data.respiratoryRate ?? ''}
            onChange={(e) => onChange('respiratoryRate', e.target.value ? parseInt(e.target.value) : null)}
            className="input-field"
            placeholder="Normal: 12-20 breaths/min"
          />
        </div>

        {/* Blood Pressure */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <span className="inline-flex items-center gap-2">
              ❤️ Blood Pressure (mmHg)
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                min="0"
                max="300"
                value={data.systolicBP ?? ''}
                onChange={(e) => onChange('systolicBP', e.target.value ? parseInt(e.target.value) : null)}
                className="input-field"
                placeholder="Normal: 120"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Systolic</p>
            </div>
            <div>
              <input
                type="number"
                min="0"
                max="200"
                value={data.diastolicBP ?? ''}
                onChange={(e) => onChange('diastolicBP', e.target.value ? parseInt(e.target.value) : null)}
                className="input-field"
                placeholder="Normal: 80"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Diastolic</p>
            </div>
          </div>
        </div>

        {/* Confusion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <span className="inline-flex items-center gap-2">
              🧠 Confusion Status
            </span>
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => onChange('confusion', false)}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-200 ${
                !data.confusion
                  ? 'bg-medical-blue text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              No Confusion
            </button>
            <button
              type="button"
              onClick={() => onChange('confusion', true)}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-200 ${
                data.confusion
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Confusion Present
            </button>
          </div>
        </div>

        {/* Urea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <span className="inline-flex items-center gap-2">
              🧪 Urea Level (mmol/L) <span className="text-xs text-gray-500">(Optional)</span>
            </span>
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={data.urea ?? ''}
            onChange={(e) => onChange('urea', e.target.value ? parseFloat(e.target.value) : null)}
            className="input-field"
            placeholder="Normal: 2.5-6.7 mmol/L"
          />
        </div>
      </div>
    </div>
  )
}
