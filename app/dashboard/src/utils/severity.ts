import { PredictionResult, CURB65Data, SeverityResult } from '../types'

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getModelContributionOutOfFive(prediction: PredictionResult): number {
  // Requested behavior: do not let model confidence dominate triage.
  // Use a fixed default contribution whenever pneumonia is detected.
  if (prediction.classification === 'NORMAL') {
    return 0
  }

  return 1
}

export function calculateCURB65(data: CURB65Data): number {
  let score = 0
  const age = toNumberOrNull(data.age)
  const respiratoryRate = toNumberOrNull(data.respiratoryRate)
  const systolicBP = toNumberOrNull(data.systolicBP)
  const diastolicBP = toNumberOrNull(data.diastolicBP)
  const urea = toNumberOrNull(data.urea)
  const ureaUnit = data.ureaUnit ?? 'mmol/L'
  
  // Age >= 65
  if (age !== null && age >= 65) {
    score += 1
  }
  
  // Respiratory rate >= 30
  if (respiratoryRate !== null && respiratoryRate >= 30) {
    score += 1
  }
  
  // Low BP: SBP < 90 OR DBP <= 60
  if (
    (systolicBP !== null && systolicBP < 90) ||
    (diastolicBP !== null && diastolicBP <= 60)
  ) {
    score += 1
  }
  
  // Confusion
  if (data.confusion) {
    score += 1
  }
  
  // Urea > 7 mmol/L
  const hasHighUrea = urea !== null && (
    (ureaUnit === 'mmol/L' && urea > 7) ||
    (ureaUnit === 'mg/dL' && urea > 19)
  )
  if (hasHighUrea) {
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
    if (curb65Score >= 2) {
      const highRiskAbnormal = curb65Score >= 3

      return {
        finalSeverity: 0,
        curb65Score,
        interpretation: highRiskAbnormal
          ? 'No pneumonia on X-ray, but clinical condition is significantly abnormal'
          : 'No pneumonia on X-ray, but clinical condition is abnormal',
        recommendation: highRiskAbnormal
          ? 'Despite a normal chest X-ray, CURB-65 findings indicate high clinical risk. Arrange urgent physician review and evaluate for non-pneumonia causes or early disease not visible on imaging.'
          : 'Chest X-ray appears normal, but CURB-65 findings are not reassuring. Recommend prompt clinical reassessment and consultation with a physician for further workup.',
        riskLevel: highRiskAbnormal ? 'high' : 'moderate',
        advisoryOnly: true,
        advisoryTitle: highRiskAbnormal ? 'Clinical Red Flag' : 'Clinical Caution'
      }
    }

    return {
      finalSeverity: 0,
      curb65Score,
      interpretation: 'No pneumonia detected and no major clinical concern on CURB-65.',
      recommendation: 'If symptoms persist, consult another physician for follow-up.',
      riskLevel: 'low',
      advisoryOnly: false,
      reassuranceOnly: true,
      advisoryTitle: 'Reassuring Findings'
    }
  }
  
  // CURB-65 anchored hybrid:
  // - CURB-65 contributes 0..5 (primary clinical anchor)
  // - Model contributes 0..5 (bounded imaging support)
  // - Final score uses additive base + clinical guardrails aligned to CURB dispositions.
  const curbContribution = clamp(curb65Score, 0, 5)
  const modelContribution = getModelContributionOutOfFive(prediction)
  let finalSeverity = clamp(curbContribution + modelContribution, 1, 10)
  const guardrailsApplied: string[] = []

  // Guardrails aligned with CURB-65 dispositions:
  // CURB 0-1: generally lower mortality bucket; avoid emergency scores from model alone.
  if (curbContribution <= 1) {
    finalSeverity = Math.min(finalSeverity, 6)
    guardrailsApplied.push('CURB 0-1 cap: final score <= 6')
  }

  // CURB 2: inpatient/observation bucket; should not look trivially low.
  if (curbContribution === 2) {
    finalSeverity = Math.max(finalSeverity, 4)
    guardrailsApplied.push('CURB 2 floor: final score >= 4')
  }

  // CURB 3+: severe clinical risk; enforce higher floor.
  if (curbContribution >= 3) {
    finalSeverity = Math.max(finalSeverity, 7)
    guardrailsApplied.push('CURB >=3 floor: final score >= 7')
  }

  if (curbContribution >= 4) {
    finalSeverity = Math.max(finalSeverity, 8)
    guardrailsApplied.push('CURB >=4 floor: final score >= 8')
  }

  if (curbContribution === 5) {
    finalSeverity = Math.max(finalSeverity, 9)
    guardrailsApplied.push('CURB 5 floor: final score >= 9')
  }

  finalSeverity = clamp(finalSeverity, 1, 10)
  
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
  } else if (finalSeverity <= 8) {
    riskLevel = 'high'
    interpretation = '🚨 SEVERE RISK - Urgent admission and escalation required'
    recommendation = 'Urgent inpatient admission is recommended. Escalate monitoring and prepare for rapid deterioration management.'
  } else {
    riskLevel = 'high'
    interpretation = '🛑 EMERGENCY RISK - ICU-level evaluation immediately'
    recommendation = 'Immediate emergency escalation. Arrange ICU-level evaluation and sepsis-focused assessment without delay.'
  }

  return {
    finalSeverity,
    curb65Score,
    interpretation,
    recommendation,
    riskLevel,
    advisoryOnly: false,
    reassuranceOnly: false
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
      label: data.ureaUnit === 'mg/dL' ? 'BUN >19 mg/dL' : 'Urea >7 mmol/L',
      points: (data.urea !== null && ((data.ureaUnit === 'mg/dL' && data.urea > 19) || ((data.ureaUnit ?? 'mmol/L') === 'mmol/L' && data.urea > 7))) ? 1 : 0,
      description: data.urea !== null 
        ? (((data.ureaUnit === 'mg/dL' && data.urea > 19) || ((data.ureaUnit ?? 'mmol/L') === 'mmol/L' && data.urea > 7))
          ? `${data.ureaUnit === 'mg/dL' ? 'BUN' : 'Urea'} level elevated (${data.urea} ${data.ureaUnit})`
          : `${data.ureaUnit === 'mg/dL' ? 'BUN' : 'Urea'} level normal (${data.urea} ${data.ureaUnit})`)
        : 'Urea level not specified'
    }
  ]
}
