import { PredictionResult, CURB65Data, SeverityResult } from '../types'

interface ClinicalReportProps {
  prediction: PredictionResult
  curb65Data: CURB65Data
  severityResult: SeverityResult
  curb65Breakdown: Array<{ label: string; points: number; description: string }>
  imageUrl: string | null
  onClose: () => void
}

export default function ClinicalReport({
  prediction,
  curb65Data,
  severityResult,
  curb65Breakdown,
  imageUrl,
  onClose
}: ClinicalReportProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const reportContent = generateReportText()
    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clinical-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateReportText = () => {
    const timestamp = new Date().toLocaleString()
    return `
PNEUMONIA SEVERITY ASSESSMENT - CLINICAL REPORT
Generated: ${timestamp}

═══════════════════════════════════════════════════════════

X-RAY CLASSIFICATION
───────────────────────────────────────────────────────────
Classification: ${prediction.classification.replace('_', ' ')}
Confidence: ${(prediction.confidence * 100).toFixed(1)}%

Probability Breakdown:
  - NORMAL: ${((prediction.probabilities || prediction.adjusted_probabilities)?.NORMAL * 100 || 0).toFixed(1)}%
  - BACTERIAL_PNEUMONIA: ${((prediction.probabilities || prediction.adjusted_probabilities)?.BACTERIAL_PNEUMONIA * 100 || 0).toFixed(1)}%
  - VIRAL_PNEUMONIA: ${((prediction.probabilities || prediction.adjusted_probabilities)?.VIRAL_PNEUMONIA * 100 || 0).toFixed(1)}%

═══════════════════════════════════════════════════════════

CURB-65 RISK ASSESSMENT
───────────────────────────────────────────────────────────
Age: ${curb65Data.age ?? 'Not specified'} years
Respiratory Rate: ${curb65Data.respiratoryRate ?? 'Not specified'} breaths/min
Blood Pressure: ${curb65Data.systolicBP ?? 'N/A'}/${curb65Data.diastolicBP ?? 'N/A'} mmHg
Confusion: ${curb65Data.confusion ? 'Yes' : 'No'}
Urea Level: ${curb65Data.urea ?? 'Not specified'} mmol/L

CURB-65 Score: ${severityResult.curb65Score}/5

Component Breakdown:
${curb65Breakdown.map(item => `  - ${item.label}: ${item.points} point(s) - ${item.description}`).join('\n')}

═══════════════════════════════════════════════════════════

CLINICAL SEVERITY ASSESSMENT
───────────────────────────────────────────────────────────
Final Severity Score: ${severityResult.finalSeverity}/10

Interpretation: ${severityResult.interpretation}

Clinical Recommendation:
${severityResult.recommendation}

Risk Level: ${severityResult.riskLevel.toUpperCase()}

═══════════════════════════════════════════════════════════

END OF REPORT
═══════════════════════════════════════════════════════════
    `.trim()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto glass-card animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-medical-blue dark:text-blue-400">
            Clinical Report
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Report Content */}
        <div className="p-6 space-y-6 print:p-8">
          {/* Header Section */}
          <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Pneumonia Severity Assessment
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Clinical Decision Support Report
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Generated: {new Date().toLocaleString()}
            </p>
          </div>

          {/* X-ray Classification */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              X-ray Classification
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
              <p>
                <strong>Classification:</strong>{' '}
                <span className="text-medical-blue dark:text-blue-400 font-semibold">
                  {prediction.classification.replace('_', ' ')}
                </span>
              </p>
              <p>
                <strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(1)}%
              </p>
              <div className="mt-3">
                <p className="text-sm font-semibold mb-2">Probability Breakdown:</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {Object.entries(prediction.probabilities || prediction.adjusted_probabilities || {}).map(([key, value]) => (
                    <div key={key} className="bg-white dark:bg-gray-800 rounded p-2">
                      <p className="font-semibold">{key.replace('_', ' ')}</p>
                      <p className="text-gray-600 dark:text-gray-400">{(value * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CURB-65 Assessment */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              CURB-65 Risk Assessment
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong>Age:</strong> {curb65Data.age ?? 'Not specified'} years</p>
                <p><strong>Respiratory Rate:</strong> {curb65Data.respiratoryRate ?? 'Not specified'} breaths/min</p>
                <p><strong>Blood Pressure:</strong> {curb65Data.systolicBP ?? 'N/A'}/{curb65Data.diastolicBP ?? 'N/A'} mmHg</p>
                <p><strong>Confusion:</strong> {curb65Data.confusion ? 'Yes' : 'No'}</p>
                <p><strong>Urea Level:</strong> {curb65Data.urea ?? 'Not specified'} mmol/L</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-lg font-bold">
                  CURB-65 Score: <span className="text-medical-blue dark:text-blue-400">{severityResult.curb65Score}/5</span>
                </p>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-sm font-semibold">Component Breakdown:</p>
                {curb65Breakdown.map((item, idx) => (
                  <p key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                    • {item.label}: {item.points} point(s) - {item.description}
                  </p>
                ))}
              </div>
            </div>
          </section>

          {/* Severity Assessment */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Clinical Severity Assessment
            </h3>
            <div className="bg-gradient-to-r from-medical-blue-light to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border-2 border-medical-blue dark:border-blue-700">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Final Severity Score</p>
                <p className="text-6xl font-bold text-medical-blue dark:text-blue-400">
                  {severityResult.finalSeverity}/10
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <p className="font-semibold text-lg">{severityResult.interpretation}</p>
                <p className="text-gray-700 dark:text-gray-300">{severityResult.recommendation}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Risk Level: <strong>{severityResult.riskLevel.toUpperCase()}</strong>
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>This report is generated for clinical decision support purposes.</p>
            <p>Always correlate with clinical findings and professional judgment.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-4 justify-end print:hidden">
          <button
            onClick={handleDownload}
            className="medical-button-secondary"
          >
            📥 Download as Text
          </button>
          <button
            onClick={handlePrint}
            className="medical-button-primary"
          >
            🖨️ Print Report
          </button>
          <button
            onClick={onClose}
            className="medical-button-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
