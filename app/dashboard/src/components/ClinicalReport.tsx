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
  imageUrl: _imageUrl,
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
Urea Level: ${curb65Data.urea ?? 'Not specified'} ${curb65Data.ureaUnit}

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

  const classificationLabel = prediction.classification.replace('_', ' ')
  const probabilityMap = prediction.probabilities || prediction.adjusted_probabilities || {
    NORMAL: 0,
    BACTERIAL_PNEUMONIA: 0,
    VIRAL_PNEUMONIA: 0
  }

  const getClassificationTone = () => {
    if (prediction.classification === 'NORMAL') {
      return {
        panel: 'border-emerald-300/45 bg-[linear-gradient(135deg,rgba(8,59,49,0.75),rgba(7,35,29,0.78))]',
        badge: 'bg-emerald-300/20 text-emerald-100 border border-emerald-200/40',
        dot: 'bg-emerald-300',
        icon: '✓'
      }
    }

    if (prediction.classification === 'VIRAL_PNEUMONIA') {
      return {
        panel: 'border-rose-300/45 bg-[linear-gradient(135deg,rgba(64,11,30,0.76),rgba(33,8,19,0.78))]',
        badge: 'bg-rose-300/20 text-rose-100 border border-rose-200/40',
        dot: 'bg-rose-300',
        icon: '🫁'
      }
    }

    return {
      panel: 'border-sky-300/45 bg-[linear-gradient(135deg,rgba(16,37,64,0.76),rgba(10,23,40,0.78))]',
      badge: 'bg-sky-300/20 text-sky-100 border border-sky-200/40',
      dot: 'bg-sky-300',
      icon: '🫁'
    }
  }

  const getRiskTone = () => {
    if (severityResult.riskLevel === 'high') {
      return 'text-rose-100 bg-rose-300/20 border border-rose-200/40'
    }
    if (severityResult.riskLevel === 'moderate') {
      return 'text-amber-100 bg-amber-300/20 border border-amber-200/40'
    }
    return 'text-emerald-100 bg-emerald-300/20 border border-emerald-200/40'
  }

  const tone = getClassificationTone()

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-violet-300/25 bg-[linear-gradient(160deg,rgba(17,12,30,0.96),rgba(11,8,21,0.97))] shadow-[0_24px_80px_rgba(0,0,0,0.58)] animate-slide-up">
        <div className="sticky top-0 z-10 border-b border-violet-300/20 bg-[linear-gradient(180deg,rgba(22,16,39,0.96),rgba(16,12,30,0.94))] px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-violet-200/70 mb-1">Clinical Decision Support</p>
            <h2 className="text-2xl md:text-3xl font-black text-violet-50">Pneumonia Clinical Report</h2>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-violet-300/30 text-violet-100/90 hover:bg-violet-300/15 transition-colors"
            aria-label="Close report"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(92vh-138px)] px-6 py-6 space-y-6 print:px-8 print:py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-xl border p-5 ${tone.panel}`}>
              <p className="text-xs uppercase tracking-[0.16em] text-violet-100/75 mb-2">Model Classification</p>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-3xl font-black text-white leading-[1.05] tracking-tight break-words">{classificationLabel}</h3>
                  <p className="mt-2 text-sm text-violet-100/80">Confidence {(prediction.confidence * 100).toFixed(1)}%</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.05em] ${tone.badge}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
                  {tone.icon} {classificationLabel}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-violet-300/25 bg-[linear-gradient(135deg,rgba(29,20,50,0.72),rgba(17,12,30,0.76))] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-violet-100/75 mb-2">Clinical Summary</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-violet-300/20 bg-black/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-violet-100/65">CURB-65</p>
                  <p className="text-2xl font-black text-white">{severityResult.curb65Score}/5</p>
                </div>
                <div className="rounded-lg border border-violet-300/20 bg-black/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-violet-100/65">Severity</p>
                  <p className="text-2xl font-black text-white">{severityResult.finalSeverity}/10</p>
                </div>
                <div className="rounded-lg border border-violet-300/20 bg-black/20 p-3 col-span-2 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-violet-100/65">Risk Level</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${getRiskTone()}`}>
                    {severityResult.riskLevel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <section className="rounded-xl border border-violet-300/20 bg-[rgba(18,13,32,0.74)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-violet-50">Probability Breakdown</h3>
              <p className="text-xs text-violet-200/70 uppercase tracking-[0.12em]">Model Distribution</p>
            </div>
            <div className="space-y-3">
              {Object.entries(probabilityMap).map(([key, value]) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-semibold text-violet-100">{key.replace('_', ' ')}</p>
                    <p className="text-violet-100/80">{(value * 100).toFixed(1)}%</p>
                  </div>
                  <div className="h-2.5 bg-black/35 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 transition-all duration-700"
                      style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-violet-300/20 bg-[rgba(18,13,32,0.74)] p-5">
            <h3 className="text-lg font-bold text-violet-50 mb-4">CURB-65 Inputs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="rounded-lg border border-violet-300/20 bg-black/20 p-3">
                <p className="text-xs text-violet-200/70">Age</p>
                <p className="text-base font-semibold text-violet-50">{curb65Data.age ?? 'Not specified'} years</p>
              </div>
              <div className="rounded-lg border border-violet-300/20 bg-black/20 p-3">
                <p className="text-xs text-violet-200/70">Respiratory Rate</p>
                <p className="text-base font-semibold text-violet-50">{curb65Data.respiratoryRate ?? 'Not specified'} breaths/min</p>
              </div>
              <div className="rounded-lg border border-violet-300/20 bg-black/20 p-3">
                <p className="text-xs text-violet-200/70">Blood Pressure</p>
                <p className="text-base font-semibold text-violet-50">{curb65Data.systolicBP ?? 'N/A'}/{curb65Data.diastolicBP ?? 'N/A'} mmHg</p>
              </div>
              <div className="rounded-lg border border-violet-300/20 bg-black/20 p-3">
                <p className="text-xs text-violet-200/70">Confusion</p>
                <p className="text-base font-semibold text-violet-50">{curb65Data.confusion ? 'Present' : 'Absent'}</p>
              </div>
              <div className="rounded-lg border border-violet-300/20 bg-black/20 p-3">
                <p className="text-xs text-violet-200/70">Urea Level</p>
                <p className="text-base font-semibold text-violet-50">{curb65Data.urea ?? 'Not specified'} {curb65Data.ureaUnit}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-violet-300/20 bg-[rgba(18,13,32,0.74)] p-5">
            <h3 className="text-lg font-bold text-violet-50 mb-4">CURB-65 Component Breakdown</h3>
            <div className="space-y-2">
              {curb65Breakdown.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-violet-300/15 bg-black/20 p-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-violet-50">{item.label}</p>
                    <p className="text-sm text-violet-200/75">{item.description}</p>
                  </div>
                  <span className="shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border border-violet-300/30 bg-violet-300/15 text-violet-100">
                    {item.points} pt{item.points === 1 ? '' : 's'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-violet-300/20 bg-[linear-gradient(135deg,rgba(23,18,43,0.86),rgba(14,10,26,0.9))] p-5">
            <h3 className="text-lg font-bold text-violet-50 mb-3">Clinical Interpretation</h3>
            <p className="text-base font-semibold text-violet-100 mb-2">{severityResult.interpretation}</p>
            <p className="text-sm text-violet-100/80 leading-relaxed">{severityResult.recommendation}</p>
          </section>

          <div className="border-t border-violet-300/20 pt-4 text-center text-sm text-violet-200/70">
            <p>This report supports clinical decision-making and must be interpreted with physician judgment.</p>
            <p>
              Generated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 border-t border-violet-300/20 bg-[linear-gradient(180deg,rgba(16,12,29,0.95),rgba(12,9,21,0.98))] px-6 py-4 flex flex-wrap gap-3 justify-end print:hidden">
          <button
            onClick={handleDownload}
            className="analysis-action-secondary"
          >
            Download .txt
          </button>
          <button
            onClick={handlePrint}
            className="analysis-action-primary"
          >
            Print Report
          </button>
          <button
            onClick={onClose}
            className="analysis-action-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
