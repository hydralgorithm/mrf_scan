import { useState, useEffect } from 'react'
import { TriageService, PatientRecord } from '../services/triageService'

export default function TriageQueue() {
  const [queue, setQueue] = useState<PatientRecord[]>([])
  const [stats, setStats] = useState(TriageService.getStatistics())
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)

  useEffect(() => {
    loadQueue()
    // Poll for updates every 2 seconds
    const interval = setInterval(loadQueue, 2000)
    return () => clearInterval(interval)
  }, [])

  const loadQueue = () => {
    const updatedQueue = TriageService.getQueue()
    setQueue(updatedQueue)
    setStats(TriageService.getStatistics())
  }

  const handleStatusChange = (id: string, status: PatientRecord['status']) => {
    TriageService.updatePatientStatus(id, status)
    loadQueue()
  }

  const handleRemovePatient = (id: string) => {
    if (confirm('Are you sure you want to remove this patient from the queue?')) {
      TriageService.removePatient(id)
      setSelectedPatient(null)
      loadQueue()
    }
  }

  const handleClearQueue = () => {
    if (confirm('⚠️ This will clear the entire queue. Are you sure?')) {
      TriageService.clearQueue()
      setSelectedPatient(null)
      loadQueue()
    }
  }

  const getSeverityColor = (severity: number) => {
    if (severity === 0) return 'from-green-500 to-green-600'
    if (severity <= 3) return 'from-yellow-500 to-yellow-600'
    if (severity <= 6) return 'from-orange-500 to-orange-600'
    return 'from-red-500 to-red-600'
  }

  const getSeverityBadge = (riskLevel: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      moderate: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
    return colors[riskLevel as keyof typeof colors] || colors.low
  }

  const getStatusColor = (status: string) => {
    const colors = {
      waiting: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'in-treatment': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
    return colors[status as keyof typeof colors] || colors.waiting
  }

  const formatWaitTime = (timestamp: Date) => {
    const minutes = Math.floor((Date.now() - timestamp.getTime()) / 1000 / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
        <div className="glass-card p-4 hover:scale-105 transition-transform duration-300">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Patients</div>
          <div className="text-3xl font-bold text-medical-blue dark:text-blue-400">{stats.total}</div>
        </div>
        <div className="glass-card p-4 hover:scale-105 transition-transform duration-300">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Waiting</div>
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.waiting}</div>
        </div>
        <div className="glass-card p-4 hover:scale-105 transition-transform duration-300">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Treatment</div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.inTreatment}</div>
        </div>
        <div className="glass-card p-4 hover:scale-105 transition-transform duration-300">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Wait</div>
          <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">{stats.avgWaitTime}m</div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="glass-card p-4 animate-slide-up">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Priority Breakdown</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">High: {stats.highSeverity}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Moderate: {stats.moderateSeverity}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Low: {stats.lowSeverity}</span>
          </div>
        </div>
      </div>

      {/* Queue Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Priority Queue ({queue.length})
        </h2>
        <button
          onClick={handleClearQueue}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
        >
          🗑️ Clear Queue
        </button>
      </div>

      {/* Patient Queue */}
      {queue.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <div className="text-6xl mb-4">🏥</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Patients in Queue
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Upload an X-ray in Analysis mode to add patients to the triage queue
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((patient, index) => (
            <div
              key={patient.id}
              className={`glass-card p-4 hover:shadow-lg transition-all duration-300 cursor-pointer animate-slide-up ${
                selectedPatient?.id === patient.id ? 'ring-2 ring-medical-blue dark:ring-blue-500' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => setSelectedPatient(patient)}
            >
              <div className="flex items-center gap-4">
                {/* Priority Number */}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getSeverityColor(patient.severityResult.finalSeverity)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {index + 1}
                </div>

                {/* Patient Image Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                  <img
                    src={patient.imageData}
                    alt="X-ray"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Patient Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      Patient #{patient.id.slice(-8)}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityBadge(patient.severityResult.riskLevel)}`}>
                      {patient.severityResult.riskLevel.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                      {patient.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {patient.prediction.classification.replace('_', ' ')} • 
                    Severity: {patient.severityResult.finalSeverity}/10 • 
                    Wait: {formatWaitTime(patient.timestamp)}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  {patient.status === 'waiting' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStatusChange(patient.id, 'in-treatment')
                      }}
                      className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm font-medium transition-colors duration-200"
                    >
                      Start Treatment
                    </button>
                  )}
                  {patient.status === 'in-treatment' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStatusChange(patient.id, 'completed')
                      }}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium transition-colors duration-200"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemovePatient(patient.id)
                    }}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors duration-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setSelectedPatient(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto glass-card animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-medical-blue dark:text-blue-400">
                Patient Details
              </h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <img
                src={selectedPatient.imageData}
                alt="X-ray"
                className="w-full rounded-lg"
              />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Classification</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedPatient.prediction.classification.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Confidence</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {(selectedPatient.prediction.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Severity Score</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedPatient.severityResult.finalSeverity}/10
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">CURB-65 Score</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedPatient.severityResult.curb65Score}/5
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Clinical Recommendation:
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedPatient.severityResult.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
