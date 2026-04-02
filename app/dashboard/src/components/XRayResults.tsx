import { PredictionResult } from '../types'

interface XRayResultsProps {
  prediction: PredictionResult
}

export default function XRayResults({ prediction }: XRayResultsProps) {
  const getClassificationColor = () => {
    if (prediction.classification === 'NORMAL') {
      return 'prediction-chip prediction-chip-normal'
    }
    if (prediction.classification === 'VIRAL_PNEUMONIA') {
      return 'prediction-chip prediction-chip-viral'
    }
    return 'prediction-chip prediction-chip-bacterial'
  }

  const getClassificationPanel = () => {
    if (prediction.classification === 'NORMAL') {
      return 'prediction-panel prediction-panel-normal'
    }
    if (prediction.classification === 'VIRAL_PNEUMONIA') {
      return 'prediction-panel prediction-panel-viral'
    }
    return 'prediction-panel prediction-panel-bacterial'
  }

  const getClassificationIcon = () => {
    if (prediction.classification === 'NORMAL') {
      return '✓'
    }
    return '🫁'
  }

  return (
    <div className="mt-6 space-y-4 animate-fade-in">
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          Model Prediction
        </h3>
        
        <div className="space-y-3">
          <div className={`flex items-center gap-3 ${getClassificationPanel()}`}>
            <span className="text-2xl">{getClassificationIcon()}</span>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400 mb-1">Classification</p>
              <p className="text-[clamp(1.9rem,2.2vw,2.45rem)] leading-[1.05] font-black tracking-tight text-gray-900 dark:text-gray-100">
                {prediction.classification.replace('_', ' ')}
              </p>
            </div>
            <span className={getClassificationColor()}>
              {getClassificationIcon()} {prediction.classification.replace('_', ' ')}
            </span>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-medical-blue to-medical-blue-dark h-full transition-all duration-1000 ease-out"
                  style={{ width: `${prediction.confidence * 100}%` }}
                />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {(prediction.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
