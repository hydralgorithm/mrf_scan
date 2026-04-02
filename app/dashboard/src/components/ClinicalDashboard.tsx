import { useState, useCallback, useRef } from 'react'
import { predictImage } from '../services/api'
import { PredictionResult, CURB65Data } from '../types'
import { calculateCURB65, calculateCombinedSeverity, getCURB65Breakdown } from '../utils/severity'
import { TriageService } from '../services/triageService'
import MainDashboardPage from '../pages/MainDashboardPage'
import TriageModePage from '../pages/TriageModePage'
import { CartoonButton } from './ui/cartoon-button'

export default function ClinicalDashboard() {
  const [triageMode, setTriageMode] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scoreCalculated, setScoreCalculated] = useState(false)
  
  const [curb65Data, setCURB65Data] = useState<CURB65Data>({
    age: null,
    respiratoryRate: null,
    systolicBP: null,
    diastolicBP: null,
    confusion: false,
    urea: null,
  })
  
  const [showReport, setShowReport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    setScoreCalculated(false)
    
    try {
      // Create preview URL
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      
      // Predict
      const result = await predictImage(file)
      setPrediction(result)
      
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to predict image')
      setImageUrl(null)
      setPrediction(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCalculateScore = () => {
    if (!prediction || !imageUrl) return
    
    // Mark score as calculated to show results
    setScoreCalculated(true)
    
    // Convert image to base64 and add to triage queue
    fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const imageData = reader.result as string
          
          // Calculate final severity and add to triage queue
          const finalCurb65Score = calculateCURB65(curb65Data)
          const finalSeverityResult = calculateCombinedSeverity(prediction, finalCurb65Score)
          
          TriageService.addPatient({
            imageData,
            prediction,
            curb65Data,
            severityResult: finalSeverityResult
          })
        }
        reader.readAsDataURL(blob)
      })
  }

  const handleCURB65Change = (field: keyof CURB65Data, value: any) => {
    setCURB65Data(prev => ({ ...prev, [field]: value }))
    // Reset score when data changes
    setScoreCalculated(false)
  }

  const curb65Score = scoreCalculated ? calculateCURB65(curb65Data) : 0
  const severityResult = scoreCalculated ? calculateCombinedSeverity(prediction, curb65Score) : {
    finalSeverity: 0,
    curb65Score: 0,
    interpretation: 'Press "Calculate Score" to assess severity',
    recommendation: 'Complete patient information and press the button below',
    riskLevel: 'low' as const
  }
  const curb65Breakdown = getCURB65Breakdown(curb65Data)

  const handleReset = () => {
    setPrediction(null)
    setImageUrl(null)
    setCURB65Data({
      age: null,
      respiratoryRate: null,
      systolicBP: null,
      diastolicBP: null,
      confusion: false,
      urea: null,
    })
    setError(null)
    setScoreCalculated(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGenerateReport = () => {
    setShowReport(true)
  }

  return (
    <div className="min-h-screen transition-colors duration-300 dark">
      {/* Header */}
      <header className="glass-card mx-4 mt-4 p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#d8c5ff] mb-2">
              Pneumonia Severity Assessment Dashboard
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              Evidence-Based Clinical Decision Support (CURB-65)
            </p>
          </div>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          <CartoonButton
            label="Analysis Mode"
            onClick={() => setTriageMode(false)}
            hasHighlight={!triageMode}
            color={
              !triageMode
                ? 'bg-[linear-gradient(135deg,#b89cff,#8b5cf6)]'
                : 'bg-[linear-gradient(135deg,rgba(37,24,61,0.95),rgba(21,14,37,0.95))]'
            }
          />
          <CartoonButton
            label={`Triage Mode  ${TriageService.getStatistics().waiting}`}
            onClick={() => setTriageMode(true)}
            hasHighlight={triageMode}
            color={
              triageMode
                ? 'bg-[linear-gradient(135deg,#a882ff,#7c3aed)]'
                : 'bg-[linear-gradient(135deg,rgba(37,24,61,0.95),rgba(21,14,37,0.95))]'
            }
          />
        </div>
      </header>

      {/* Main Content - Conditional Rendering */}
      {triageMode ? (
        <TriageModePage />
      ) : (
        <MainDashboardPage
          prediction={prediction}
          imageUrl={imageUrl}
          loading={loading}
          error={error}
          fileInputRef={fileInputRef}
          curb65Data={curb65Data}
          onCURB65Change={handleCURB65Change}
          curb65Score={curb65Score}
          scoreCalculated={scoreCalculated}
          severityResult={severityResult}
          curb65Breakdown={curb65Breakdown}
          onCalculateScore={handleCalculateScore}
          onGenerateReport={handleGenerateReport}
          onReset={handleReset}
          showReport={showReport}
          onCloseReport={() => setShowReport(false)}
          onUpload={handleImageUpload}
        />
      )}
    </div>
  )
}
