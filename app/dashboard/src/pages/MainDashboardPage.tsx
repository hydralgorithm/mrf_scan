import { RefObject } from 'react'
import { PredictionResult, CURB65Data, SeverityResult } from '../types'
import ImageUpload from '../components/ImageUpload'
import XRayResults from '../components/XRayResults'
import CURB65Form from '../components/CURB65Form'
import SeverityDisplay from '../components/SeverityDisplay'
import RiskBreakdown from '../components/RiskBreakdown'
import ClinicalReport from '../components/ClinicalReport'
import Dither from '../components/Dither'
import MagicBentoPanel from '../components/MagicBentoPanel'
import BorderGlow from '../components/BorderGlow.jsx'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'

interface MainDashboardPageProps {
  prediction: PredictionResult | null
  imageUrl: string | null
  loading: boolean
  error: string | null
  fileInputRef: RefObject<HTMLInputElement>
  curb65Data: CURB65Data
  onCURB65Change: (field: keyof CURB65Data, value: number | boolean | null) => void
  curb65Score: number
  scoreCalculated: boolean
  severityResult: SeverityResult
  curb65Breakdown: Array<{ label: string; points: number; description: string }>
  onCalculateScore: () => void
  onGenerateReport: () => void
  onReset: () => void
  showReport: boolean
  onCloseReport: () => void
  onUpload: (file: File) => void
}

export default function MainDashboardPage({
  prediction,
  imageUrl,
  loading,
  error,
  fileInputRef,
  curb65Data,
  onCURB65Change,
  curb65Score,
  scoreCalculated,
  severityResult,
  curb65Breakdown,
  onCalculateScore,
  onGenerateReport,
  onReset,
  showReport,
  onCloseReport,
  onUpload
}: MainDashboardPageProps) {
  return (
    <>
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div style={{ width: '100%', height: '100%', position: 'relative', opacity: 0.32 }}>
          <Dither
            waveColor={[0.6470588235294118,0.5607843137254902,1]}
            disableAnimation={false}
            enableMouseInteraction
            mouseRadius={0.1}
            colorNum={11}
            pixelSize={2}
            waveAmplitude={0.3}
            waveFrequency={3}
            waveSpeed={0.05}
          />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-y-6">
          <MagicBentoPanel
            className="p-6 animate-slide-up"
            textAutoHide={true}
            enableStars
            enableSpotlight
            enableBorderGlow={true}
            enableTilt={false}
            enableMagnetism={false}
            clickEffect
            spotlightRadius={400}
            particleCount={12}
            glowColor="132, 0, 255"
            disableAnimations={false}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              X-ray Analysis
            </h2>

            <ImageUpload
              onUpload={onUpload}
              imageUrl={imageUrl}
              loading={loading}
              error={error}
              ref={fileInputRef}
            />

            {prediction && <XRayResults prediction={prediction} />}
          </MagicBentoPanel>
        </div>

        <div className="space-y-6">
          <MagicBentoPanel
            className="p-6 animate-slide-up"
            textAutoHide={true}
            enableStars
            enableSpotlight
            enableBorderGlow={true}
            enableTilt={false}
            enableMagnetism={false}
            clickEffect
            spotlightRadius={400}
            particleCount={12}
            glowColor="132, 0, 255"
            disableAnimations={false}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Patient Risk Assessment
            </h2>

            <CURB65Form
              data={curb65Data}
              onChange={onCURB65Change}
              score={curb65Score}
              showScore={scoreCalculated}
            />

            {prediction && !scoreCalculated && (
              <BorderGlow
                edgeSensitivity={30}
                glowColor="40 80 80"
                backgroundColor="#311858"
                borderRadius={18}
                glowRadius={24}
                glowIntensity={1}
                coneSpread={25}
                animated={false}
                colors={['#c084fc', '#f472b6', '#38bdf8']}
                className="w-full mt-6"
              >
                <button
                  onClick={onCalculateScore}
                  className="w-full py-4 px-4 text-lg font-semibold tracking-wide text-violet-50 bg-transparent border-0 outline-none transition-all duration-200 hover:text-white"
                >
                  Calculate Severity Score
                </button>
              </BorderGlow>
            )}

            {scoreCalculated && (
              <Alert className="mt-6 rounded-xl border border-emerald-300/55 bg-[linear-gradient(135deg,rgba(10,54,44,0.9),rgba(7,33,28,0.92))] shadow-[0_12px_26px_rgba(5,44,34,0.35)] animate-fade-in px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-300/20 border border-emerald-200/50 text-emerald-100 text-sm">
                    ✓
                  </span>
                  <div>
                    <AlertTitle className="text-emerald-100 text-base font-bold tracking-wide">
                      Score Calculated
                    </AlertTitle>
                    <AlertDescription className="text-emerald-100/85 text-sm leading-relaxed">
                      Added to triage queue successfully.
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
          </MagicBentoPanel>
        </div>
      </div>

      {scoreCalculated && (
        <MagicBentoPanel
          className="p-6 mb-6 animate-fade-in"
          textAutoHide={true}
          enableStars
          enableSpotlight
          enableBorderGlow={true}
          enableTilt={false}
          enableMagnetism={false}
          clickEffect
          spotlightRadius={400}
          particleCount={12}
          glowColor="132, 0, 255"
          disableAnimations={false}
        >
          <SeverityDisplay
            severityResult={severityResult}
            prediction={prediction}
          />
        </MagicBentoPanel>
      )}

      {scoreCalculated && prediction && (
        <MagicBentoPanel
          className="p-6 mb-6 animate-fade-in"
          textAutoHide={true}
          enableStars
          enableSpotlight
          enableBorderGlow={true}
          enableTilt={false}
          enableMagnetism={false}
          clickEffect
          spotlightRadius={400}
          particleCount={12}
          glowColor="132, 0, 255"
          disableAnimations={false}
        >
          <RiskBreakdown
            breakdown={curb65Breakdown}
            curb65Score={curb65Score}
            prediction={prediction}
          />
        </MagicBentoPanel>
      )}

      {scoreCalculated && (
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <button
            onClick={onGenerateReport}
            disabled={!prediction}
            className="uiverse-btn uiverse-btn-primary"
          >
            Generate Clinical Report
          </button>
          <button
            onClick={onReset}
            className="uiverse-btn uiverse-btn-secondary"
          >
            Reset Form
          </button>
        </div>
      )}

      {showReport && prediction && (
        <ClinicalReport
          prediction={prediction}
          curb65Data={curb65Data}
          severityResult={severityResult}
          curb65Breakdown={curb65Breakdown}
          imageUrl={imageUrl}
          onClose={onCloseReport}
        />
      )}
      </div>
    </>
  )
}
