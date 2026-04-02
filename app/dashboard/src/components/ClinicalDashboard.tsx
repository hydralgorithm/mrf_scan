import { useState, useCallback, useRef } from 'react'
import { predictImage } from '../services/api'
import { PredictionResult, CURB65Data, SeverityResult } from '../types'
import { calculateCURB65, calculateCombinedSeverity, getCURB65Breakdown } from '../utils/severity'
import { TriageService } from '../services/triageService'
import ThemeToggle from './ThemeToggle'
import ImageUpload from './ImageUpload'
import XRayResults from './XRayResults'
import CURB65Form from './CURB65Form'
import SeverityDisplay from './SeverityDisplay'
import RiskBreakdown from './RiskBreakdown'
import ClinicalReport from './ClinicalReport'
import TriageQueue from './TriageQueue'

export default function ClinicalDashboard() {
  const [darkMode, setDarkMode] = useState(false)
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

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
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="glass-card mx-4 mt-4 p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-medical-blue dark:text-blue-400 mb-2">
              Pneumonia Severity Assessment Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Evidence-Based Clinical Decision Support (CURB-65)
            </p>
          </div>
          <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} />
        </div>
        
        {/* Mode Toggle */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTriageMode(false)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              !triageMode
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="text-xl">🔬</span>
            <span>Analysis Mode</span>
          </button>
          <button
            onClick={() => setTriageMode(true)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              triageMode
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="text-xl">🏥</span>
            <span>Triage Mode</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {TriageService.getStatistics().waiting}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content - Conditional Rendering */}
      {triageMode ? (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <TriageQueue />
        </div>
      ) : (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Column - X-ray Results */}
          <div className="space-y-6">
            <div className="glass-card p-6 animate-slide-up">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                X-ray Analysis
              </h2>
              
              <ImageUpload
                onUpload={handleImageUpload}
                imageUrl={imageUrl}
                loading={loading}
                error={error}
                ref={fileInputRef}
              />
              
              {prediction && (
                <XRayResults prediction={prediction} />
              )}
            </div>
          </div>

          {/* Right Column - CURB-65 Form */}
          <div className="space-y-6">
            <div className="glass-card p-6 animate-slide-up">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Patient Risk Assessment
              </h2>
              
              <CURB65Form
                data={curb65Data}
                onChange={handleCURB65Change}
                score={curb65Score}
              />
              
              {/* Calculate Score Button */}
              {prediction && !scoreCalculated && (
                <button
                  onClick={handleCalculateScore}
                  className="w-full mt-6 medical-button-primary bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 font-bold text-lg shadow-lg animate-pulse"
                >
                  🧮 Calculate Severity Score
                </button>
              )}
              
              {scoreCalculated && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg text-center animate-fade-in">
                  <p className="text-green-700 dark:text-green-400 font-semibold">
                    ✅ Score Calculated & Added to Triage Queue!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Severity Display */}
        {scoreCalculated && (
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <SeverityDisplay
              severityResult={severityResult}
              prediction={prediction}
            />
          </div>
        )}

        {/* Risk Breakdown */}
        {scoreCalculated && (
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <RiskBreakdown
              breakdown={curb65Breakdown}
              curb65Score={curb65Score}
              prediction={prediction}
            />
          </div>
        )}

        {/* Action Buttons */}
        {scoreCalculated && (
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <button
              onClick={handleGenerateReport}
              disabled={!prediction}
              className="medical-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📄 Generate Clinical Report
            </button>
            <button
              onClick={handleReset}
              className="medical-button-secondary"
            >
              🔄 Reset Form
            </button>
          </div>
        )}

        {/* Clinical Report Modal */}
        {showReport && prediction && (
          <ClinicalReport
            prediction={prediction}
            curb65Data={curb65Data}
            severityResult={severityResult}
            curb65Breakdown={curb65Breakdown}
            imageUrl={imageUrl}
            onClose={() => setShowReport(false)}
          />
        )}
      </div>
      )}
    </div>
  )
}
