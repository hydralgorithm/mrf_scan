import { PredictionResult, CURB65Data, SeverityResult } from '../types'

export function calculateCURB65(data: CURB65Data): number {
  let score = 0
  
  // Age >= 65
  if (data.age !== null && data.age >= 65) {
    score += 1
  }
  
  // Respiratory rate >= 30
  if (data.respiratoryRate !== null && data.respiratoryRate >= 30) {
    score += 1
  }
  
  // Low BP: SBP < 90 OR DBP <= 60
  if (
    (data.systolicBP !== null && data.systolicBP < 90) ||
    (data.diastolicBP !== null && data.diastolicBP <= 60)
  ) {
    score += 1
  }
  
  // Confusion
  if (data.confusion) {
    score += 1
  }
  
  // Urea > 7 mmol/L
  if (data.urea !== null && data.urea > 7) {
    score += 1
  }
  
  return score
}

export function calculateCombinedSeverity(
  prediction: PredictionResult | null,
  curb65Score: number
): SeverityResult {
  if (!prediction) {
    return {
      finalSeverity: 0,
      curb65Score: 0,
      interpretation: 'No prediction available',
      recommendation: 'Please upload an X-ray image first',
      riskLevel: 'low'
    }
  }
  
  // If NORMAL, return 0
  if (prediction.classification === 'NORMAL') {
    return {
      finalSeverity: 0,
      curb65Score,
      interpretation: '✓ NORMAL - No pneumonia detected',
      recommendation: 'No further action required. Patient shows no signs of pneumonia.',
      riskLevel: 'low'
    }
  }
  
  // Map CURB-65 to base severity
  let baseSeverity: number
  if (curb65Score <= 1) {
    baseSeverity = 2
  } else if (curb65Score === 2) {
    baseSeverity = 5
  } else { // 3-5
    baseSeverity = 8
  }
  
  // Add +1 for bacterial pneumonia (higher risk)
  if (prediction.classification === 'BACTERIAL_PNEUMONIA') {
    baseSeverity = Math.min(baseSeverity + 1, 10)
  }
  
  const finalSeverity = Math.min(baseSeverity, 10)
  
  // Determine risk level
  let riskLevel: 'low' | 'moderate' | 'high'
  let interpretation: string
  let recommendation: string
  
  if (finalSeverity === 0) {
    riskLevel = 'low'
    interpretation = '✓ NORMAL - No pneumonia detected'
    recommendation = 'No further action required.'
  } else if (finalSeverity >= 1 && finalSeverity <= 3) {
    riskLevel = 'low'
    interpretation = '⚠️ LOW SEVERITY - Outpatient management recommended'
    recommendation = 'Patient may be managed as outpatient with close monitoring. Consider follow-up in 24-48 hours.'
  } else if (finalSeverity >= 4 && finalSeverity <= 6) {
    riskLevel = 'moderate'
    interpretation = '⚠️ MODERATE SEVERITY - Hospital admission recommended'
    recommendation = 'Hospital admission is recommended for close monitoring and treatment. Consider IV antibiotics if bacterial.'
  } else { // 7-10
    riskLevel = 'high'
    interpretation = '🚨 HIGH SEVERITY - ICU consideration recommended'
    recommendation = 'Immediate hospital admission and ICU consideration. High risk of complications. Initiate aggressive treatment protocol.'
  }
  
  return {
    finalSeverity,
    curb65Score,
    interpretation,
    recommendation,
    riskLevel
  }
}

export function getCURB65Breakdown(data: CURB65Data): Array<{ label: string; points: number; description: string }> {
  return [
    {
      label: 'Age ≥65',
      points: (data.age !== null && data.age >= 65) ? 1 : 0,
      description: data.age !== null ? `Patient age ${data.age} years` : 'Age not specified'
    },
    {
      label: 'Respiratory Rate ≥30',
      points: (data.respiratoryRate !== null && data.respiratoryRate >= 30) ? 1 : 0,
      description: data.respiratoryRate !== null 
        ? (data.respiratoryRate >= 30 ? `Respiratory rate elevated (${data.respiratoryRate} bpm)` : `Respiratory rate normal (${data.respiratoryRate} bpm)`)
        : 'Respiratory rate not specified'
    },
    {
      label: 'Low Blood Pressure',
      points: ((data.systolicBP !== null && data.systolicBP < 90) || (data.diastolicBP !== null && data.diastolicBP <= 60)) ? 1 : 0,
      description: (data.systolicBP !== null && data.diastolicBP !== null)
        ? ((data.systolicBP < 90 || data.diastolicBP <= 60) ? `Blood pressure low (${data.systolicBP}/${data.diastolicBP} mmHg)` : `Blood pressure stable (${data.systolicBP}/${data.diastolicBP} mmHg)`)
        : 'Blood pressure not specified'
    },
    {
      label: 'Confusion',
      points: data.confusion ? 1 : 0,
      description: data.confusion ? 'Acute confusion present' : 'No acute confusion'
    },
    {
      label: 'Urea >7 mmol/L',
      points: (data.urea !== null && data.urea > 7) ? 1 : 0,
      description: data.urea !== null 
        ? (data.urea > 7 ? `Urea level elevated (${data.urea} mmol/L)` : `Urea level normal (${data.urea} mmol/L)`)
        : 'Urea level not specified'
    }
  ]
}
