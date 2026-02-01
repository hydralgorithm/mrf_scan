import axios from 'axios'
import { PredictionResult } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function predictImage(file: File): Promise<PredictionResult> {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await axios.post<PredictionResult>(
    `${API_BASE_URL}/predict`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  
  // Add probabilities alias for backward compatibility
  const data = response.data
  if (data.adjusted_probabilities && !data.probabilities) {
    data.probabilities = data.adjusted_probabilities
  }
  
  return data
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`)
    return response.data.status === 'healthy'
  } catch {
    return false
  }
}
