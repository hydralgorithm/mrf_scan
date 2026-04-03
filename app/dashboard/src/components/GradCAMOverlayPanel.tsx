interface GradCAMOverlayPanelProps {
  heatmapUrl: string | null
  loading: boolean
  error: string | null
  hasUploadedImage: boolean
}

export default function GradCAMOverlayPanel({
  heatmapUrl,
  loading,
  error,
  hasUploadedImage
}: GradCAMOverlayPanelProps) {
  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">GradCAM Overlay</h3>
        <span className="text-[11px] uppercase tracking-[0.12em] text-violet-200/75">Latest Upload</span>
      </div>

      {loading && hasUploadedImage && (
        <div className="rounded-lg border border-violet-300/30 bg-[linear-gradient(135deg,rgba(35,23,58,0.8),rgba(21,14,37,0.86))] p-4">
          <p className="text-sm text-violet-100/90">Generating blended heatmap from uploaded X-ray...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-rose-300/35 bg-[linear-gradient(135deg,rgba(74,17,39,0.72),rgba(39,10,21,0.76))] p-4">
          <p className="text-sm text-rose-100/95">{error}</p>
        </div>
      )}

      {!loading && !heatmapUrl && !error && (
        <div className="rounded-lg border border-violet-300/25 bg-[linear-gradient(135deg,rgba(33,22,56,0.72),rgba(19,13,34,0.76))] p-4">
          <p className="text-sm text-violet-100/90">
            {hasUploadedImage
              ? 'Heatmap will appear here after analysis completes.'
              : 'Upload an X-ray to generate a GradCAM blended overlay.'}
          </p>
        </div>
      )}

      {heatmapUrl && !loading && (
        <div className="rounded-xl overflow-hidden border border-violet-300/30 shadow-[0_14px_28px_rgba(6,5,18,0.45)] bg-black/20">
          <img
            src={heatmapUrl}
            alt="GradCAM blended overlay"
            className="w-full h-auto max-h-96 object-contain bg-gray-950/40"
          />
        </div>
      )}
    </div>
  )
}
