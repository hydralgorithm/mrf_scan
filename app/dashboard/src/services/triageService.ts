import { PredictionResult, CURB65Data, SeverityResult } from '../types'

export interface PatientRecord {
  id: string
  timestamp: Date
  imageData: string  // base64 encoded image
  prediction: PredictionResult
  curb65Data: CURB65Data
  severityResult: SeverityResult
  status: 'waiting' | 'in-treatment' | 'completed'
  patientName?: string
  patientAge?: number
  notes?: string
}

const STORAGE_KEY = 'pneumonia_triage_queue'

export class TriageService {
  
  static getQueue(): PatientRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return []
      
      const records = JSON.parse(data) as PatientRecord[]
      // Convert timestamp strings back to Date objects
      const queue = records.map(record => ({
        ...record,
        timestamp: new Date(record.timestamp)
      }))
      
      // Always return sorted queue by severity (highest first)
      return this.sortBySeverity(queue)
    } catch (error) {
      console.error('Error loading triage queue:', error)
      return []
    }
  }

  static saveQueue(queue: PatientRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
    } catch (error) {
      console.error('Error saving triage queue:', error)
    }
  }

  static addPatient(record: Omit<PatientRecord, 'id' | 'timestamp' | 'status'>): PatientRecord {
    const newRecord: PatientRecord = {
      ...record,
      id: `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'waiting'
    }

    const queue = this.getQueue()
    queue.push(newRecord)
    
    // Sort by severity (highest first) and then by timestamp (oldest first)
    const sortedQueue = this.sortBySeverity(queue)
    this.saveQueue(sortedQueue)
    
    return newRecord
  }

  static sortBySeverity(queue: PatientRecord[]): PatientRecord[] {
    return [...queue].sort((a, b) => {
      // First priority: severity score (descending)
      if (b.severityResult.finalSeverity !== a.severityResult.finalSeverity) {
        return b.severityResult.finalSeverity - a.severityResult.finalSeverity
      }
      // Second priority: timestamp (ascending - earlier patients first)
      return a.timestamp.getTime() - b.timestamp.getTime()
    })
  }

  static updatePatientStatus(id: string, status: PatientRecord['status']): void {
    const queue = this.getQueue()
    const index = queue.findIndex(record => record.id === id)
    
    if (index !== -1) {
      queue[index].status = status
      this.saveQueue(queue)
    }
  }

  static removePatient(id: string): void {
    const queue = this.getQueue()
    const filtered = queue.filter(record => record.id !== id)
    this.saveQueue(filtered)
  }

  static clearQueue(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  static getStatistics() {
    const queue = this.getQueue()
    
    const waiting = queue.filter(p => p.status === 'waiting')
    const inTreatment = queue.filter(p => p.status === 'in-treatment')
    const completed = queue.filter(p => p.status === 'completed')
    
    const highSeverity = waiting.filter(p => p.severityResult.riskLevel === 'high').length
    const moderateSeverity = waiting.filter(p => p.severityResult.riskLevel === 'moderate').length
    const lowSeverity = waiting.filter(p => p.severityResult.riskLevel === 'low').length
    
    return {
      total: queue.length,
      waiting: waiting.length,
      inTreatment: inTreatment.length,
      completed: completed.length,
      highSeverity,
      moderateSeverity,
      lowSeverity,
      avgWaitTime: this.calculateAverageWaitTime(waiting)
    }
  }

  private static calculateAverageWaitTime(waiting: PatientRecord[]): number {
    if (waiting.length === 0) return 0
    
    const now = new Date().getTime()
    const totalWaitTime = waiting.reduce((sum, patient) => {
      return sum + (now - patient.timestamp.getTime())
    }, 0)
    
    return Math.floor(totalWaitTime / waiting.length / 1000 / 60) // minutes
  }
}
