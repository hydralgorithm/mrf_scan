export interface PredictionResult {
  classification: 'NORMAL' | 'BACTERIAL_PNEUMONIA' | 'VIRAL_PNEUMONIA'
  confidence: number
  raw_probabilities: {
    NORMAL: number
    BACTERIAL_PNEUMONIA: number
    VIRAL_PNEUMONIA: number
  }
  adjusted_probabilities: {
    NORMAL: number
    BACTERIAL_PNEUMONIA: number
    VIRAL_PNEUMONIA: number
  }
  probabilities?: {
    NORMAL: number
    BACTERIAL_PNEUMONIA: number
    VIRAL_PNEUMONIA: number
  }
  base_severity: number
  class_index: number
  thresholded?: boolean
  smart_thresholding_applied?: boolean
  pneumonia_min_confidence?: number
}

export interface CURB65Data {
  age: number | null
  respiratoryRate: number | null
  systolicBP: number | null
  diastolicBP: number | null
  confusion: boolean
  urea: number | null
}

export interface SeverityResult {
  finalSeverity: number
  curb65Score: number
  interpretation: string
  recommendation: string
  riskLevel: 'low' | 'moderate' | 'high'
}
